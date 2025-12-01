import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { computePeriodFromDate } from "@/lib/invoices";
import { analyzeInvoiceFile, isValidInvoice, getRejectionReason } from "@/lib/invoiceAI";

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const entries = formData.getAll("files");

  const archivalOnlyRaw = formData.get("archivalOnly");
  const archivalOnly =
    archivalOnlyRaw === "true" ||
    archivalOnlyRaw === "1" ||
    archivalOnlyRaw === "on";

  const sendToGestoriaRaw = formData.get("sendToGestoria");
  const sendToGestoria =
    sendToGestoriaRaw === "true" ||
    sendToGestoriaRaw === "1" ||
    sendToGestoriaRaw === "on";

  if (!entries.length) {
    return NextResponse.json({ error: "No se han enviado archivos" }, { status: 400 });
  }

  const maxFiles = 20;
  const maxSizeBytes = 20 * 1024 * 1024;
  const allowedMimePrefixes = ["image/", "application/pdf"];

  if (entries.length > maxFiles) {
    return NextResponse.json(
      { error: `Maximo ${maxFiles} archivos por subida` },
      { status: 400 }
    );
  }

  // Detectar si viene de móvil para marcar upload_source correctamente
  const uploadSourceRaw = formData.get("uploadSource");
  const uploadSource =
    uploadSourceRaw === "mobile_upload" ? "mobile_upload" : "web_upload";

  const results: {
    originalName: string;
    id?: string;
    error?: string;
    // Datos extraídos por IA (para que el móvil los muestre)
    supplier?: string;
    category?: string;
    amount?: string;
    date?: string;
    status?: string;
    invoiceNumber?: string | null;
  }[] = [];

  let gestoriaEmail: string | null = null;
  let clientDisplayName: string = "Tu cliente";
  const resendApiKey = process.env.RESEND_API_KEY || null;
  const fromEmail = process.env.GESTORIA_FROM_EMAIL || null;

  if (sendToGestoria && resendApiKey && fromEmail) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("gestoria_email, first_name, last_name, display_name")
      .eq("id", user.id)
      .maybeSingle<{
        gestoria_email: string | null;
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
      }>();

    if (profileError) {
      console.error("Error al obtener perfil para envio a gestoria en subida:", profileError);
    }

    gestoriaEmail = (profile?.gestoria_email ?? "").trim() || null;
    const first = (profile?.first_name ?? "").trim();
    const last = (profile?.last_name ?? "").trim();
    const combined = `${first} ${last}`.trim();
    clientDisplayName = combined || profile?.display_name || user.email || "Tu cliente";
  }

  for (const entry of entries) {
    if (typeof entry === "string") {
      results.push({ originalName: "", error: "Entrada de archivo invalida" });
      continue;
    }

    const file = entry as File;
    const originalName = file.name || "archivo";

    if (!file.size) {
      results.push({ originalName, error: "Archivo vacio" });
      continue;
    }

    if (file.size > maxSizeBytes) {
      results.push({ originalName, error: "Archivo demasiado grande" });
      continue;
    }

    const mime = file.type || "application/octet-stream";
    const isAllowed =
      allowedMimePrefixes.some((prefix) => mime.startsWith(prefix)) ||
      originalName.toLowerCase().endsWith(".pdf");

    if (!isAllowed) {
      results.push({ originalName, error: "Tipo de archivo no permitido" });
      continue;
    }

    // =====================================================
    // PASO 1: Analizar el documento con IA ANTES de guardar
    // =====================================================
    const fileBuffer = await file.arrayBuffer();
    const ai = await analyzeInvoiceFile(fileBuffer, mime);

    // Verificar si es una factura válida
    if (!ai || !isValidInvoice(ai)) {
      const reason = getRejectionReason(ai);
      results.push({
        originalName,
        error: reason,
      });
      continue; // NO subimos a Storage, NO creamos fila en invoices
    }

    // =====================================================
    // PASO 2: Es factura válida → preparar datos
    // =====================================================
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const todayStr = `${year}-${month}-${String(now.getDate()).padStart(2, "0")}`;

    // Usar fecha de la factura si la IA la detectó, sino fecha de hoy
    const invoiceDate = ai.date || todayStr;

    const { period_type, period_key, folder_path } = computePeriodFromDate(
      invoiceDate,
      "month"
    );

    // Extraer datos de la IA
    const supplier = ai.supplier || "Proveedor pendiente";
    // Combinar categoría y concepto para más contexto
    const baseCategory = ai.category || "Sin clasificar";
    const concept = ai.concept;
    const category = concept ? `${baseCategory} - ${concept}` : baseCategory;
    const invoiceNumber = ai.invoiceNumber || null;

    let amount = "0.00 EUR";
    let totalAmountNum = 0;
    if (ai.totalAmount != null && Number.isFinite(ai.totalAmount) && ai.totalAmount > 0) {
      totalAmountNum = ai.totalAmount;
      const currency = (ai.currency ?? "EUR").toUpperCase();
      amount = `${ai.totalAmount.toFixed(2)} ${currency}`;
    }

    // =====================================================
    // PASO 2.5: Verificar si ya existe una factura duplicada
    // =====================================================
    // Combinamos: usuario + proveedor + fecha + importe (y número de factura si existe)
    let duplicateQuery = supabase
      .from("invoices")
      .select("id, supplier, date, amount, invoice_number")
      .eq("user_id", user.id)
      .eq("date", invoiceDate)
      .ilike("supplier", supplier); // Case-insensitive match

    // Si tenemos importe, también lo usamos para filtrar
    if (totalAmountNum > 0) {
      duplicateQuery = duplicateQuery.eq("amount", amount);
    }

    const { data: possibleDuplicates } = await duplicateQuery;

    if (possibleDuplicates && possibleDuplicates.length > 0) {
      // Si hay número de factura, verificar si coincide exactamente
      if (invoiceNumber) {
        const exactDuplicate = possibleDuplicates.find(
          (inv) => inv.invoice_number === invoiceNumber
        );
        if (exactDuplicate) {
          results.push({
            originalName,
            error: `Esta factura ya existe en el sistema (Nº ${invoiceNumber} de ${supplier}, fecha ${invoiceDate}).`,
          });
          continue;
        }
      } else {
        // Sin número de factura, pero mismo proveedor + fecha + importe = probable duplicado
        results.push({
          originalName,
          error: `Posible duplicado: ya existe una factura de ${supplier} con fecha ${invoiceDate} e importe ${amount}.`,
        });
        continue;
      }
    }

    // =====================================================
    // PASO 3: Subir a Storage
    // =====================================================
    const ext = (() => {
      const dotIndex = originalName.lastIndexOf(".");
      if (dotIndex === -1) return "";
      return originalName.slice(dotIndex).toLowerCase();
    })();

    const baseFolder = `${user.id}/${year}-${month}`;
    const fileName = `${crypto.randomUUID()}${ext}`;
    const storagePath = `${baseFolder}/${fileName}`;

    const upload = await supabase.storage
      .from("invoices")
      .upload(storagePath, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: mime,
      });

    if (upload.error) {
      results.push({ originalName, error: "No se pudo subir el archivo" });
      continue;
    }

    // =====================================================
    // PASO 4: Crear factura con datos extraídos por IA
    // =====================================================
    const insert = await supabase
      .from("invoices")
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        date: invoiceDate,
        supplier,
        category,
        amount,
        invoice_number: invoiceNumber,
        status: archivalOnly ? "Archivada" : "Pendiente",
        period_type,
        period_key,
        folder_path,
        file_path: storagePath,
        file_name_original: originalName,
        file_mime_type: mime,
        file_size: file.size,
        upload_source: uploadSource,
        archival_only: archivalOnly,
      })
      .select("id")
      .maybeSingle();

    if (insert.error || !insert.data) {
      await supabase.storage.from("invoices").remove([storagePath]);
      results.push({ originalName, error: "No se pudo registrar la factura" });
      continue;
    }

    const invoiceId = insert.data.id as string;

    if (sendToGestoria && resendApiKey && fromEmail && gestoriaEmail) {
      try {
        const { data: signed, error: signedError } = await supabase.storage
          .from("invoices")
          .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

        if (signedError || !signed?.signedUrl) {
          console.error(
            "No se pudo crear URL firmada para envio a gestoria en subida:",
            signedError
          );
        } else {
          const fileUrl = signed.signedUrl;
          const subject = `Factura subida desde la web - ${clientDisplayName} - ${invoiceDate}`;
          const html = `
      <p>Hola,</p>
      <p>
        Su cliente <strong>${clientDisplayName}</strong> ha subido una factura a traves de
        <strong>FaktuGo</strong> para que la procese su gestoria.
      </p>
      <p>Encontrara la factura adjunta en este correo como archivo.</p>
      <p>
        Este mensaje ha sido generado automaticamente por <strong>FaktuGo</strong> para facilitar
        el envio y archivo de facturas.
      </p>
    `;
          const text = `Su cliente ${clientDisplayName} ha subido una factura a traves de FaktuGo. La factura se adjunta en este mensaje.`;

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: gestoriaEmail,
              reply_to: user.email ?? undefined,
              subject,
              html,
              text,
              attachments: [
                {
                  path: fileUrl,
                  filename: originalName,
                },
              ],
            }),
          });

          const emailJson = await emailResponse.json().catch(() => ({}));
          const nowIso = new Date().toISOString();
          const statusValue = emailResponse.ok ? "sent" : "failed";
          const messageId = (emailJson as any)?.id ?? null;

          const { error: updateError } = await supabase
            .from("invoices")
            .update({
              status: emailResponse.ok ? "Enviada" : "Pendiente",
              sent_to_gestoria_at: nowIso,
              sent_to_gestoria_status: statusValue,
              sent_to_gestoria_message_id: messageId,
            })
            .eq("id", invoiceId)
            .eq("user_id", user.id);

          if (updateError) {
            console.error(
              "Error al actualizar estado de envio a gestoria en subida:",
              updateError
            );
          }
        }
      } catch (e) {
        console.error(
          "Error inesperado en envio a gestoria durante subida manual de factura:",
          e
        );
      }
    }

    // Obtener el estado final de la factura (puede haber cambiado si se envió a gestoría)
    const { data: finalInvoice } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", invoiceId)
      .single();

    results.push({
      originalName,
      id: invoiceId,
      supplier,
      category,
      amount,
      date: invoiceDate,
      status: finalInvoice?.status || (archivalOnly ? "Archivada" : "Pendiente"),
      invoiceNumber: invoiceNumber,
    });
  }

  return NextResponse.json({ results });
}

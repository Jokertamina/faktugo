import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseServer";
import { computePeriodFromDate } from "@/lib/invoices";

type ResendAttachmentMeta = {
  id: string;
  filename: string;
  content_type: string;
  size?: number;
};

type ResendEmailReceivedEvent = {
  type: string;
  data?: {
    email_id: string;
    created_at?: string;
    from?: string;
    to?: string[];
    subject?: string;
    attachments?: ResendAttachmentMeta[];
  };
};

type ResendReceivedAttachment = {
  id: string;
  filename: string;
  size?: number;
  content_type?: string;
  download_url?: string;
};

function normalizeEmailAddress(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const match = trimmed.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].trim().toLowerCase();
  }
  return trimmed;
}

function deriveDateString(input?: string): { dateStr: string; year: number; month: string } {
  let d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) {
    d = new Date();
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  return { dateStr, year, month };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as ResendEmailReceivedEvent | null;

    if (!body || body.type !== "email.received" || !body.data) {
      return NextResponse.json({ ok: true });
    }

    const data = body.data;

    if (!data.email_id || !Array.isArray(data.to) || data.to.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Falta configurar RESEND_API_KEY para procesar correos entrantes." },
        { status: 500 }
      );
    }

    const fromEmail = process.env.GESTORIA_FROM_EMAIL || null;

    const supabase = getSupabaseServiceClient();

    const toAddresses = data.to.map(normalizeEmailAddress);
    const uniqueTo = Array.from(new Set(toAddresses));

    const { data: aliases, error: aliasesError } = await supabase
      .from("email_ingestion_aliases")
      .select("user_id, full_address, active")
      .in("full_address", uniqueTo)
      .eq("active", true);

    if (aliasesError) {
      console.error("Error al buscar alias de correo interno para ingestion:", aliasesError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    if (!aliases || aliases.length === 0) {
      return NextResponse.json({ ok: true, matchedAliases: 0 });
    }

    const listRes = await fetch(
      `https://api.resend.com/emails/receiving/${encodeURIComponent(data.email_id)}/attachments`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
        },
      }
    );

    if (!listRes.ok) {
      console.error("No se pudo listar adjuntos desde Resend", await listRes.text());
      return NextResponse.json(
        { ok: false, error: "No se pudieron obtener los adjuntos desde Resend" },
        { status: 500 }
      );
    }

    const listJson = (await listRes.json().catch(() => null)) as
      | { data?: ResendReceivedAttachment[] }
      | null;

    const receivedAttachments = Array.isArray(listJson?.data) ? listJson!.data : [];

    const attachmentsById = new Map<string, ResendReceivedAttachment>();
    for (const att of receivedAttachments) {
      if (att && att.id) {
        attachmentsById.set(att.id, att);
      }
    }

    const { dateStr, year, month } = deriveDateString(data.created_at);
    const periodInfo = computePeriodFromDate(dateStr, "month");

    const results: { userId: string; attachmentId: string; invoiceId?: string; error?: string }[] = [];

    for (const alias of aliases as { user_id: string; full_address: string; active: boolean }[]) {
      const userId = alias.user_id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "gestoria_email, auto_send_ingested_to_gestoria, first_name, last_name, display_name"
        )
        .eq("id", userId)
        .maybeSingle<{
          gestoria_email: string | null;
          auto_send_ingested_to_gestoria: boolean | null;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
        }>();

      if (profileError) {
        console.error(
          "Error al obtener perfil para autoenvio de facturas ingeridas:",
          profileError
        );
      }

      const gestoriaEmail = (profile?.gestoria_email ?? "").trim();
      const autoSendIngested = profile?.auto_send_ingested_to_gestoria ?? false;
      const firstName = (profile?.first_name ?? "").trim();
      const lastName = (profile?.last_name ?? "").trim();
      const combinedName = `${firstName} ${lastName}`.trim();
      const clientDisplayName = combinedName || (profile?.display_name ?? "Tu cliente");
      const shouldAutoSend = autoSendIngested && !!gestoriaEmail && !!fromEmail;

      for (const att of data.attachments ?? []) {
        try {
          const full = attachmentsById.get(att.id);
          if (!full) {
            results.push({ userId, attachmentId: att.id, error: "Adjunto no encontrado en API de Resend" });
            continue;
          }

          const mime = full.content_type || "application/octet-stream";
          const filename = full.filename || "archivo";
          const isAllowed =
            mime.startsWith("image/") ||
            mime === "application/pdf" ||
            filename.toLowerCase().endsWith(".pdf");

          if (!isAllowed) {
            results.push({ userId, attachmentId: att.id, error: "Tipo de archivo no permitido" });
            continue;
          }

          const downloadUrl = full.download_url;
          if (!downloadUrl) {
            results.push({ userId, attachmentId: att.id, error: "Adjunto sin URL de descarga" });
            continue;
          }

          const fileRes = await fetch(downloadUrl);
          if (!fileRes.ok) {
            console.error("No se pudo descargar el adjunto desde Resend", await fileRes.text());
            results.push({ userId, attachmentId: att.id, error: "No se pudo descargar el adjunto" });
            continue;
          }

          const fileBuffer = await fileRes.arrayBuffer();

          const originalName = full.filename || filename;
          const fileSize = full.size ?? att.size ?? fileBuffer.byteLength;
          const contentType = full.content_type || mime;

          const ext = (() => {
            const lower = originalName.toLowerCase();
            const dotIndex = lower.lastIndexOf(".");
            if (dotIndex === -1) {
              if (contentType === "application/pdf") return ".pdf";
              if (contentType.startsWith("image/")) return ".jpg";
              return "";
            }
            return lower.slice(dotIndex);
          })();

          const baseFolder = `${userId}/${year}-${month}`;
          const fileName = `${crypto.randomUUID()}${ext}`;
          const storagePath = `${baseFolder}/${fileName}`;

          const upload = await supabase.storage
            .from("invoices")
            .upload(storagePath, fileBuffer, {
              cacheControl: "3600",
              upsert: false,
              contentType,
            });

          if (upload.error) {
            console.error("Error al subir adjunto de correo a Storage:", upload.error);
            results.push({ userId, attachmentId: att.id, error: "No se pudo subir el archivo" });
            continue;
          }

          const insert = await supabase
            .from("invoices")
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              date: dateStr,
              supplier: "Proveedor pendiente (correo)",
              category: "Sin clasificar",
              amount: "0.00 EUR",
              status: "Pendiente",
              period_type: periodInfo.period_type,
              period_key: periodInfo.period_key,
              folder_path: periodInfo.folder_path,
              file_path: storagePath,
              file_name_original: originalName,
              file_mime_type: contentType,
              file_size: fileSize,
              upload_source: "email_ingest",
              archival_only: false,
            })
            .select("id")
            .maybeSingle();

          if (insert.error || !insert.data) {
            console.error("Error al registrar factura desde correo:", insert.error);
            await supabase.storage.from("invoices").remove([storagePath]);
            results.push({ userId, attachmentId: att.id, error: "No se pudo registrar la factura" });
            continue;
          }

          const invoiceId = insert.data.id as string;

          if (shouldAutoSend) {
            try {
              const { data: signed, error: signedError } = await supabase.storage
                .from("invoices")
                .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

              if (signedError || !signed?.signedUrl) {
                console.error(
                  "No se pudo crear URL firmada para envio automatico a gestoria:",
                  signedError
                );
              } else {
                const fileUrl = signed.signedUrl;
                const subject = `Factura recibida por correo - ${clientDisplayName} - ${dateStr}`;
                const html = `
      <p>Hola,</p>
      <p>
        Su cliente <strong>${clientDisplayName}</strong> ha compartido una factura
        a traves de <strong>FaktuGo</strong> utilizando el envio automatico por correo.
      </p>
      <p>Encontrara la factura adjunta en este correo como archivo.</p>
      <p>
        Este mensaje ha sido generado automaticamente por <strong>FaktuGo</strong> para facilitar
        el envio y archivo de facturas.
      </p>
    `;
                const text = `Su cliente ${clientDisplayName} ha compartido una factura recibida por correo a traves de FaktuGo. La factura se adjunta en este mensaje.`;

                const emailResponse = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    from: fromEmail as string,
                    to: gestoriaEmail,
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
                    sent_to_gestoria_at: nowIso,
                    sent_to_gestoria_status: statusValue,
                    sent_to_gestoria_message_id: messageId,
                  })
                  .eq("id", invoiceId)
                  .eq("user_id", userId);

                if (updateError) {
                  console.error(
                    "Error al actualizar estado de envio automatico a gestoria:",
                    updateError
                  );
                }
              }
            } catch (sendError) {
              console.error(
                "Error inesperado en envio automatico a gestoria desde ingestion:",
                sendError
              );
            }
          }

          results.push({ userId, attachmentId: att.id, invoiceId });
        } catch (e: any) {
          console.error("Error inesperado procesando adjunto de correo:", e);
          results.push({ userId: alias.user_id, attachmentId: att.id, error: "Error inesperado" });
        }
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    console.error("Error inesperado en /api/email-ingest/resend:", e);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

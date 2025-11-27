import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { computePeriodFromDate } from "@/lib/invoices";

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

  const results: { originalName: string; id?: string; error?: string }[] = [];

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

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const dateStr = `${year}-${month}-${String(now.getDate()).padStart(2, "0")}`;

    const { period_type, period_key, folder_path } = computePeriodFromDate(
      dateStr,
      "month"
    );

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
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: mime,
      });

    if (upload.error) {
      results.push({ originalName, error: "No se pudo subir el archivo" });
      continue;
    }

    const insert = await supabase
      .from("invoices")
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        date: dateStr,
        supplier: "Proveedor pendiente",
        category: "Sin clasificar",
        amount: "0.00 EUR",
        status: "Pendiente",
        period_type,
        period_key,
        folder_path,
        file_path: storagePath,
        file_name_original: originalName,
        file_mime_type: mime,
        file_size: file.size,
        upload_source: "web_upload",
      })
      .select("id")
      .maybeSingle();

    if (insert.error || !insert.data) {
      await supabase.storage.from("invoices").remove([storagePath]);
      results.push({ originalName, error: "No se pudo registrar la factura" });
      continue;
    }

    results.push({ originalName, id: insert.data.id as string });
  }

  return NextResponse.json({ results });
}

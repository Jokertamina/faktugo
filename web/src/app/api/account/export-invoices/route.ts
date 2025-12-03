import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";

function sanitizeForFilename(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const serviceClient = getSupabaseServiceClient();

    const { data: invoices, error: invoicesError } = await serviceClient
      .from("invoices")
      .select("date,supplier,invoice_number,file_path,file_name_original")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (invoicesError) {
      console.error("Error obteniendo facturas para export:", invoicesError);
      return NextResponse.json({ error: "No se pudieron obtener las facturas" }, { status: 500 });
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ error: "No tienes facturas para exportar" }, { status: 400 });
    }

    const storage = serviceClient.storage.from("invoices");
    const zip = new JSZip();
    const usedNames = new Set<string>();

    for (const inv of invoices) {
      const filePath = inv.file_path as string | null;
      if (!filePath) continue;

      const { data: fileData, error: downloadError } = await storage.download(filePath);
      if (downloadError || !fileData) {
        console.warn("No se pudo descargar archivo para", filePath, downloadError);
        continue;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const supplier = sanitizeForFilename((inv as any).supplier);
      const invoiceNumber = sanitizeForFilename((inv as any).invoice_number);
      const date = (inv as any).date as string | null;

      const baseDate = date ?? "sin-fecha";
      const safeDate = sanitizeForFilename(baseDate);

      let ext = "";
      const originalName = (inv as any).file_name_original as string | null;
      const sourceName = originalName || filePath;
      const lastDot = sourceName.lastIndexOf(".");
      if (lastDot !== -1 && lastDot < sourceName.length - 1) {
        ext = sourceName.substring(lastDot);
      } else {
        ext = ".bin";
      }

      let baseName = `${safeDate}`;
      if (supplier) baseName += ` - ${supplier}`;
      if (invoiceNumber) baseName += ` - ${invoiceNumber}`;

      if (!baseName) baseName = "factura";

      let finalName = baseName + ext;
      let counter = 2;
      while (usedNames.has(finalName)) {
        finalName = `${baseName} (${counter})${ext}`;
        counter += 1;
      }
      usedNames.add(finalName);

      zip.file(finalName, Buffer.from(arrayBuffer));
    }

    // Generamos el ZIP como Uint8Array para que encaje con BodyInit tipado de NextResponse
    const zipContent = await zip.generateAsync({ type: "uint8array" });

    const now = new Date();
    const isoDate = now.toISOString().slice(0, 10);
    const filename = `faktugo-facturas-${isoDate}.zip`;

    // Cast necesario porque los tipos de BodyInit de NextResponse no reconocen directamente Uint8Array,
    // aunque en tiempo de ejecución sí es válido como cuerpo de respuesta.
    return new NextResponse(zipContent as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Error exportando facturas:", error);
    return NextResponse.json(
      { error: error?.message || "Error al generar el ZIP de facturas" },
      { status: 500 },
    );
  }
}

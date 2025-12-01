import OpenAI from "openai";
import { Buffer } from "node:buffer";
import pdfParse from "pdf-parse";

export type DocumentType = "invoice" | "proforma" | "quote" | "receipt" | "ticket" | "other";

export type ExtractedInvoice = {
  supplier: string | null;
  category: string | null;
  date: string | null; // YYYY-MM-DD
  totalAmount: number | null;
  currency: string | null;
  invoiceNumber?: string | null;
  documentType: DocumentType;
  documentTypeConfidence: number; // 0-1
};

const INVOICE_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Verifica si el documento analizado es una factura válida.
 * Solo acepta documentos de tipo "invoice" o "receipt"/"ticket" (facturas simplificadas)
 * con confianza >= 0.7.
 */
export function isValidInvoice(extracted: ExtractedInvoice | null): boolean {
  if (!extracted) return false;

  const validTypes: DocumentType[] = ["invoice", "receipt", "ticket"];
  const isValidType = validTypes.includes(extracted.documentType);
  const hasEnoughConfidence = extracted.documentTypeConfidence >= INVOICE_CONFIDENCE_THRESHOLD;

  return isValidType && hasEnoughConfidence;
}

/**
 * Devuelve un mensaje de rechazo legible para el usuario.
 */
export function getRejectionReason(extracted: ExtractedInvoice | null): string {
  if (!extracted) {
    return "No se pudo analizar el documento.";
  }

  const typeLabels: Record<DocumentType, string> = {
    invoice: "factura",
    proforma: "factura proforma",
    quote: "presupuesto",
    receipt: "ticket/recibo",
    ticket: "ticket",
    other: "documento no reconocido",
  };

  const detectedLabel = typeLabels[extracted.documentType] || "documento desconocido";
  const confidencePercent = Math.round(extracted.documentTypeConfidence * 100);

  if (extracted.documentType === "invoice" && extracted.documentTypeConfidence < INVOICE_CONFIDENCE_THRESHOLD) {
    return `El documento podría ser una factura, pero la confianza es baja (${confidencePercent}%). Por favor, verifica que sea una factura válida.`;
  }

  if (extracted.documentType === "proforma") {
    return `El documento parece ser una factura proforma, no una factura definitiva. Las proformas no se aceptan.`;
  }

  if (extracted.documentType === "quote") {
    return `El documento parece ser un presupuesto, no una factura. Los presupuestos no se aceptan.`;
  }

  return `El documento detectado es: ${detectedLabel} (confianza: ${confidencePercent}%). Solo se aceptan facturas.`;
}

const client = new OpenAI();

const ANALYSIS_PROMPT =
  "Eres un sistema que analiza documentos financieros para autonomos y empresas. Tu tarea es: " +
  "1) Clasificar el tipo de documento. " +
  "2) Extraer los datos si es una factura. " +
  "3) Asignar una categoria de gasto apropiada. " +
  "Devuelve SOLO un JSON con este schema exacto: " +
  '{ "documentType": "invoice" | "proforma" | "quote" | "receipt" | "ticket" | "other", ' +
  '"documentTypeConfidence": number (0 a 1), ' +
  '"supplier": string | null, "category": string | null, "date": string | null, ' +
  '"totalAmount": number | null, "currency": string | null, "invoiceNumber": string | null }. ' +
  "Tipos de documento: " +
  "- invoice: factura definitiva/final (incluye facturas simplificadas). " +
  "- proforma: factura proforma (documento previo, no definitivo). " +
  "- quote: presupuesto o cotizacion. " +
  "- receipt/ticket: ticket de compra o recibo (factura simplificada de comercio). " +
  "- other: cualquier otro documento (foto, contrato, albaran, etc). " +
  "CATEGORIAS de gasto (elige la mas apropiada segun el proveedor/servicio): " +
  "Combustible, Transporte, Viajes, Alojamiento, Dietas, Restauracion, Suministros, " +
  "Telefonia/Internet, Software/SaaS, Material oficina, Equipamiento, Formacion, " +
  "Servicios profesionales, Seguros, Alquiler, Marketing, Envios/Mensajeria, " +
  "Mantenimiento, Limpieza, Gestoría/Asesoria, Otro. " +
  "La fecha en formato YYYY-MM-DD. Usa punto como separador decimal. " +
  "documentTypeConfidence debe reflejar tu certeza sobre el tipo (0.0 = nada seguro, 1.0 = totalmente seguro). " +
  "Si no es una factura/ticket, pon los campos de datos a null pero siempre indica documentType y documentTypeConfidence. " +
  "Para supplier, usa el nombre comercial o razon social del emisor de la factura.";

async function analyzeWithVision(
  base64: string,
  contentType: string
): Promise<string | null> {
  const dataUrl = `data:${contentType};base64,${base64}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: ANALYSIS_PROMPT },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content ?? null;
}

async function analyzeWithText(pdfText: string): Promise<string | null> {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content:
          ANALYSIS_PROMPT +
          "\n\nContenido del documento (texto extraido de PDF):\n\n" +
          pdfText.slice(0, 8000), // Limitar a 8000 chars para no exceder tokens
      },
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content ?? null;
}

export async function analyzeInvoiceFile(
  file: ArrayBuffer | Buffer,
  contentType: string
): Promise<ExtractedInvoice | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY no configurada; se omite analisis IA de factura.");
    return null;
  }

  const bytes: Buffer =
    file instanceof Buffer ? file : Buffer.from(new Uint8Array(file));

  try {
    let responseContent: string | null = null;
    const isPdf =
      contentType === "application/pdf" ||
      contentType === "application/x-pdf";

    if (isPdf) {
      // Para PDFs: extraer texto y analizar como texto
      try {
        const pdfData = await pdfParse(bytes);
        if (pdfData.text && pdfData.text.trim().length > 50) {
          responseContent = await analyzeWithText(pdfData.text);
        } else {
          // PDF sin texto (escaneado) - no podemos procesarlo sin OCR
          console.warn("PDF sin texto extraible; necesita OCR para procesarse.");
          return null;
        }
      } catch (pdfError) {
        console.error("Error al parsear PDF:", pdfError);
        return null;
      }
    } else {
      // Para imágenes: usar vision
      const base64 = bytes.toString("base64");
      responseContent = await analyzeWithVision(base64, contentType);
    }

    if (!responseContent) {
      return null;
    }

    const jsonString = responseContent;

    const parsed = JSON.parse(jsonString) as Partial<ExtractedInvoice>;

    const totalAmountValue =
      typeof parsed.totalAmount === "number"
        ? parsed.totalAmount
        : parsed.totalAmount != null
        ? Number(parsed.totalAmount)
        : null;

    // Normalizar documentType
    const validDocTypes: DocumentType[] = ["invoice", "proforma", "quote", "receipt", "ticket", "other"];
    const rawDocType = (parsed.documentType ?? "other") as string;
    const documentType: DocumentType = validDocTypes.includes(rawDocType as DocumentType)
      ? (rawDocType as DocumentType)
      : "other";

    // Normalizar confianza
    const rawConfidence = parsed.documentTypeConfidence;
    let documentTypeConfidence = 0;
    if (typeof rawConfidence === "number" && Number.isFinite(rawConfidence)) {
      documentTypeConfidence = Math.max(0, Math.min(1, rawConfidence));
    }

    return {
      supplier: parsed.supplier ?? null,
      category: parsed.category ?? null,
      date: parsed.date ?? null,
      totalAmount: Number.isFinite(totalAmountValue as number)
        ? (totalAmountValue as number)
        : null,
      currency: parsed.currency ?? null,
      invoiceNumber: parsed.invoiceNumber ?? null,
      documentType,
      documentTypeConfidence,
    };
  } catch (error) {
    console.error("Error en analyzeInvoiceFile (OpenAI):", error);
    return null;
  }
}

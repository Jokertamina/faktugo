import { computePeriodFromDate } from "./period";

export const DEFAULT_PERIOD_MODE = "month";
export const DEFAULT_ROOT_FOLDER = "/FaktuGo";

export function buildInvoice(raw, mode = DEFAULT_PERIOD_MODE, rootFolder = DEFAULT_ROOT_FOLDER) {
  if (!raw) return null;

  const date = raw.date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { period_type, period_key, folder_path } = computePeriodFromDate(date, mode, rootFolder);

  const baseStatus = raw.status === "Pendiente" ? "Pendiente" : "Enviada";

  return {
    id: String(raw.id ?? ""),
    date,
    supplier: raw.supplier ?? "",
    category: raw.category ?? "Otros",
    amount: raw.amount ?? "0.00 EUR",
    status: baseStatus,
    period_type,
    period_key,
    folder_path,
    imageUri: raw.imageUri,
    file_path: raw.file_path ?? null,
    file_name_original: raw.file_name_original ?? null,
    file_mime_type: raw.file_mime_type ?? null,
    file_size: raw.file_size ?? null,
    upload_source: raw.upload_source ?? null,
  };
}

export function buildInvoices(list, mode = DEFAULT_PERIOD_MODE, rootFolder = DEFAULT_ROOT_FOLDER) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => buildInvoice(item, mode, rootFolder))
    .filter((invoice) => invoice !== null);
}

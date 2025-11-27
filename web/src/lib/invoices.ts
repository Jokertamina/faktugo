import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";

export type Invoice = {
  id: string;
  date: string; // ISO date string
  supplier: string;
  category: string;
  amount: string; // formatted amount, e.g. "45.60 EUR"
  status: "Enviada" | "Pendiente";
  // Nueva informacion de periodo/carpeta
  period_type?: "month" | "week"; // segun configuracion del usuario
  period_key?: string; // ej. "2025-02" o "2025-S07"
  folder_path?: string; // ej. "/FaktuGo/2025-02" o "/FaktuGo/2025-S07"
  file_path?: string | null;
  file_name_original?: string | null;
  file_mime_type?: string | null;
  file_size?: number | null;
  upload_source?: string | null;
  sent_to_gestoria_at?: string | null;
  sent_to_gestoria_status?: "pending" | "sent" | "failed" | null;
  sent_to_gestoria_message_id?: string | null;
};

function getIsoWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function computePeriodFromDate(
  dateStr: string,
  mode: "month" | "week" = "month",
  rootFolder = "/FaktuGo"
): Pick<Invoice, "period_type" | "period_key" | "folder_path"> {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return {
      period_type: mode,
      period_key: undefined,
      folder_path: rootFolder,
    };
  }

  if (mode === "week") {
    const year = d.getFullYear();
    const week = getIsoWeek(d);
    const key = `${year}-S${String(week).padStart(2, "0")}`;
    return {
      period_type: "week",
      period_key: key,
      folder_path: `${rootFolder}/${key}`,
    };
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const key = `${year}-${month}`;
  return {
    period_type: "month",
    period_key: key,
    folder_path: `${rootFolder}/${key}`,
  };
}

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "1",
    date: "2025-02-14",
    supplier: "REPSOL",
    category: "Gasolina",
    amount: "45.60 EUR",
    status: "Enviada",
  },
  {
    id: "2",
    date: "2025-02-13",
    supplier: "MERCADONA",
    category: "Dietas",
    amount: "32.10 EUR",
    status: "Pendiente",
  },
  {
    id: "3",
    date: "2025-02-11",
    supplier: "AMAZON",
    category: "Compras",
    amount: "89.99 EUR",
    status: "Enviada",
  },
];

export function getMockInvoices(): Invoice[] {
  // Por defecto usamos agrupacion mensual para los mocks
  return MOCK_INVOICES.map((inv) => ({
    ...inv,
    ...computePeriodFromDate(inv.date, "month"),
  }));
}

export async function getInvoices(supabaseOverride?: SupabaseClient): Promise<Invoice[]> {
  const supabase = supabaseOverride ?? getSupabaseClient();

  // Si no hay configuracion de Supabase, usar directamente los mocks.
  if (!supabase) {
    return getMockInvoices();
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, date, supplier, category, amount, status, period_type, period_key, folder_path, file_path, file_name_original, file_mime_type, file_size, upload_source, sent_to_gestoria_at, sent_to_gestoria_status, sent_to_gestoria_message_id"
    )
    .order("date", { ascending: false });

  if (error || !data) {
    console.error("Error al obtener facturas desde Supabase:", error);
    return getMockInvoices();
  }

  const normalized = (data as Invoice[]).map((inv) => {
    if (!inv.period_type || !inv.period_key || !inv.folder_path) {
      return {
        ...inv,
        ...computePeriodFromDate(inv.date, "month"),
      };
    }
    return inv;
  });

  return normalized;
}

export async function getInvoiceById(
  id: string,
  supabaseOverride?: SupabaseClient
): Promise<Invoice | null> {
  const supabase = supabaseOverride ?? getSupabaseClient();

  if (!supabase) {
    const fromMock = getMockInvoices().find((invoice) => invoice.id === id);
    return fromMock ?? null;
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, date, supplier, category, amount, status, period_type, period_key, folder_path, file_path, file_name_original, file_mime_type, file_size, upload_source, sent_to_gestoria_at, sent_to_gestoria_status, sent_to_gestoria_message_id"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener factura por id desde Supabase:", error);
    const fromMock = getMockInvoices().find((invoice) => invoice.id === id);
    return fromMock ?? null;
  }

  if (!data) {
    return null;
  }

  const inv = data as Invoice;
  if (!inv.period_type || !inv.period_key || !inv.folder_path) {
    return {
      ...inv,
      ...computePeriodFromDate(inv.date, "month"),
    };
  }

  return inv;
}

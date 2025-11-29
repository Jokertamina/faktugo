import type { SupabaseClient } from "@supabase/supabase-js";
import { computePeriodFromDate } from "@faktugo/core";
import type { CoreInvoice } from "@faktugo/core";
import { getSupabaseClient } from "./supabaseClient";

export type Invoice = CoreInvoice & {
  // Campos que en web queremos estrictamente obligatorios y tipados
  supplier: string;
  category: string;
  amount: string; // formatted amount, e.g. "45.60 EUR"
  status: "Enviada" | "Pendiente";
};

export { computePeriodFromDate };

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
      "id, date, supplier, category, amount, status, archival_only, period_type, period_key, folder_path, file_path, file_name_original, file_mime_type, file_size, upload_source, sent_to_gestoria_at, sent_to_gestoria_status, sent_to_gestoria_message_id"
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
      "id, date, supplier, category, amount, status, archival_only, period_type, period_key, folder_path, file_path, file_name_original, file_mime_type, file_size, upload_source, sent_to_gestoria_at, sent_to_gestoria_status, sent_to_gestoria_message_id"
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

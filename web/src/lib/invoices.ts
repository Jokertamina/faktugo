import type { SupabaseClient } from "@supabase/supabase-js";
import { computePeriodFromDate } from "@faktugo/core";
import type { CoreInvoice } from "@faktugo/core";
import { getSupabaseClient } from "./supabaseClient";

export type Invoice = CoreInvoice & {
  // Campos que en web queremos estrictamente obligatorios y tipados
  supplier: string;
  category: string;
  amount: string; // formatted amount, e.g. "45.60 EUR"
  status: "Enviada" | "Pendiente" | "Archivada";
  invoice_number?: string | null;
  // Sobreescribimos para asegurar el tipo correcto
  sent_to_gestoria_status?: "pending" | "sent" | "failed" | null;
};

export { computePeriodFromDate };

export async function getInvoices(supabaseOverride?: SupabaseClient): Promise<Invoice[]> {
  const supabase = supabaseOverride ?? getSupabaseClient();

  // Si no hay configuración de Supabase, devolver lista vacía en lugar de mocks.
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, date, supplier, category, amount, status, invoice_number, archival_only, period_type, period_key, folder_path, file_path, file_name_original, file_mime_type, file_size, upload_source, sent_to_gestoria_at, sent_to_gestoria_status, sent_to_gestoria_message_id"
    )
    .order("date", { ascending: false });

  if (error || !data) {
    console.error("Error al obtener facturas desde Supabase:", error);
    return [];
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
    return null;
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, date, supplier, category, amount, status, invoice_number, archival_only, period_type, period_key, folder_path, file_path, file_name_original, file_mime_type, file_size, upload_source, sent_to_gestoria_at, sent_to_gestoria_status, sent_to_gestoria_message_id"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener factura por id desde Supabase:", error);
    return null;
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

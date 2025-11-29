import type { PeriodInfo, PeriodMode } from "./period";
import { computePeriodFromDate } from "./period";

// Tipo base de factura compartido entre web y movil. Los campos son opcionales
// salvo los mas basicos para permitir usarlo en distintos flujos.
export type CoreInvoice = {
  id: string;
  date: string; // YYYY-MM-DD
  supplier?: string;
  category?: string;
  amount?: string;
  status?: string;
  archival_only?: boolean;
  period_type?: PeriodMode;
  period_key?: string;
  folder_path?: string;
  file_path?: string | null;
  file_name_original?: string | null;
  file_mime_type?: string | null;
  file_size?: number | null;
  upload_source?: string | null;
  sent_to_gestoria_at?: string | null;
  sent_to_gestoria_status?: string | null;
  sent_to_gestoria_message_id?: string | null;
};

/**
 * Devuelve una copia de la factura con la informacion de periodo normalizada.
 */
export function withPeriodInfo(
  invoice: CoreInvoice,
  mode: PeriodMode = "month",
  rootFolder = "/FaktuGo"
): CoreInvoice & PeriodInfo {
  const period = computePeriodFromDate(invoice.date, mode, rootFolder);
  return {
    ...invoice,
    ...period,
  };
}

export { computePeriodFromDate };
export type { PeriodInfo, PeriodMode };

import type { PeriodInfo, PeriodMode } from "./period";

export type CoreInvoice = {
  id: string;
  date: string;
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
  sent_to_gestoria_status?: "pending" | "sent" | "failed" | null;
  sent_to_gestoria_message_id?: string | null;
};

export declare function withPeriodInfo(
  invoice: CoreInvoice,
  mode?: PeriodMode,
  rootFolder?: string
): CoreInvoice & PeriodInfo;

export type { PeriodInfo, PeriodMode };

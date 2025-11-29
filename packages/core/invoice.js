import { computePeriodFromDate } from "./period.js";

/**
 * @typedef {import("./period.js").PeriodMode} PeriodMode
 */

/**
 * @typedef {Object} CoreInvoice
 * @property {string} id
 * @property {string} date
 * @property {string=} supplier
 * @property {string=} category
 * @property {string=} amount
 * @property {string=} status
 * @property {boolean=} archival_only
 * @property {string=} period_type
 * @property {string=} period_key
 * @property {string=} folder_path
 * @property {string|null=} file_path
 * @property {string|null=} file_name_original
 * @property {string|null=} file_mime_type
 * @property {number|null=} file_size
 * @property {string|null=} upload_source
 * @property {string|null=} sent_to_gestoria_at
 * @property {string|null=} sent_to_gestoria_status
 * @property {string|null=} sent_to_gestoria_message_id
 */

/**
 * Devuelve una copia de la factura con la informacion de periodo normalizada.
 *
 * @param {CoreInvoice} invoice
 * @param {PeriodMode} [mode="month"]
 * @param {string} [rootFolder="/FaktuGo"]
 * @returns {CoreInvoice & import("./period.js").PeriodInfo}
 */
export function withPeriodInfo(invoice, mode = "month", rootFolder = "/FaktuGo") {
  const period = computePeriodFromDate(invoice.date, mode, rootFolder);
  return {
    ...invoice,
    ...period,
  };
}

import * as FileSystem from "expo-file-system/legacy";
import { buildInvoices } from "../domain/invoice";

const INVOICES_FILE_NAME = "invoices.json";
const INVOICES_FILE_URI = `${FileSystem.documentDirectory}${INVOICES_FILE_NAME}`;

export async function loadInvoicesFromStorage() {
  try {
    const info = await FileSystem.getInfoAsync(INVOICES_FILE_URI);
    if (!info.exists) {
      return null;
    }

    const content = await FileSystem.readAsStringAsync(INVOICES_FILE_URI);

    const parsed = JSON.parse(content);
    return buildInvoices(parsed);
  } catch (error) {
    console.warn("No se pudieron cargar facturas locales:", error);
    return null;
  }
}

export async function saveInvoicesToStorage(invoices) {
  try {
    const payload = JSON.stringify(invoices ?? [], null, 2);
    await FileSystem.writeAsStringAsync(INVOICES_FILE_URI, payload);
  } catch (error) {
    console.warn("No se pudieron guardar facturas locales:", error);
  }
}

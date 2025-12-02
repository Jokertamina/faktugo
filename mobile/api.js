import { API_BASE_URL } from "./config";
import { getSupabaseClient } from "./supabaseClient";

export async function fetchInvoicesFromApi() {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/invoices`);
    if (!response.ok) {
      console.warn("API /api/invoices devolvio un estado no OK:", response.status);
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data)) return null;
    return data;
  } catch (error) {
    console.warn("Error al sincronizar facturas desde la API:", error);
    return null;
  }
}

export async function fetchInvoicesFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("Supabase no esta configurado en la app movil (fetchInvoicesFromSupabase).");
    return null;
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      // AuthSessionMissingError indica que simplemente no hay sesión activa
      if (userError.name === "AuthSessionMissingError") {
        return null;
      }

      console.warn("No se pudo obtener el usuario al cargar facturas desde Supabase:", userError);
      return null;
    }

    if (!user) {
      console.warn("No hay usuario autenticado al intentar cargar facturas desde Supabase.");
      return null;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, date, supplier, category, amount, status, invoice_number, archival_only, period_type, period_key, folder_path, file_path, file_name_original, file_mime_type, file_size, upload_source, sent_to_gestoria_at, sent_to_gestoria_status"
      )
      .order("date", { ascending: false });

    if (error) {
      console.warn("Error al obtener facturas desde Supabase en movil:", error);
      return null;
    }

    if (!Array.isArray(data)) return null;
    return data;
  } catch (error) {
    console.warn("Error inesperado en fetchInvoicesFromSupabase:", error);
    return null;
  }
}

export async function createInvoiceFromMobile(invoice) {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      console.warn("POST /api/invoices devolvio estado no OK:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Error al crear factura desde el movil:", error);
    return null;
  }
}

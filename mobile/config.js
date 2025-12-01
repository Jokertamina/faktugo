// URL base de la API web (Next.js)
// Para desarrollo en tu red local puedes ajustar esta URL a la IP que te muestre Next como "Network".
// Ejemplo: http://192.168.1.128:3000

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.1.128:3000"; // ajusta si cambia tu IP

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

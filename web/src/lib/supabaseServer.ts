import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no estan configurados");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      async getAll() {
        return cookieStore.getAll();
      },
      async setAll(cookiesToSet) {
        try {
          await Promise.all(cookiesToSet.map(({ name, value, options }) => {
            return cookieStore.set(name, value, options);
          }));
        } catch {
          // Llamado desde un Server Component donde no se pueden establecer cookies directamente.
        }
      },
    },
  });
}

export function getSupabaseServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no estan configurados");
  }

  return createClient(url, serviceKey);
}

/**
 * Crea un cliente de Supabase autenticado con un token Bearer.
 * Útil para endpoints que reciben autenticación desde móvil.
 */
export function getSupabaseClientWithToken(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no estan configurados");
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Verifica un access token y devuelve el usuario si es válido.
 * Usa el service role client para validación fiable.
 */
export async function verifyAccessToken(accessToken: string): Promise<{ user: any | null; error: string | null }> {
  try {
    const serviceClient = getSupabaseServiceClient();
    const { data, error } = await serviceClient.auth.getUser(accessToken);
    
    if (error) {
      console.error("[verifyAccessToken] Error:", error.message);
      return { user: null, error: error.message };
    }
    
    return { user: data.user, error: null };
  } catch (e: any) {
    console.error("[verifyAccessToken] Exception:", e.message);
    return { user: null, error: e.message };
  }
}

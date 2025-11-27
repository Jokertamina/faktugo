import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

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

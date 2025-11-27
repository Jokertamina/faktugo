import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();

  const url = new URL("/", request.url);
  return NextResponse.redirect(url);
}

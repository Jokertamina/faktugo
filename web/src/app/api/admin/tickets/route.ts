import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";

// Verificar si el usuario es admin
async function isAdmin(supabase: ReturnType<typeof getSupabaseServiceClient>) {
  const serverSupabase = await getSupabaseServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  
  if (!user) return false;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  
  return profile?.is_admin === true;
}

// GET: Obtener todos los tickets
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("support_tickets")
      .select(`
        *,
        profiles:user_id (
          display_name,
          first_name,
          last_name,
          company_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar un ticket (cambiar estado, añadir notas)
export async function PUT(request: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de ticket requerido" }, { status: 400 });
    }

    const dbUpdates: Record<string, any> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.admin_notes !== undefined) dbUpdates.admin_notes = updates.admin_notes;

    const { data, error } = await supabase
      .from("support_tickets")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

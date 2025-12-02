import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";

// Verificar si el usuario es admin
async function verifyAdmin() {
  const serverSupabase = await getSupabaseServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  
  if (!user) return null;
  
  const supabase = getSupabaseServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  
  if (!profile?.is_admin) return null;
  
  return { user, supabase };
}

// GET: Listar usuarios
export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = auth.supabase
      .from("profiles")
      .select(`
        id,
        display_name,
        first_name,
        last_name,
        company_name,
        created_at,
        is_admin,
        subscriptions!left (
          id,
          plan_name,
          status,
          current_period_end,
          is_manual,
          assigned_at,
          manual_reason
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Buscar por nombre o email (necesitamos join con auth.users para email)
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener emails de auth.users
    const userIds = (data || []).map(u => u.id);
    const { data: authUsers } = await auth.supabase.auth.admin.listUsers();
    
    const emailMap = new Map<string, string>();
    for (const u of authUsers?.users || []) {
      emailMap.set(u.id, u.email || "");
    }

    // Combinar datos
    const users = (data || []).map(user => {
      // Obtener la suscripción activa (si existe)
      const subs = Array.isArray(user.subscriptions) ? user.subscriptions : [];
      const activeSub = subs.find((s: any) => 
        s.status === "active" || s.status === "trialing"
      );

      return {
        id: user.id,
        displayName: user.display_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Sin nombre",
        companyName: user.company_name,
        email: emailMap.get(user.id) || "",
        createdAt: user.created_at,
        isAdmin: user.is_admin,
        subscription: activeSub ? {
          id: activeSub.id,
          plan: activeSub.plan_name || "free",
          status: activeSub.status,
          expiresAt: activeSub.current_period_end,
          isManual: activeSub.is_manual,
          assignedAt: activeSub.assigned_at,
          reason: activeSub.manual_reason,
        } : null,
        currentPlan: activeSub?.plan_name || "free",
      };
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error listando usuarios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

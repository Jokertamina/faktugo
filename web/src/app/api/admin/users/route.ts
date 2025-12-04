import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";
import { getUserSubscription } from "@/lib/subscription";

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
        is_admin
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
    const { data: authUsers } = await auth.supabase.auth.admin.listUsers();
    
    const emailMap = new Map<string, string>();
    for (const u of authUsers?.users || []) {
      emailMap.set(u.id, u.email || "");
    }

    // Combinar datos con el estado de suscripción real de cada usuario
    const users = await Promise.all(
      (data || []).map(async (user) => {
        const subscription = await getUserSubscription(auth.supabase, user.id);

        const hasPaidPlan = subscription.plan !== "free";

        const adminSubscription = hasPaidPlan
          ? {
              plan: subscription.plan,
              status: subscription.status,
              expiresAt: subscription.currentPeriodEnd,
              isManual: subscription.isManual ?? false,
              assignedAt: subscription.assignedAt ?? null,
              reason: subscription.manualReason ?? null,
            }
          : null;

        return {
          id: user.id,
          displayName:
            user.display_name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            "Sin nombre",
          companyName: user.company_name,
          email: emailMap.get(user.id) || "",
          createdAt: user.created_at,
          isAdmin: user.is_admin,
          subscription: adminSubscription,
          currentPlan: subscription.plan,
        };
      })
    );

    const { count: totalProfiles } = await auth.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({ users, total: totalProfiles ?? users.length });
  } catch (error: any) {
    console.error("Error listando usuarios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";
import { invalidatePlansCache } from "@/lib/subscription";

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

// GET: Obtener todos los planes
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plans: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar un plan
export async function PUT(request: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de plan requerido" }, { status: 400 });
    }

    // Mapear campos del frontend a la BD
    const dbUpdates: Record<string, any> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.invoicesPerMonth !== undefined) dbUpdates.invoices_per_month = updates.invoicesPerMonth;
    if (updates.canSendToGestoria !== undefined) dbUpdates.can_send_gestoria = updates.canSendToGestoria;
    if (updates.canUseEmailIngestion !== undefined) dbUpdates.can_use_email_ingestion = updates.canUseEmailIngestion;
    if (updates.priceMonthly !== undefined) dbUpdates.price_monthly_cents = updates.priceMonthly;
    if (updates.stripePriceId !== undefined) dbUpdates.stripe_price_id = updates.stripePriceId;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
    if (updates.features !== undefined) dbUpdates.features = updates.features;

    const { data, error } = await supabase
      .from("plans")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidar cache
    invalidatePlansCache();

    return NextResponse.json({ plan: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear un nuevo plan
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    const newPlan = {
      id: body.id,
      display_name: body.displayName,
      description: body.description || null,
      invoices_per_month: body.invoicesPerMonth || 10,
      can_send_gestoria: body.canSendToGestoria || false,
      can_use_email_ingestion: body.canUseEmailIngestion || false,
      price_monthly_cents: body.priceMonthly || 0,
      stripe_price_id: body.stripePriceId || null,
      is_active: body.isActive !== false,
      sort_order: body.sortOrder || 0,
      features: body.features || [],
    };

    const { data, error } = await supabase
      .from("plans")
      .insert(newPlan)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidatePlansCache();

    return NextResponse.json({ plan: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

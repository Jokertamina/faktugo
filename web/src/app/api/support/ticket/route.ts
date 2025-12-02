import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";
import { getUserSubscription } from "@/lib/subscription";

// POST: Crear un nuevo ticket de soporte
export async function POST(request: Request) {
  try {
    const serverSupabase = await getSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, phone, companyName } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Asunto y mensaje son obligatorios" },
        { status: 400 }
      );
    }

    // Obtener info del usuario
    const subscription = await getUserSubscription(serverSupabase, user.id);
    const isPro = subscription.plan === "pro";

    // Solo usuarios Pro pueden usar el formulario de soporte
    if (!isPro) {
      return NextResponse.json(
        { error: "El soporte por formulario solo está disponible para usuarios Pro" },
        { status: 403 }
      );
    }

    // Obtener más info del perfil
    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("display_name, first_name, last_name, company_name")
      .eq("id", user.id)
      .maybeSingle();

    const serviceSupabase = getSupabaseServiceClient();
    
    const { data, error } = await serviceSupabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        user_email: user.email || "",
        user_plan: subscription.plan,
        company_name: companyName || profile?.company_name || null,
        phone: phone || null,
        subject,
        message,
        source: "form",
        status: "pending",
        priority: "high", // Los tickets de Pro tienen prioridad alta
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando ticket:", error);
      return NextResponse.json({ error: "Error al crear ticket" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      ticketId: data.id,
      message: "Tu solicitud ha sido recibida. Te responderemos lo antes posible."
    });
  } catch (error: any) {
    console.error("Error en /api/support/ticket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Obtener tickets del usuario actual
export async function GET() {
  try {
    const serverSupabase = await getSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data, error } = await serverSupabase
      .from("support_tickets")
      .select("id, subject, status, priority, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

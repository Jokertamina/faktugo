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

// POST: Asignar plan manualmente a un usuario
export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, planId, reason, durationDays } = body;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: "userId y planId son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const { data: targetUser } = await auth.supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", userId)
      .maybeSingle();

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que el plan existe
    const { data: plan } = await auth.supabase
      .from("plans")
      .select("id, display_name")
      .eq("id", planId)
      .maybeSingle();

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    // Calcular fecha de expiración (por defecto 30 días)
    const days = durationDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Si es plan "free", cancelar cualquier suscripción activa
    if (planId === "free") {
      await auth.supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: true,
        })
        .eq("user_id", userId)
        .in("status", ["active", "trialing"]);

      return NextResponse.json({
        success: true,
        message: `Usuario cambiado a plan gratuito`,
      });
    }

    // Cancelar suscripciones activas anteriores
    await auth.supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
      })
      .eq("user_id", userId)
      .in("status", ["active", "trialing"]);

    // Crear nueva suscripción manual
    const { data: newSub, error: subError } = await auth.supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_name: planId,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: expiresAt.toISOString(),
        is_manual: true,
        assigned_by: auth.user.id,
        assigned_at: new Date().toISOString(),
        manual_reason: reason || "Asignado por administrador",
        // Sin stripe_subscription_id ya que es manual
        stripe_subscription_id: `manual_${Date.now()}`,
        stripe_customer_id: null,
      })
      .select()
      .single();

    if (subError) {
      console.error("Error creando suscripción manual:", subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscription: newSub,
      message: `Plan ${plan.display_name} asignado a ${targetUser.display_name || "usuario"} hasta ${expiresAt.toLocaleDateString("es-ES")}`,
    });
  } catch (error: any) {
    console.error("Error asignando plan:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Revocar suscripción manual
export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    // Cancelar suscripciones manuales activas
    const { error } = await auth.supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
      })
      .eq("user_id", userId)
      .eq("is_manual", true)
      .in("status", ["active", "trialing"]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Suscripción manual revocada. El usuario vuelve al plan gratuito.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

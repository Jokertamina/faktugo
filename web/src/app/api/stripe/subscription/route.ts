import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener suscripción activa del usuario
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json({
        plan: "free",
        status: "inactive",
        subscription: null,
      });
    }

    return NextResponse.json({
      plan: subscription.plan_name,
      status: subscription.status,
      subscription: {
        id: subscription.stripe_subscription_id,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error: any) {
    console.error("Error obteniendo suscripción:", error);
    return NextResponse.json(
      { error: "Error al obtener suscripción" },
      { status: 500 }
    );
  }
}

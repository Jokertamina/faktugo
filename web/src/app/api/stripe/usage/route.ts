import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getUserSubscription, getMonthlyInvoiceCount, PLAN_LIMITS } from "@/lib/subscription";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const subscription = await getUserSubscription(supabase, user.id);
    const monthlyCount = await getMonthlyInvoiceCount(supabase, user.id);
    const limit = subscription.limits.invoicesPerMonth;
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - monthlyCount);

    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      usage: {
        invoicesThisMonth: monthlyCount,
        invoicesLimit: limit,
        invoicesRemaining: remaining,
        percentUsed: limit === Infinity ? 0 : Math.round((monthlyCount / limit) * 100),
      },
      features: {
        canSendToGestoria: subscription.limits.canSendToGestoria,
        canUseEmailIngestion: subscription.limits.canUseEmailIngestion,
      },
    });
  } catch (error: any) {
    console.error("Error obteniendo uso:", error);
    return NextResponse.json({ error: "Error al obtener uso" }, { status: 500 });
  }
}

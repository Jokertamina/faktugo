import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getPlans } from "@/lib/subscription";

// GET: Obtener planes activos (público)
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const plans = await getPlans(supabase);

    // Todos los planes activos
    const allPlans = Object.values(plans)
      .filter((p) => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        name: p.displayName,
        description: p.description,
        price_monthly: p.priceMonthly / 100, // En euros
        stripe_price_id: p.stripePriceId,
        limits: {
          invoices_per_month: p.invoicesPerMonth,
          can_send_to_gestoria: p.canSendToGestoria,
          email_ingestion: p.canUseEmailIngestion,
        },
        features: {
          priority_support: p.features?.includes("Soporte prioritario") || false,
        },
        features_list: p.features,
      }));

    return NextResponse.json({ plans: allPlans });
  } catch (error: any) {
    console.error("Error obteniendo planes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

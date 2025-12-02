import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getPlans } from "@/lib/subscription";

// GET: Obtener planes activos (público)
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const plans = await getPlans(supabase);

    // Separar plan free de los de pago
    const allPlansArray = Object.values(plans).filter((p) => p.isActive);
    const freePlanData = allPlansArray.find(p => p.id === "free");
    const paidPlans = allPlansArray
      .filter((p) => p.id !== "free")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        name: p.displayName,
        description: p.description,
        // Para web (pricing page)
        price: (p.priceMonthly / 100).toFixed(2).replace(".", ","),
        features: p.features || [],
        stripePriceId: p.stripePriceId,
        // Para móvil
        price_monthly: p.priceMonthly / 100,
        stripe_price_id: p.stripePriceId,
        limits: {
          invoices_per_month: p.invoicesPerMonth,
          can_send_to_gestoria: p.canSendToGestoria,
          email_ingestion: p.canUseEmailIngestion,
        },
      }));

    const free = freePlanData ? {
      id: "free",
      name: freePlanData.displayName,
      description: freePlanData.description,
      invoicesPerMonth: freePlanData.invoicesPerMonth,
      features: freePlanData.features || [],
      // Para móvil
      price_monthly: 0,
      stripe_price_id: null,
      limits: {
        invoices_per_month: freePlanData.invoicesPerMonth,
        can_send_to_gestoria: freePlanData.canSendToGestoria,
        email_ingestion: freePlanData.canUseEmailIngestion,
      },
    } : null;

    // plans = solo pago (para web pricing)
    // free = plan gratuito (para web pricing)
    // allPlans = todos incluyendo free (para móvil)
    const allPlans = free ? [free, ...paidPlans] : paidPlans;

    return NextResponse.json({ plans: paidPlans, free, allPlans });
  } catch (error: any) {
    console.error("Error obteniendo planes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

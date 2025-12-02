import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getPlans } from "@/lib/subscription";

// GET: Obtener planes activos (público)
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const plans = await getPlans(supabase);

    // Filtrar solo planes activos y de pago (excluir free)
    const paidPlans = Object.values(plans)
      .filter((p) => p.isActive && p.id !== "free")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        name: p.displayName,
        description: p.description,
        price: (p.priceMonthly / 100).toFixed(2).replace(".", ","),
        features: p.features,
        stripePriceId: p.stripePriceId,
      }));

    // Plan gratuito
    const freePlan = plans["free"];
    const free = freePlan
      ? {
          id: "free",
          name: freePlan.displayName,
          description: freePlan.description,
          invoicesPerMonth: freePlan.invoicesPerMonth,
          features: freePlan.features,
        }
      : null;

    return NextResponse.json({ plans: paidPlans, free });
  } catch (error: any) {
    console.error("Error obteniendo planes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

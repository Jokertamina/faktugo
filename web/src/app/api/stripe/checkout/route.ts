import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Mapeo de planes a price IDs de Stripe (fallback)
const PRICE_IDS: Record<string, string> = {
  basico: process.env.STRIPE_PRICE_BASICO || "",
  pro: process.env.STRIPE_PRICE_PRO || "",
};

export async function POST(request: Request) {
  try {
    // Intentar autenticación por cookie primero
    let user = null;
    const supabase = await getSupabaseServerClient();
    const { data: cookieAuth } = await supabase.auth.getUser();
    user = cookieAuth?.user;

    // Si no hay cookie, intentar con Bearer token (para móvil)
    if (!user) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const serviceClient = getSupabaseServiceClient();
        const { data: tokenAuth } = await serviceClient.auth.getUser(token);
        user = tokenAuth?.user;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    // Aceptar plan (id) o priceId directamente
    const { plan, priceId: directPriceId } = body;

    // Determinar el priceId a usar
    let priceId = directPriceId;
    let planId = plan;

    if (!priceId && plan) {
      priceId = PRICE_IDS[plan];
    }

    if (!priceId) {
      return NextResponse.json({ error: "Plan o priceId no válido" }, { status: 400 });
    }

    // Si tenemos priceId pero no plan, intentar determinar el plan
    if (!planId) {
      planId = Object.entries(PRICE_IDS).find(([, id]) => id === priceId)?.[0] || "unknown";
    }

    // Obtener o crear customer en Stripe
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, display_name, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Crear customer en Stripe
      const customerName =
        `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
        profile?.display_name ||
        user.email ||
        "Cliente";

      const customer = await stripe.customers.create({
        email: user.email,
        name: customerName,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Guardar customer ID en profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        plan: planId,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: planId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creando checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear sesión de pago" },
      { status: 500 }
    );
  }
}

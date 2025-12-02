import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseClientWithToken } from "@/lib/supabaseServer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    // Intentar autenticación por cookie primero
    let user = null;
    let supabase = await getSupabaseServerClient();
    const { data: cookieAuth } = await supabase.auth.getUser();
    user = cookieAuth?.user;

    // Si no hay cookie, intentar con Bearer token (para móvil)
    if (!user) {
      const authHeader = request.headers.get("Authorization");

      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);

        // Cliente Supabase autenticado con el token del móvil
        const supabaseWithToken = getSupabaseClientWithToken(token);
        const { data: tokenAuth } = await supabaseWithToken.auth.getUser();

        if (tokenAuth?.user) {
          user = tokenAuth.user;
          supabase = supabaseWithToken;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, priceId: directPriceId } = body;

    let priceId = directPriceId;
    let planId = plan;

    // Si no hay priceId directo, buscar en la BD por el plan id
    if (!priceId && plan) {
      const { data: planData } = await supabase
        .from("plans")
        .select("stripe_price_id")
        .eq("id", plan)
        .maybeSingle();
      
      priceId = planData?.stripe_price_id;
    }

    if (!priceId) {
      return NextResponse.json({ error: "Plan no válido o sin precio configurado" }, { status: 400 });
    }

    // Si tenemos priceId pero no plan, buscar el plan en la BD
    if (!planId && priceId) {
      const { data: planData } = await supabase
        .from("plans")
        .select("id")
        .eq("stripe_price_id", priceId)
        .maybeSingle();
      
      planId = planData?.id || "unknown";
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
      // Recoger dirección de facturación completa
      billing_address_collection: "required",
      // Permitir que el checkout actualice nombre/dirección del customer
      customer_update: {
        name: "auto",
        address: "auto",
      },
      // Recoger NIF/CIF para facturas válidas
      tax_id_collection: {
        enabled: true,
      },
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

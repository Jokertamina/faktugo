import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseClientWithToken, verifyAccessToken } from "@/lib/supabaseServer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    // Leer body una vez para obtener plan / priceId / accessToken / returnUrl (móvil)
    const body = await request.json();
    const { plan, priceId: directPriceId, accessToken, returnUrl } = body;

    // Intentar autenticación por cookie primero (web)
    let user = null;
    let supabase = await getSupabaseServerClient();
    const { data: cookieAuth } = await supabase.auth.getUser();
    user = cookieAuth?.user;

    // Si no hay cookie, intentar con Bearer token (móvil)
    if (!user) {
      const authHeader = request.headers.get("Authorization");

      if (authHeader?.startsWith("Bearer ")) {
        const tokenFromHeader = authHeader.substring(7);

        // Usar service role para verificar el token de forma fiable
        const { user: verifiedUser, error: verifyError } = await verifyAccessToken(tokenFromHeader);
        
        if (verifyError) {
          console.warn("[/api/stripe/checkout] Token header inválido:", verifyError);
        }

        if (verifiedUser) {
          user = verifiedUser;
          supabase = getSupabaseClientWithToken(tokenFromHeader);
        }
      }
    }

    // Fallback adicional para móvil: accessToken en el body
    if (!user && typeof accessToken === "string" && accessToken.length > 0) {
      const { user: verifiedUser, error: verifyError } = await verifyAccessToken(accessToken);
      
      if (verifyError) {
        console.warn("[/api/stripe/checkout] Token body inválido:", verifyError);
      }

      if (verifiedUser) {
        user = verifiedUser;
        supabase = getSupabaseClientWithToken(accessToken);
      }
    }

    if (!user) {
      const authHeader = request.headers.get("Authorization");
      const hasBearer = !!authHeader && authHeader.startsWith("Bearer ");
      const hasAccessToken = typeof accessToken === "string" && accessToken.length > 0;

      return NextResponse.json(
        {
          error:
            hasBearer || hasAccessToken
              ? "No autenticado (token inválido o expirado)"
              : "No autenticado (sin sesión)",
        },
        { status: 401 }
      );
    }

    const { plan: _ignoredPlan, priceId: _ignoredPriceId, accessToken: _ignoredToken, ...rest } = body;
    // Usar las variables ya extraídas arriba
    const directPriceIdSafe = directPriceId;
    const planFromBody = plan;

    let priceId = directPriceIdSafe;
    let planId = planFromBody;

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

    const hasMobileReturn = typeof returnUrl === "string" && returnUrl.length > 0;

    const successUrl = hasMobileReturn
      ? `${returnUrl}?status=success`
      : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`;

    const cancelUrl = hasMobileReturn
      ? `${returnUrl}?status=cancelled`
      : `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`;

    const origin = hasMobileReturn || accessToken ? "mobile" : "web";

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
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        plan: planId,
        origin,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: planId,
          origin,
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

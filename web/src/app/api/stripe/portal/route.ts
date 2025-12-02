import { NextResponse } from "next/server";
import { getSupabaseServerClient, verifyAccessToken } from "@/lib/supabaseServer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
        const { user: verifiedUser, error: verifyError } = await verifyAccessToken(token);
        
        if (verifyError) {
          console.warn("[/api/stripe/portal] Token inválido:", verifyError);
        }
        
        user = verifiedUser;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Leer body opcional para soportar returnUrl desde móvil
    let mobileReturnUrl: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.returnUrl === "string") {
        mobileReturnUrl = body.returnUrl;
      }
    } catch {
      // Puede ser una llamada sin body (web), ignoramos el error de JSON
    }

    // Obtener stripe_customer_id del perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No tienes una suscripción activa" },
        { status: 400 }
      );
    }

    // Crear sesión del portal de facturación
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: mobileReturnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creando portal session:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear sesión del portal" },
      { status: 500 }
    );
  }
}

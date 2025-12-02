import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseClientWithToken, verifyAccessToken } from "@/lib/supabaseServer";
import { getUserSubscription, getMonthlyInvoiceCount, isUserAdmin } from "@/lib/subscription";

export async function GET(request: Request) {
  try {
    // Intentar autenticación por cookie primero (web)
    let supabase = await getSupabaseServerClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    // Si no hay cookie, intentar con Bearer token (móvil)
    if (!user) {
      const authHeader = request.headers.get("Authorization");
      console.log("[/api/stripe/usage] No cookie user. authHeader:", authHeader ? "present" : "missing");

      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        console.log("[/api/stripe/usage] Token length:", token.length, "starts with:", token.substring(0, 20));
        
        // Usar service role para verificar el token de forma fiable
        const { user: verifiedUser, error: verifyError } = await verifyAccessToken(token);
        
        console.log("[/api/stripe/usage] verifyAccessToken result:", verifiedUser?.id || "null", "error:", verifyError || "none");
        
        if (verifyError) {
          console.warn("[/api/stripe/usage] Token inválido:", verifyError);
        }

        if (verifiedUser) {
          user = verifiedUser;
          supabase = getSupabaseClientWithToken(token);
        }
      } else {
        console.log("[/api/stripe/usage] No Bearer token in header");
      }
    }

    if (!user) {
      console.log("[/api/stripe/usage] Final: No user, returning 401");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar si es admin (acceso ilimitado)
    const isAdmin = await isUserAdmin(supabase, user.id);
    
    if (isAdmin) {
      const monthlyCount = await getMonthlyInvoiceCount(supabase, user.id);
      return NextResponse.json({
        plan: "admin",
        status: "active",
        isAdmin: true,
        usage: {
          invoicesThisMonth: monthlyCount,
          invoicesLimit: Infinity,
          invoicesRemaining: Infinity,
          percentUsed: 0,
        },
        features: {
          canSendToGestoria: true,
          canUseEmailIngestion: true,
        },
      });
    }

    const subscription = await getUserSubscription(supabase, user.id);
    const monthlyCount = await getMonthlyInvoiceCount(supabase, user.id);
    const limit = subscription.limits.invoicesPerMonth;
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - monthlyCount);

    return NextResponse.json({
      plan: subscription.plan,
      planName: subscription.planConfig.displayName,
      status: subscription.status,
      isAdmin: false,
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

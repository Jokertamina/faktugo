import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseServer";

// Este endpoint es llamado por Vercel Cron cada hora
// Configuración en vercel.json: { "crons": [{ "path": "/api/cron/expire-subscriptions", "schedule": "0 * * * *" }] }

export async function GET(request: Request) {
  try {
    // Verificar que viene del cron de Vercel (o permitir en desarrollo)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // En producción, verificar el secret
    if (process.env.NODE_ENV === "production" && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    const supabase = getSupabaseServiceClient();
    const now = new Date().toISOString();

    // Expirar suscripciones MANUALES que han vencido
    // Las de Stripe las gestiona Stripe via webhook
    const { data: expired, error } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
      })
      .eq("is_manual", true)
      .eq("status", "active")
      .lt("current_period_end", now)
      .select("id, user_id, plan_name");

    if (error) {
      console.error("Error expirando suscripciones:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const expiredCount = expired?.length || 0;

    if (expiredCount > 0) {
      console.log(`[Cron] Expiradas ${expiredCount} suscripciones manuales:`, expired);
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      expired: expired?.map(s => ({ id: s.id, userId: s.user_id, plan: s.plan_name })),
      timestamp: now,
    });
  } catch (error: any) {
    console.error("Error en cron expire-subscriptions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

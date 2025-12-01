import { SupabaseClient } from "@supabase/supabase-js";

export type PlanName = "free" | "basico" | "empresa" | "gestorias";

export interface PlanLimits {
  invoicesPerMonth: number;
  users: number;
  companies: number;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    invoicesPerMonth: 10,
    users: 1,
    companies: 1,
  },
  basico: {
    invoicesPerMonth: 100,
    users: 1,
    companies: 1,
  },
  empresa: {
    invoicesPerMonth: 500,
    users: 5,
    companies: 3,
  },
  gestorias: {
    invoicesPerMonth: Infinity,
    users: Infinity,
    companies: Infinity,
  },
};

export interface SubscriptionStatus {
  plan: PlanName;
  status: "active" | "trialing" | "past_due" | "canceled" | "inactive";
  limits: PlanLimits;
  currentPeriodEnd?: string;
}

/**
 * Obtiene el estado de suscripción de un usuario
 */
export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionStatus> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_name, status, current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return {
      plan: "free",
      status: "inactive",
      limits: PLAN_LIMITS.free,
    };
  }

  const planName = (subscription.plan_name as PlanName) || "free";

  return {
    plan: planName,
    status: subscription.status as SubscriptionStatus["status"],
    limits: PLAN_LIMITS[planName] || PLAN_LIMITS.free,
    currentPeriodEnd: subscription.current_period_end,
  };
}

/**
 * Cuenta las facturas del mes actual para un usuario
 */
export async function getMonthlyInvoiceCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString())
    .lte("created_at", endOfMonth.toISOString());

  return count || 0;
}

/**
 * Verifica si el usuario puede subir más facturas este mes
 */
export async function canUploadInvoice(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const subscription = await getUserSubscription(supabase, userId);
  const monthlyCount = await getMonthlyInvoiceCount(supabase, userId);
  const limit = subscription.limits.invoicesPerMonth;

  if (monthlyCount >= limit) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limit} facturas/mes de tu plan ${subscription.plan}. Actualiza tu plan para subir más.`,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: limit === Infinity ? Infinity : limit - monthlyCount,
  };
}

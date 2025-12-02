import { SupabaseClient } from "@supabase/supabase-js";

export type PlanName = "free" | "basico" | "pro" | string;

export interface PlanConfig {
  id: string;
  displayName: string;
  description: string | null;
  invoicesPerMonth: number;
  canSendToGestoria: boolean;
  canUseEmailIngestion: boolean;
  priceMonthly: number; // en céntimos
  stripePriceId: string | null;
  isActive: boolean;
  sortOrder: number;
  features: string[];
}

export interface PlanLimits {
  invoicesPerMonth: number;
  canSendToGestoria: boolean;
  canUseEmailIngestion: boolean;
}

// Fallback por defecto si no se puede leer de BD
const DEFAULT_PLANS: Record<string, PlanConfig> = {
  free: {
    id: "free",
    displayName: "Gratuito",
    description: "Para probar FaktuGo",
    invoicesPerMonth: 5,
    canSendToGestoria: false,
    canUseEmailIngestion: false,
    priceMonthly: 0,
    stripePriceId: null,
    isActive: true,
    sortOrder: 0,
    features: ["Hasta 5 facturas/mes", "Procesamiento IA", "Sincronización web y móvil"],
  },
  basico: {
    id: "basico",
    displayName: "Básico",
    description: "Para autónomos con volumen moderado",
    invoicesPerMonth: 50,
    canSendToGestoria: true,
    canUseEmailIngestion: true,
    priceMonthly: 999,
    stripePriceId: null,
    isActive: true,
    sortOrder: 1,
    features: ["Hasta 50 facturas/mes", "Procesamiento IA", "Envío a gestoría", "Ingesta por email", "Sincronización web y móvil", "Soporte por email"],
  },
  pro: {
    id: "pro",
    displayName: "Pro",
    description: "Para negocios con alto volumen",
    invoicesPerMonth: 200,
    canSendToGestoria: true,
    canUseEmailIngestion: true,
    priceMonthly: 2499,
    stripePriceId: null,
    isActive: true,
    sortOrder: 2,
    features: ["Todo lo del plan Básico", "Hasta 200 facturas/mes", "Soporte prioritario"],
  },
};

// Cache de planes (TTL: 5 minutos)
let plansCache: Record<string, PlanConfig> | null = null;
let plansCacheExpiry: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Obtiene todos los planes desde la BD (con cache)
 */
export async function getPlans(supabase: SupabaseClient): Promise<Record<string, PlanConfig>> {
  const now = Date.now();
  
  // Devolver cache si es válido
  if (plansCache && now < plansCacheExpiry) {
    return plansCache;
  }

  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn("No se pudieron cargar planes de BD, usando fallback:", error?.message);
      return DEFAULT_PLANS;
    }

    const plans: Record<string, PlanConfig> = {};
    for (const row of data) {
      plans[row.id] = {
        id: row.id,
        displayName: row.display_name,
        description: row.description,
        invoicesPerMonth: row.invoices_per_month,
        canSendToGestoria: row.can_send_gestoria,
        canUseEmailIngestion: row.can_use_email_ingestion,
        priceMonthly: row.price_monthly_cents,
        stripePriceId: row.stripe_price_id,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        features: Array.isArray(row.features) ? row.features : [],
      };
    }

    // Guardar en cache
    plansCache = plans;
    plansCacheExpiry = now + CACHE_TTL_MS;

    return plans;
  } catch (err) {
    console.error("Error cargando planes:", err);
    return DEFAULT_PLANS;
  }
}

/**
 * Obtiene un plan específico
 */
export async function getPlan(supabase: SupabaseClient, planId: string): Promise<PlanConfig> {
  const plans = await getPlans(supabase);
  return plans[planId] || plans["free"] || DEFAULT_PLANS["free"];
}

/**
 * Invalida el cache de planes (útil después de editar desde admin)
 */
export function invalidatePlansCache(): void {
  plansCache = null;
  plansCacheExpiry = 0;
}

/**
 * Convierte PlanConfig a PlanLimits para compatibilidad
 */
function toLimits(plan: PlanConfig): PlanLimits {
  return {
    invoicesPerMonth: plan.invoicesPerMonth,
    canSendToGestoria: plan.canSendToGestoria,
    canUseEmailIngestion: plan.canUseEmailIngestion,
  };
}

export interface SubscriptionStatus {
  plan: PlanName;
  planConfig: PlanConfig;
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
  // Cargar planes desde BD
  const plans = await getPlans(supabase);
  const freePlan = plans["free"] || DEFAULT_PLANS["free"];

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
      planConfig: freePlan,
      status: "inactive",
      limits: toLimits(freePlan),
    };
  }

  const planName = subscription.plan_name || "free";
  const planConfig = plans[planName] || freePlan;

  return {
    plan: planName,
    planConfig,
    status: subscription.status as SubscriptionStatus["status"],
    limits: toLimits(planConfig),
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

/**
 * Verifica si el usuario puede enviar facturas a gestoría
 */
export async function canSendToGestoria(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await getUserSubscription(supabase, userId);
  
  if (!subscription.limits.canSendToGestoria) {
    return {
      allowed: false,
      reason: "El envío a gestoría no está disponible en el plan gratuito. Actualiza a Básico o Pro para usar esta función.",
    };
  }

  return { allowed: true };
}

/**
 * Verifica si el usuario puede usar la ingesta de facturas por email
 */
export async function canUseEmailIngestion(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await getUserSubscription(supabase, userId);
  
  if (!subscription.limits.canUseEmailIngestion) {
    return {
      allowed: false,
      reason: "La ingesta por email no está disponible en el plan gratuito. Actualiza a Básico o Pro para usar esta función.",
    };
  }

  return { allowed: true };
}

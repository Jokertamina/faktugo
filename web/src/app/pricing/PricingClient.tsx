"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SubscriptionData {
  plan: string;
  status: string;
  subscription: {
    id: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

const PLANS = [
  {
    id: "basico",
    name: "Plan Básico",
    price: "9,99",
    period: "mes",
    description: "Para autónomos y pequeños negocios",
    features: [
      "Sincronización multi-dispositivo",
      "Hasta 100 facturas/mes",
      "1 usuario incluido",
      "Envío automático a gestoría",
      "Soporte por email",
    ],
    highlight: false,
  },
  {
    id: "empresa",
    name: "Plan Empresa",
    price: "24,99",
    period: "mes",
    description: "Para equipos y alto volumen",
    features: [
      "Todo lo del plan Básico",
      "Hasta 500 facturas/mes",
      "5 usuarios incluidos",
      "3 empresas incluidas",
      "Estadísticas avanzadas",
      "Soporte prioritario",
    ],
    highlight: true,
    badge: "Recomendado",
  },
  {
    id: "gestorias",
    name: "Gestorías",
    price: "49,99",
    period: "mes",
    description: "Para despachos profesionales",
    features: [
      "Todo lo del plan Empresa",
      "Facturas ilimitadas",
      "Usuarios ilimitados",
      "Panel multi-cliente",
      "Historial completo",
      "Soporte premium",
    ],
    highlight: false,
  },
];

export default function PricingClient() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const res = await fetch("/api/stripe/subscription");
        if (res.ok) {
          const data: SubscriptionData = await res.json();
          setCurrentPlan(data.plan);
          setIsLoggedIn(true);
        }
      } catch {
        // No autenticado
      }
    }
    checkSubscription();
  }, []);

  async function handleSubscribe(planId: string) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al crear sesión de pago");
      }
    } catch (error) {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(null);
    }
  }

  async function handleManageSubscription() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al abrir portal de facturación");
      }
    } catch (error) {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-10 font-sans">
        <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Planes de FaktuGo
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Elige el plan que mejor se adapte a tu volumen de facturas.
              Todos los planes incluyen 14 días de prueba gratuita.
            </p>
          </div>
          {currentPlan !== "free" && (
            <button
              onClick={handleManageSubscription}
              disabled={loading === "portal"}
              className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-50"
            >
              {loading === "portal" ? "Cargando..." : "Gestionar suscripción"}
            </button>
          )}
        </header>

        {/* Plan gratuito */}
        <section className="mb-8">
          <article className="flex flex-col gap-3 rounded-3xl border border-slate-800/80 bg-[#0B1220] p-6 shadow-2xl shadow-black/60 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">Plan Gratuito</h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-emerald-300">
                {currentPlan === "free" ? "Tu plan actual" : "Para empezar"}
              </p>
              <p className="mt-3 text-sm text-slate-300">
                Prueba FaktuGo sin compromiso. Hasta 10 facturas/mes para que
                veas cómo funciona.
              </p>
            </div>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm text-slate-200 sm:mt-0 sm:items-end">
              <div className="flex items-baseline gap-1 text-2xl font-semibold">
                <span>0€</span>
                <span className="text-xs font-normal text-slate-400">/mes</span>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                10 facturas/mes
              </span>
            </div>
          </article>
        </section>

        {/* Planes de pago */}
        <section className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isLoading = loading === plan.id;

            return (
              <article
                key={plan.id}
                className={`flex flex-col rounded-3xl border p-6 shadow-2xl ${
                  plan.highlight
                    ? "border-[#2A5FFF]/60 bg-[#0B1220] shadow-[0_0_40px_rgba(42,95,255,0.35)]"
                    : "border-slate-800/80 bg-[#0B1220] shadow-black/60"
                }`}
              >
                {plan.badge && (
                  <div className="mb-2 inline-flex w-fit items-center rounded-full bg-[#2A5FFF]/20 px-3 py-1 text-xs font-medium text-[#AECBFF]">
                    {plan.badge}
                  </div>
                )}
                <h2 className="text-lg font-semibold text-slate-50">{plan.name}</h2>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">
                  {plan.description}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">{plan.price}€</span>
                  <span className="text-sm text-slate-400">/{plan.period}</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-200">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    isCurrentPlan ? handleManageSubscription() : handleSubscribe(plan.id)
                  }
                  disabled={isLoading || loading === "portal"}
                  className={`mt-6 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                    isCurrentPlan
                      ? "border border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      : plan.highlight
                      ? "bg-[#2A5FFF] text-white shadow-lg shadow-blue-500/40 hover:bg-[#224bcc]"
                      : "border border-slate-600 text-slate-100 hover:border-slate-300 hover:bg-white/10"
                  }`}
                >
                  {isLoading
                    ? "Cargando..."
                    : isCurrentPlan
                    ? "Plan actual"
                    : "Suscribirse"}
                </button>
              </article>
            );
          })}
        </section>

        {/* Info adicional */}
        <section className="mt-12 rounded-2xl border border-slate-800 bg-[#0B1220] p-6">
          <h3 className="text-sm font-semibold text-slate-50">
            Información importante
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Todos los planes incluyen 14 días de prueba gratuita</li>
            <li>• Puedes cancelar en cualquier momento desde el portal de facturación</li>
            <li>• Los pagos son procesados de forma segura por Stripe</li>
            <li>• IVA no incluido (se añadirá según tu ubicación)</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

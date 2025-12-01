"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SubscriptionData {
  plan: string;
  status: string;
  subscription: {
    id: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

const PLAN_NAMES: Record<string, string> = {
  free: "Gratuito",
  basico: "Básico",
  empresa: "Empresa",
  gestorias: "Gestorías",
};

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basico: 100,
  empresa: 500,
  gestorias: Infinity,
};

export default function SubscriptionCard() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/stripe/subscription");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Error silencioso
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      alert("Error al abrir el portal de facturación");
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
        <div className="animate-pulse">
          <div className="h-4 w-24 rounded bg-slate-700" />
          <div className="mt-2 h-6 w-16 rounded bg-slate-700" />
        </div>
      </div>
    );
  }

  const plan = data?.plan || "free";
  const planName = PLAN_NAMES[plan] || "Gratuito";
  const limit = PLAN_LIMITS[plan] || 10;
  const isActive = data?.status === "active" || data?.status === "trialing";
  const isPaid = plan !== "free";

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Tu plan</p>
          <p className="text-lg font-semibold text-slate-50">{planName}</p>
          <p className="text-xs text-slate-400">
            {limit === Infinity ? "Facturas ilimitadas" : `${limit} facturas/mes`}
          </p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isActive && isPaid
              ? "bg-emerald-500/20 text-emerald-300"
              : isPaid
              ? "bg-amber-500/20 text-amber-300"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {isActive && isPaid ? "Activo" : isPaid ? data?.status : "Gratis"}
        </div>
      </div>

      {data?.subscription?.cancelAtPeriodEnd && (
        <p className="mt-2 text-xs text-amber-400">
          Se cancelará al final del período
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {isPaid ? (
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="flex-1 rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5 disabled:opacity-50"
          >
            {portalLoading ? "Cargando..." : "Gestionar"}
          </button>
        ) : (
          <Link
            href="/pricing"
            className="flex-1 rounded-full bg-[#2A5FFF] px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-[#224bcc]"
          >
            Mejorar plan
          </Link>
        )}
      </div>
    </div>
  );
}

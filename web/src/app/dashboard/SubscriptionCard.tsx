"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UsageData {
  plan: string;
  status: string;
  isAdmin?: boolean;
  usage: {
    invoicesThisMonth: number;
    invoicesLimit: number;
    invoicesRemaining: number;
    percentUsed: number;
  };
  features: {
    canSendToGestoria: boolean;
    canUseEmailIngestion: boolean;
  };
}

const PLAN_NAMES: Record<string, string> = {
  free: "Gratuito",
  basico: "Básico",
  pro: "Pro",
  admin: "Administrador",
};

export default function SubscriptionCard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/stripe/usage");
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
    fetchUsage();
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
  const isAdmin = data?.isAdmin || false;
  const isActive = data?.status === "active" || data?.status === "trialing";
  const isPaid = plan !== "free" && plan !== "admin";
  
  const used = data?.usage?.invoicesThisMonth || 0;
  const limit = data?.usage?.invoicesLimit || 5;
  const remaining = data?.usage?.invoicesRemaining || 0;
  const percentUsed = data?.usage?.percentUsed || 0;
  
  const isNearLimit = !isAdmin && percentUsed >= 80;
  const isAtLimit = !isAdmin && remaining === 0;

  // Vista especial para admins
  if (isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-amber-400">Tu rol</p>
            <p className="text-lg font-semibold text-slate-50">Administrador</p>
          </div>
          <div className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
            👑 Owner
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Acceso ilimitado a todas las funciones
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span>📄 {used} facturas este mes</span>
          <span>·</span>
          <span>∞ Sin límites</span>
        </div>
        <Link
          href="/admin"
          className="mt-3 block rounded-full bg-amber-500/20 px-3 py-1.5 text-center text-xs font-medium text-amber-300 hover:bg-amber-500/30"
        >
          Panel de administración
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400">Tu plan</p>
          <p className="text-lg font-semibold text-slate-50">{planName}</p>
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

      {/* Barra de uso */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">Facturas este mes</span>
          <span className={`font-medium ${isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-slate-300"}`}>
            {used} / {limit}
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
        <p className={`text-xs mt-1 ${isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-slate-500"}`}>
          {isAtLimit 
            ? "Has alcanzado el límite" 
            : `${remaining} facturas restantes`}
        </p>
      </div>

      {/* Botón */}
      <div className="mt-3 flex gap-2">
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
            className={`flex-1 rounded-full px-3 py-1.5 text-center text-xs font-medium text-white ${
              isAtLimit || isNearLimit 
                ? "bg-amber-500 hover:bg-amber-600 animate-pulse" 
                : "bg-[#2A5FFF] hover:bg-[#224bcc]"
            }`}
          >
            {isAtLimit ? "Necesitas mejorar" : "Mejorar plan"}
          </Link>
        )}
      </div>
    </div>
  );
}

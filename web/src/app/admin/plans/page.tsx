"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Plan {
  id: string;
  display_name: string;
  description: string | null;
  invoices_per_month: number;
  can_send_gestoria: boolean;
  can_use_email_ingestion: boolean;
  price_monthly_cents: number;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
  features: string[];
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/admin/plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Error cargando planes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function savePlan(plan: Plan) {
    setSaving(plan.id);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          displayName: plan.display_name,
          description: plan.description,
          invoicesPerMonth: plan.invoices_per_month,
          canSendToGestoria: plan.can_send_gestoria,
          canUseEmailIngestion: plan.can_use_email_ingestion,
          priceMonthly: plan.price_monthly_cents,
          stripePriceId: plan.stripe_price_id,
          isActive: plan.is_active,
          sortOrder: plan.sort_order,
          features: plan.features,
        }),
      });

      if (res.ok) {
        await fetchPlans();
        setEditingPlan(null);
      } else {
        const data = await res.json();
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error guardando plan:", error);
      alert("Error al guardar el plan");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Gestión de Planes</h1>
          <p className="mt-1 text-sm text-slate-400">
            Edita los límites y características de cada plan. Los cambios se aplican inmediatamente.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Volver al panel
        </Link>
      </div>

      {/* Plans Grid - Responsive */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const effectivePlan =
            editingPlan && editingPlan.id === plan.id ? editingPlan : plan;

          return (
            <PlanCard
              key={plan.id}
              plan={effectivePlan}
              isEditing={editingPlan?.id === plan.id}
              isSaving={saving === plan.id}
              onEdit={() => setEditingPlan(plan)}
              onCancel={() => setEditingPlan(null)}
              onSave={(updated) => savePlan(updated)}
              onChange={(updated) => setEditingPlan(updated)}
            />
          );
        })}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onChange,
}: {
  plan: Plan;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (plan: Plan) => void;
  onChange: (plan: Plan) => void;
}) {
  if (isEditing) {
    return (
      <div className="rounded-xl border border-blue-500/50 bg-[#0B1220] p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-50">
            Editando: {plan.display_name}
          </h3>
          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
            {plan.id}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Nombre */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nombre</label>
            <input
              type="text"
              value={plan.display_name}
              onChange={(e) => onChange({ ...plan, display_name: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Límite de facturas */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">Facturas/mes</label>
            <input
              type="number"
              value={plan.invoices_per_month}
              onChange={(e) => onChange({ ...plan, invoices_per_month: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Precio */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">Precio (céntimos)</label>
            <input
              type="number"
              value={plan.price_monthly_cents}
              onChange={(e) => onChange({ ...plan, price_monthly_cents: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              = {(plan.price_monthly_cents / 100).toFixed(2)}€/mes
            </p>
          </div>

          {/* Stripe Price ID */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">Stripe Price ID</label>
            <input
              type="text"
              value={plan.stripe_price_id || ""}
              onChange={(e) => onChange({ ...plan, stripe_price_id: e.target.value || null })}
              placeholder="price_..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Descripción */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Descripción</label>
            <input
              type="text"
              value={plan.description || ""}
              onChange={(e) => onChange({ ...plan, description: e.target.value || null })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            <Toggle
              label="Envío a gestoría"
              checked={plan.can_send_gestoria}
              onChange={(v) => onChange({ ...plan, can_send_gestoria: v })}
            />
            <Toggle
              label="Correo interno FaktuGo (facturas por correo)"
              checked={plan.can_use_email_ingestion}
              onChange={(v) => onChange({ ...plan, can_use_email_ingestion: v })}
            />
            <Toggle
              label="Plan activo"
              checked={plan.is_active}
              onChange={(v) => onChange({ ...plan, is_active: v })}
            />
          </div>

          {/* Features */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">
              Características (una por línea)
            </label>
            <textarea
              value={plan.features.join("\n")}
              onChange={(e) => onChange({ ...plan, features: e.target.value.split("\n").filter(Boolean) })}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onSave(plan)}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-50">{plan.display_name}</h3>
            <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
              {plan.id}
            </span>
            {!plan.is_active && (
              <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                Inactivo
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-400">
            {(plan.price_monthly_cents / 100).toFixed(2)}€
            <span className="text-sm font-normal text-slate-400">/mes</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="text-xs text-slate-400">Facturas/mes</p>
          <p className="text-lg font-semibold text-slate-50">{plan.invoices_per_month}</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="text-xs text-slate-400">Envío gestoría</p>
          <p className={`text-lg font-semibold ${plan.can_send_gestoria ? "text-emerald-400" : "text-red-400"}`}>
            {plan.can_send_gestoria ? "Sí" : "No"}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="text-xs text-slate-400">Correo interno (email)</p>
          <p className={`text-lg font-semibold ${plan.can_use_email_ingestion ? "text-emerald-400" : "text-red-400"}`}>
            {plan.can_use_email_ingestion ? "Sí" : "No"}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="text-xs text-slate-400">Stripe ID</p>
          <p className="truncate text-sm font-medium text-slate-300" title={plan.stripe_price_id || "N/A"}>
            {plan.stripe_price_id ? "✓ Configurado" : "—"}
          </p>
        </div>
      </div>

      {/* Features */}
      {plan.features.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-slate-400">Características:</p>
          <div className="flex flex-wrap gap-1">
            {plan.features.map((f, i) => (
              <span
                key={i}
                className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit button */}
      <div className="mt-4">
        <button
          onClick={onEdit}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Editar plan
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <div
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-700"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </div>
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}

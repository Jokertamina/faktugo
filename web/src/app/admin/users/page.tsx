"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  displayName: string;
  companyName: string | null;
  email: string;
  createdAt: string;
  isAdmin: boolean;
  currentPlan: string;
  subscription: {
    id: string;
    plan: string;
    status: string;
    expiresAt: string;
    isManual: boolean;
    assignedAt: string | null;
    reason: string | null;
  } | null;
}

interface Plan {
  id: string;
  display_name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newPlan, setNewPlan] = useState("");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/users?search=${encodeURIComponent(search)}`
        : "/api/admin/users";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      setMessage({ type: "error", text: "Error cargando usuarios" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlans() {
    try {
      const res = await fetch("/api/admin/plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch {
      // Error silencioso
    }
  }

  async function assignPlan() {
    if (!selectedUser || !newPlan) return;

    setAssigning(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/users/assign-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          planId: newPlan,
          durationDays: duration,
          reason: reason || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setShowModal(false);
        setSelectedUser(null);
        setNewPlan("");
        setReason("");
        fetchUsers();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Error asignando plan" });
    } finally {
      setAssigning(false);
    }
  }

  async function revokePlan(userId: string) {
    if (!confirm("¿Revocar la suscripción manual? El usuario volverá al plan gratuito.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/assign-plan?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        fetchUsers();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Error revocando plan" });
    }
  }

  function openAssignModal(user: User) {
    setSelectedUser(user);
    setNewPlan(user.currentPlan === "free" ? "basico" : user.currentPlan);
    setDuration(30);
    setReason("");
    setShowModal(true);
  }

  const planColors: Record<string, string> = {
    free: "bg-slate-600 text-slate-200",
    basico: "bg-blue-500/20 text-blue-300",
    pro: "bg-emerald-500/20 text-emerald-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Gestión de Usuarios</h1>
        <p className="mt-1 text-sm text-slate-400">
          Asigna planes manualmente a usuarios
        </p>
      </div>

      {message.text && (
        <div className={`rounded-lg p-3 text-sm ${
          message.type === "error"
            ? "bg-red-500/20 text-red-300"
            : "bg-emerald-500/20 text-emerald-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
          placeholder="Buscar por nombre o empresa..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={fetchUsers}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-8 text-center">
          <p className="text-slate-400">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              planColors={planColors}
              onAssign={() => openAssignModal(user)}
              onRevoke={() => revokePlan(user.id)}
            />
          ))}
        </div>
      )}

      {/* Modal de asignación */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0B1220] p-6">
            <h3 className="text-lg font-semibold text-slate-50">
              Asignar plan a {selectedUser.displayName}
            </h3>
            <p className="mt-1 text-sm text-slate-400">{selectedUser.email}</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
                >
                  <option value="free">Gratuito (revocar plan)</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {newPlan !== "free" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">
                      Duración (días)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                      min={1}
                      max={365}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Expira: {new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES")}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-slate-300">
                      Razón (opcional)
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ej: Promoción, prueba, compensación..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={assignPlan}
                disabled={assigning}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {assigning ? "Asignando..." : newPlan === "free" ? "Revocar plan" : "Asignar plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserCard({
  user,
  planColors,
  onAssign,
  onRevoke,
}: {
  user: User;
  planColors: Record<string, string>;
  onAssign: () => void;
  onRevoke: () => void;
}) {
  const planColor = planColors[user.currentPlan] || planColors.free;
  const isManual = user.subscription?.isManual;
  const expiresAt = user.subscription?.expiresAt;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-slate-50">{user.displayName}</h3>
            {user.isAdmin && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                Admin
              </span>
            )}
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${planColor}`}>
              {user.currentPlan.toUpperCase()}
              {isManual && " (manual)"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-slate-400">{user.email}</p>
          {user.companyName && (
            <p className="text-sm text-slate-500">{user.companyName}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {expiresAt && user.currentPlan !== "free" && (
            <p className="text-xs text-slate-500">
              {isManual ? "Expira" : "Renueva"}: {new Date(expiresAt).toLocaleDateString("es-ES")}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onAssign}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cambiar plan
            </button>
            {isManual && user.currentPlan !== "free" && (
              <button
                onClick={onRevoke}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
              >
                Revocar
              </button>
            )}
          </div>
        </div>
      </div>

      {isManual && user.subscription?.reason && (
        <div className="mt-3 rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-slate-400">
          <span className="font-medium">Razón:</span> {user.subscription.reason}
          {user.subscription.assignedAt && (
            <span className="ml-2">
              · Asignado: {new Date(user.subscription.assignedAt).toLocaleDateString("es-ES")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

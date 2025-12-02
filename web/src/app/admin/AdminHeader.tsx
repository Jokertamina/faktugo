"use client";

import { useAdmin } from "./AdminAuthGate";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminHeader() {
  const admin = useAdmin();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.refresh();
      window.location.href = "/admin";
    } catch {
      setLoggingOut(false);
    }
  }

  async function handleChangePin() {
    setMessage({ type: "", text: "" });

    if (!currentPin || !newPin || !confirmPin) {
      setMessage({ type: "error", text: "Completa todos los campos" });
      return;
    }

    if (newPin !== confirmPin) {
      setMessage({ type: "error", text: "Los PINs no coinciden" });
      return;
    }

    if (newPin.length < 4) {
      setMessage({ type: "error", text: "El PIN debe tener al menos 4 caracteres" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "PIN actualizado correctamente" });
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setTimeout(() => setShowPinModal(false), 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Error al cambiar PIN" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  }

  if (!admin) return null;

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    manager: "Manager",
    support: "Soporte",
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-200">{admin.name}</p>
          <p className="text-xs text-slate-400">{roleLabels[admin.role] || admin.role}</p>
        </div>
        <button
          onClick={() => setShowPinModal(true)}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          title="Cambiar PIN"
        >
          🔑
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          {loggingOut ? "..." : "Salir"}
        </button>
      </div>

      {/* Modal cambiar PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0B1220] p-6">
            <h3 className="text-lg font-semibold text-slate-50">Cambiar PIN</h3>
            <p className="mt-1 text-sm text-slate-400">
              Introduce tu PIN actual y el nuevo PIN
            </p>

            {message.text && (
              <div className={`mt-4 rounded-lg p-3 text-sm ${
                message.type === "error"
                  ? "bg-red-500/20 text-red-300"
                  : "bg-emerald-500/20 text-emerald-300"
              }`}>
                {message.text}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm text-slate-300">PIN actual</label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Nuevo PIN</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Confirmar nuevo PIN</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setMessage({ type: "", text: "" });
                  setCurrentPin("");
                  setNewPin("");
                  setConfirmPin("");
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePin}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Cambiar PIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

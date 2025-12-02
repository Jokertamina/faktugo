"use client";

import { useState, useEffect } from "react";

export default function AdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    allowedIPs: [] as string[],
    requireIPCheck: false,
  });
  const [newIP, setNewIP] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/admin/security");
      if (res.ok) {
        const data = await res.json();
        setConfig({
          allowedIPs: data.allowedIPs || [],
          requireIPCheck: data.requireIPCheck || false,
        });
      }
    } catch {
      setMessage({ type: "error", text: "Error cargando configuración" });
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(updates: Record<string, any>) {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Configuración guardada" });
        fetchConfig();
      } else {
        setMessage({ type: "error", text: data.error || "Error al guardar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  }

  function addIP() {
    if (!newIP.trim()) return;
    const ips = [...config.allowedIPs, newIP.trim()];
    setNewIP("");
    saveConfig({ allowedIPs: ips });
  }

  function removeIP(ip: string) {
    const ips = config.allowedIPs.filter((i) => i !== ip);
    saveConfig({ allowedIPs: ips });
  }

  function toggleIPCheck() {
    saveConfig({ requireIPCheck: !config.requireIPCheck });
  }

  function changePin() {
    if (newPin.length < 4) {
      setMessage({ type: "error", text: "El PIN debe tener al menos 4 caracteres" });
      return;
    }
    if (newPin !== confirmPin) {
      setMessage({ type: "error", text: "Los PINs no coinciden" });
      return;
    }
    saveConfig({ newPin });
    setNewPin("");
    setConfirmPin("");
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
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Seguridad del Admin</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configura el PIN de acceso y las IPs permitidas
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

      {/* Cambiar PIN */}
      <section className="rounded-xl border border-slate-800 bg-[#0B1220] p-6">
        <h2 className="text-lg font-semibold text-slate-50">Cambiar PIN</h2>
        <p className="mt-1 text-sm text-slate-400">
          El PIN actual es necesario para acceder al panel de administración.
          Al cambiarlo, todas las sesiones activas se cerrarán.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Nuevo PIN</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Mínimo 4 caracteres"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Confirmar PIN</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Repite el PIN"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={changePin}
          disabled={saving || !newPin || !confirmPin}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Cambiar PIN"}
        </button>
      </section>

      {/* Lista blanca de IPs */}
      <section className="rounded-xl border border-slate-800 bg-[#0B1220] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Lista blanca de IPs</h2>
            <p className="mt-1 text-sm text-slate-400">
              Restringe el acceso al admin a direcciones IP específicas
            </p>
          </div>
          <button
            onClick={toggleIPCheck}
            disabled={saving}
            className={`relative h-6 w-11 rounded-full transition ${
              config.requireIPCheck ? "bg-emerald-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                config.requireIPCheck ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {config.requireIPCheck && (
          <div className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="Ej: 192.168.1.1 o *"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={addIP}
                disabled={saving || !newIP.trim()}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50"
              >
                Añadir
              </button>
            </div>

            {config.allowedIPs.length > 0 ? (
              <div className="mt-3 space-y-2">
                {config.allowedIPs.map((ip) => (
                  <div
                    key={ip}
                    className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2"
                  >
                    <span className="font-mono text-sm text-slate-200">{ip}</span>
                    <button
                      onClick={() => removeIP(ip)}
                      disabled={saving}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-amber-400">
                ⚠️ No hay IPs configuradas. Añade al menos una IP o desactiva la verificación.
              </p>
            )}

            <p className="mt-3 text-xs text-slate-500">
              Usa <code className="rounded bg-slate-800 px-1">*</code> para permitir todas las IPs (no recomendado)
            </p>
          </div>
        )}
      </section>

      {/* Info */}
      <section className="rounded-xl border border-slate-800 bg-[#0B1220] p-6">
        <h2 className="text-lg font-semibold text-slate-50">Información</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>• La sesión de admin dura 24 horas desde la verificación del PIN</li>
          <li>• Si cambias el PIN, todas las sesiones activas se cerrarán</li>
          <li>• La verificación de IP se hace antes de pedir el PIN</li>
          <li>• El PIN por defecto es <code className="rounded bg-slate-800 px-1">123456</code> (cámbialo)</li>
        </ul>
      </section>
    </div>
  );
}

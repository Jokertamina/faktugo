"use client";

import { useState, useEffect } from "react";

interface AuthStatus {
  valid: boolean;
  reason?: string;
  ip?: string;
}

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ valid: false, reason: "error" });
    }
  }

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({ valid: true });
        setPin("");
      } else {
        setError(data.error || "Error al verificar PIN");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  // Cargando estado inicial
  if (status === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </div>
    );
  }

  // Sesión válida - mostrar contenido
  if (status.valid) {
    return <>{children}</>;
  }

  // IP no permitida
  if (status.reason === "ip_not_allowed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0B1220] p-8 text-center">
          <div className="mb-4 text-5xl">🚫</div>
          <h1 className="text-xl font-semibold text-slate-50">Acceso denegado</h1>
          <p className="mt-2 text-sm text-slate-400">
            Tu dirección IP no está autorizada para acceder al panel de administración.
          </p>
          <div className="mt-4 rounded-lg bg-slate-800 p-3">
            <p className="text-xs text-slate-400">Tu IP:</p>
            <p className="font-mono text-sm text-slate-200">{status.ip}</p>
          </div>
          <a
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-slate-700 px-6 py-2 text-sm text-white hover:bg-slate-600"
          >
            Volver al dashboard
          </a>
        </div>
      </div>
    );
  }

  // Requiere PIN
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050816] p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0B1220] p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 text-4xl">🔐</div>
          <h1 className="text-xl font-semibold text-slate-50">Panel de Administración</h1>
          <p className="mt-2 text-sm text-slate-400">
            Introduce el PIN para acceder
          </p>
          {status.ip && (
            <p className="mt-1 text-xs text-slate-500">
              IP: {status.ip}
            </p>
          )}
        </div>

        <form onSubmit={submitPin} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN de acceso"
              autoFocus
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center text-lg tracking-widest text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Acceder"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Volver al dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, createContext, useContext } from "react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: {
    dashboard: boolean;
    users: boolean;
    plans: boolean;
    tickets: boolean;
    security: boolean;
    admins: boolean;
  };
}

interface AuthStatus {
  valid: boolean;
  reason?: string;
  admin?: AdminUser;
}

// Context para compartir datos del admin
const AdminContext = createContext<AdminUser | null>(null);

export function useAdmin() {
  return useContext(AdminContext);
}

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [email, setEmail] = useState("");
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !pin.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({ valid: true, admin: data.admin });
        setEmail("");
        setPin("");
      } else {
        setError(data.error || "Error al iniciar sesión");
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
  if (status.valid && status.admin) {
    return (
      <AdminContext.Provider value={status.admin}>
        {children}
      </AdminContext.Provider>
    );
  }

  // Cuenta deshabilitada
  if (status.reason === "account_disabled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0B1220] p-8 text-center">
          <div className="mb-4 text-5xl">🚫</div>
          <h1 className="text-xl font-semibold text-slate-50">Cuenta deshabilitada</h1>
          <p className="mt-2 text-sm text-slate-400">
            Tu cuenta de administrador ha sido deshabilitada. Contacta con el propietario.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-slate-700 px-6 py-2 text-sm text-white hover:bg-slate-600"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // Login requerido
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050816] p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0B1220] p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 text-4xl">🔐</div>
          <h1 className="text-xl font-semibold text-slate-50">Panel de Administración</h1>
          <p className="mt-2 text-sm text-slate-400">
            Acceso exclusivo para administradores de FaktuGo
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoFocus
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">PIN de acceso</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center text-lg tracking-widest text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !pin.trim()}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Acceder"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Volver a FaktuGo
          </a>
        </div>
      </div>
    </div>
  );
}
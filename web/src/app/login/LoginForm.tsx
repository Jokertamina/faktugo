'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "signup") {
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

        if (!trimmedFirst || !trimmedLast) {
          setError("Nombre y apellidos son obligatorios para crear la cuenta.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              first_name: trimmedFirst,
              last_name: trimmedLast,
            },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      const message = err?.message ?? "No se pudo completar la operacion";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="inline-flex rounded-full bg-white/5 p-1 text-xs font-medium text-slate-200">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-3 py-1 transition ${
            mode === "login" ? "bg-slate-100/10 text-slate-50" : "text-slate-300"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-full px-3 py-1 transition ${
            mode === "signup" ? "bg-slate-100/10 text-slate-50" : "text-slate-300"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {mode === "signup" && (
        <>
          <div className="space-y-1 text-sm">
            <label className="block text-slate-300" htmlFor="firstName">
              Nombre
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-slate-500"
            />
          </div>
          <div className="space-y-1 text-sm">
            <label className="block text-slate-300" htmlFor="lastName">
              Apellidos
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-slate-500"
            />
          </div>
        </>
      )}

      <div className="space-y-1 text-sm">
        <label className="block text-slate-300" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-slate-500"
        />
      </div>

      <div className="space-y-1 text-sm">
        <label className="block text-slate-300" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-slate-500"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#2A5FFF] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-[#224bcc] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
      </button>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        Al crear una cuenta, aceptas que FaktuGo almacene tus datos de acceso y metadatos de uso
        siguiendo el enfoque Local-First descrito en la documentación tecnica.
      </p>
    </form>
  );
}

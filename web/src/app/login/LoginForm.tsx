'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

// Traducir errores de Supabase a mensajes claros en español
function getErrorMessage(error: any, mode: "login" | "signup"): string {
  const code = error?.code || "";
  const message = (error?.message || "").toLowerCase();

  // Errores de login
  if (message.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos. Por favor, verifica tus datos.";
  }
  if (message.includes("email not confirmed")) {
    return "Tu email aún no está confirmado. Revisa tu bandeja de entrada y haz clic en el enlace de confirmación.";
  }
  if (message.includes("user not found") || code === "user_not_found") {
    return "No existe ninguna cuenta con este email. ¿Quieres crear una cuenta nueva?";
  }

  // Errores de registro
  if (message.includes("user already registered") || message.includes("already exists")) {
    return "Ya existe una cuenta con este email. Prueba a iniciar sesión.";
  }
  if (message.includes("password") && message.includes("weak")) {
    return "La contraseña es demasiado débil. Usa al menos 6 caracteres con letras y números.";
  }
  if (message.includes("password") && (message.includes("short") || message.includes("length"))) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  // Errores de email
  if (message.includes("invalid email") || message.includes("email") && message.includes("invalid")) {
    return "El formato del email no es válido. Revisa que esté bien escrito.";
  }
  if (message.includes("email rate limit")) {
    return "Has intentado demasiadas veces. Espera unos minutos antes de volver a intentarlo.";
  }

  // Errores de red/servidor
  if (message.includes("network") || message.includes("fetch")) {
    return "Error de conexión. Comprueba tu conexión a internet e inténtalo de nuevo.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Demasiados intentos. Por favor, espera unos minutos antes de volver a intentarlo.";
  }

  // Mensaje genérico según el modo
  if (mode === "login") {
    return "No se pudo iniciar sesión. Verifica tu email y contraseña.";
  }
  return "No se pudo crear la cuenta. Inténtalo de nuevo.";
}

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
      const message = getErrorMessage(err, mode);
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
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="text-red-400">⚠️</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
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

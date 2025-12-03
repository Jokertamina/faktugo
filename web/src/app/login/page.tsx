import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Acceder a FaktuGo",
  description:
    "Inicia sesión o crea una cuenta en FaktuGo para gestionar y sincronizar tus facturas entre el móvil y el panel web.",
  alternates: {
    canonical: "/login",
  },
};

export default async function LoginPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 font-sans sm:px-6 sm:py-16">
        <div className="grid w-full gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="hidden space-y-5 lg:block">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Accede a tu cuenta FaktuGo
            </h1>
            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              Inicia sesión o crea una cuenta para sincronizar metadatos de tus facturas entre el
              móvil y el panel web y activar funciones avanzadas como el envío de facturas a tu
              gestoría por email (según tu plan).
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              <li>• Sesiones seguras con Supabase Auth.</li>
              <li>• Preparado para multiempresa y próximamente panel para gestorías.</li>
              <li>• Sincronización en la nube para acceder a tus facturas desde todos tus dispositivos.</li>
            </ul>
          </section>

          <section className="w-full max-w-md mx-auto lg:max-w-none rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-[#020617] p-5 shadow-2xl shadow-black/60 sm:p-8">
            <div className="mb-4 text-center lg:text-left">
              <h2 className="text-lg font-semibold text-slate-50 lg:text-base">Acceder a FaktuGo</h2>
              <p className="mt-1 text-xs text-slate-400 lg:hidden">Inicia sesión o crea una cuenta</p>
            </div>
            <LoginForm />
          </section>
        </div>
      </main>
    </div>
  );
}

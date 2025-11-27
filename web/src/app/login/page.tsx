import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import LoginForm from "./LoginForm";

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
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16 font-sans">
        <div className="grid w-full gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="space-y-5">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Accede a tu cuenta FaktuGo
            </h1>
            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              Inicia sesión o crea una cuenta para sincronizar metadatos de tus facturas entre el
              movil y el panel web, activar integraciones con Drive y configurar envios automaticos
              a tu gestoria.
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              <li>• Sesiones seguras con Supabase Auth.</li>
              <li>• Preparado para multiempresa y panel para gestorias.</li>
              <li>• Enfoque Local-First: solo se sincronizan metadatos necesarios.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-800/80 bg-[#020617] p-6 shadow-2xl shadow-black/60 sm:p-8">
            <h2 className="mb-4 text-base font-semibold text-slate-50">Email y contraseña</h2>
            <LoginForm />
          </section>
        </div>
      </main>
    </div>
  );
}

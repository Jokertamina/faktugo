import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cómo funciona FaktuGo",
  description:
    "Descubre paso a paso cómo FaktuGo escanea, detecta, clasifica, sincroniza y envía tus facturas a gestoría.",
  alternates: {
    canonical: "/como-funciona",
  },
  openGraph: {
    title: "Cómo funciona FaktuGo",
    description:
      "De una foto de factura al panel organizado y listo para tu gestoría con FaktuGo.",
    url: "https://faktugo.com/como-funciona",
  },
};

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl space-y-10 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Cómo funciona
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            De una foto al panel listo para tu gestoría.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            FaktuGo está pensado para que el flujo completo sea siempre el mismo: capturas la
            factura una vez y a partir de ahí todo se organiza solo. Esta página recoge el flujo
            completo paso a paso.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pasos del flujo</h2>
          <ol className="grid gap-4 text-sm text-slate-200 md:grid-cols-5">
            <li className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">1. Escanea</p>
              <p className="mt-2 text-sm">
                Haz una foto con el móvil o sube un PDF desde tus archivos. Sin pasos técnicos ni
                menús complicados.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">2. Detecta</p>
              <p className="mt-2 text-sm">
                Detecta fecha, proveedor e importe analizando automáticamente el documento con IA y
                lectura de texto pensada para tickets reales del día a día.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">3. Clasifica</p>
              <p className="mt-2 text-sm">
                Coloca cada documento en su carpeta mensual siguiendo las reglas de periodos de
                FaktuGo; en el panel podrás ver también vistas agrupadas por semanas.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                4. Sincroniza (opcional)
              </p>
              <p className="mt-2 text-sm">
                Si activas la cuenta FaktuGo, sincroniza metadatos entre móvil, web y tablet usando
                Supabase sin dejar de ser Local-First.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                5. Envía (opcional)
              </p>
              <p className="mt-2 text-sm">
                Envía todo a tu gestoría por email o compártelo desde tu nube sin perdidas de tiempo.
              </p>
            </li>
          </ol>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-800 bg-[#0B1220] p-6 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                ¿Listo para verlo en acción?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Crea tu cuenta gratis en menos de un minuto, sube unas cuantas facturas de prueba y
                revisa cómo quedan organizadas en el panel.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#2A5FFF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#224bcc]"
              >
                Crear cuenta
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:border-slate-300 hover:bg-slate-900/60"
              >
                Ver demo del panel
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

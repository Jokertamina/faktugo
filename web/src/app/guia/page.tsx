import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "./guides";

export const metadata: Metadata = {
  title: "Guías para organizar y gestionar tus facturas",
  description:
    "Guías prácticas para autónomos y empresas sobre cómo organizar, digitalizar y enviar facturas y tickets a tu gestoría.",
  alternates: {
    canonical: "/guia",
  },
};

export default function GuidesIndexPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl space-y-10 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">GUÍAS</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Aprende a domar tus facturas.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Contenido pensado para que cualquier autónomo o pequeña empresa pueda dejar de pelearse
            con papeles, correos y carpetas caóticas. Cada guía termina con pasos concretos que puedes
            aplicar hoy mismo.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {guides.map((guide) => (
            <article
              key={guide.slug}
              className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#0B1220] p-6 shadow-2xl shadow-black/60"
            >
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Guía sobre facturas
                </p>
                <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
                  <Link
                    href={`/guia/${guide.slug}`}
                    className="hover:text-white hover:underline decoration-slate-500/60"
                  >
                    {guide.title}
                  </Link>
                </h2>
                <p className="text-sm text-slate-300">{guide.description}</p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <div className="flex flex-wrap gap-1">
                  {guide.keywords.slice(0, 2).map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <span>{guide.readingTimeMinutes} min de lectura</span>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

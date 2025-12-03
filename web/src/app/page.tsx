import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import HeroDemoPanel from "@/components/HeroDemoPanel";

export const metadata: Metadata = {
  title: "App de facturas para autónomos y empresas",
  description:
    "FaktuGo es la app de facturas para autónomos y empresas que automatiza el escaneado, clasificación y organización de facturas y tickets desde el móvil y el navegador.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "App de facturas para autónomos y empresas",
    description:
      "Escanea, clasifica y organiza tus facturas y tickets automáticamente con FaktuGo, app móvil y web.",
    url: "https://faktugo.com/",
    images: [
      {
        url: "/og-faktugo.svg",
        width: 1200,
        height: 630,
        alt: "FaktuGo — App de facturas para autónomos y empresas",
      },
    ],
  },
};

export default async function Home() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const primaryCtaHref = user ? "/dashboard" : "/login";
  const primaryCtaLabel = user ? "Ver panel" : "Empieza gratis en menos de 1 minuto";

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl space-y-24 px-6 py-16 font-sans">
        {/* Sección 1 — Hero */}
        <section className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-24">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22CC88]" />
              <span>Móvil + Web · Automatización · Privacidad</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Tus facturas, en piloto automático.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              FaktuGo es la app de facturas para autónomos, empresas que automatiza
              todo el proceso de gestionar facturas y tickets: escanear, clasificar, ordenar,
              sincronizar y enviar a gestoría. Tú solo haces una foto o subes un archivo; el resto
              se hace solo.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center justify-center rounded-full bg-[#2A5FFF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#224bcc]"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 hover:border-slate-300 hover:bg-slate-900/60"
              >
                Descargar app móvil
              </Link>
            </div>
            <dl className="grid gap-4 pt-4 text-sm text-slate-300 sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-slate-50">Simplicidad real</dt>
                <dd>Sin contabilidad ni pasos innecesarios. Haces la foto y sigues con tu día.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-50">Automatización total</dt>
                <dd>
                  Clasificación automática por periodos, análisis con IA de las facturas y opción de
                  enviar documentación a tu gestoría directamente desde el panel.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-50">Privacidad y control de datos</dt>
                <dd>Tus facturas son tuyas. Controlas qué documentos subes y cómo se comparten con tu gestoría.</dd>
              </div>
            </dl>
          </div>

          <div id="demo" className="flex-1">
            <HeroDemoPanel />
          </div>
        </section>

        {/* Sección 2 — ¿Por qué FaktuGo? */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            ¿Por qué FaktuGo?
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Automático</h3>
              <p className="mt-2 text-sm text-slate-300">
                Clasifica y organiza cada factura por mes o semana sin que tengas que crear carpetas
                manualmente.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Flexible</h3>
              <p className="mt-2 text-sm text-slate-300">
                Drive, email y sincronización con la nube son opcionales. Empieza con lo básico y
                añade integraciones cuando las necesites.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Privado</h3>
              <p className="mt-2 text-sm text-slate-300">
                Tus documentos se almacenan de forma segura y solo se utilizan para ayudarte a
                organizar tus facturas y enviarlas a tu gestoría.
              </p>
            </div>
          </div>
        </section>

        

        {/* Sección 4 — Funciones avanzadas (lo que ya existe hoy) */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Funciones avanzadas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Análisis con IA</h3>
              <p className="mt-2 text-sm text-slate-300">
                Analiza facturas con IA para detectar el tipo de documento y proponer proveedor,
                fecha, importe y una categoría de gasto que luego puedes revisar en el panel.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Filtros y búsqueda</h3>
              <p className="mt-2 text-sm text-slate-300">
                Filtra por estado, categoría, rango de fechas o proveedor y combina búsquedas para
                encontrar cualquier factura en segundos.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Detección de duplicados</h3>
              <p className="mt-2 text-sm text-slate-300">
                Evita subir la misma factura dos veces comparando fecha, importe, proveedor y, cuando
                existe, el número de factura.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Envío a gestoría</h3>
              <p className="mt-2 text-sm text-slate-300">
                Envía facturas individuales a tu gestoría por email directamente desde el panel cuando
                tengas configurado su correo y tu plan lo permita.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Panel web</h3>
              <p className="mt-2 text-sm text-slate-300">
                Revisa, filtra y edita tus facturas desde cualquier ordenador con un panel web pensado
                para negocio.
              </p>
            </div>
          </div>
        </section>

        {/* Sección 5 — Para quién es */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Para quién es</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Autónomos</h3>
              <p className="mt-2 text-sm text-slate-300">
                Escanea desde movil o sube vía web facturas al momento y olvídate de tanto papeleo.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Empresas</h3>
              <p className="mt-2 text-sm text-slate-300">
                Centraliza la documentación de tu negocio y gana visibilidad sobre el gasto
                mensual.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Gestorías</h3>
              <p className="mt-2 text-sm text-slate-300">
                Recibe la documentación de tus clientes ordenada y siempre a tiempo, sin cadenas
                infinitas de correos.
                <br />
                <span className="text-xs text-slate-400">(Próximamente)</span>
              </p>
            </article>
          </div>
        </section>

        

        {/* Sección 7 — Pricing (teaser hacia /pricing) */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Planes simples y claros</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Empieza con el plan gratuito de FaktuGo para probar cómo organiza tus facturas y
                tickets y, cuando lo necesites, pasa a un plan de pago que se ajuste a tu volumen
                real de documentos.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-[#2A5FFF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-[#224bcc]"
            >
              Ver planes de FaktuGo
            </Link>
          </div>
        </section>

        {/* Sección 8 — Confianza */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Confianza y claridad</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            FaktuGo está diseñado para la realidad de autónomos y empresas que
            gestionan decenas o cientos de facturas al mes. Nuestro objetivo es que pierdas menos
            tiempo con las facturas y puedas centrarte en tu negocio.
          </p>
        </section>

        {/* Sección 9 — CTA final */}
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-[#0B1220] p-6 text-center md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            La forma más inteligente, automática y segura de gestionar tus facturas.
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-300">
            Hacemos el trabajo que no quieres hacer con las facturas: escanear, organizar,
            clasificar y preparar todo para tu gestoría. Empieza gratis y, cuando quieras,
            activa sincronización, envíos y automatización.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="#demo"
              className="inline-flex items-center justify-center rounded-full bg-[#2A5FFF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#224bcc]"
            >
              Ver ejemplo de panel de facturas
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 hover:border-slate-300 hover:bg-slate-900/60"
            >
              Ver planes y precios
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

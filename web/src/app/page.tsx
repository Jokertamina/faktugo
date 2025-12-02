import Link from "next/link";
import { getInvoices } from "@/lib/invoices";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export default async function Home() {
  const invoices = await getInvoices();
  const topInvoices = invoices.slice(0, 3);
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
              <span>Local First · Móvil + Web · Privacidad</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Tus facturas, en piloto automático.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              FaktuGo es la app móvil y web que automatiza todo el proceso de gestionar facturas:
              escanear, clasificar, ordenar, sincronizar y enviar a gestoría. Tú solo haces una
              foto o subes un archivo; el resto se hace solo.
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
                <dd>Carpetas automáticas, OCR, Drive opcional y envíos programados a gestoría.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-50">Privacidad Local-First</dt>
                <dd>Tus facturas son tuyas. Todo funciona sin internet ni registro obligatorio.</dd>
              </div>
            </dl>
          </div>

          <div id="demo" className="flex-1">
            <div className="rounded-3xl border border-slate-800/80 bg-[#0B1220] p-6 shadow-2xl shadow-black/60">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-sm font-medium text-slate-100">Panel FaktuGo — demo</span>
                <span className="rounded-full bg-[#22CC88]/20 px-3 py-1 text-xs font-medium text-[#22CC88]">
                  Mes actual
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {topInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-50">{invoice.supplier}</p>
                      <p className="text-xs text-slate-400">
                        {invoice.date} · {invoice.category}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#22CC88]">{invoice.amount}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
                <span>Ejemplo de facturas del periodo actual</span>
                <span>Carpetas: /FaktuGo/YYYY-MM o YYYY-SWW</span>
              </div>
            </div>
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
                Drive, email y sincronización son opcionales. Puedes usar solo el modo local o
                activar la nube cuando la necesites.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Privado</h3>
              <p className="mt-2 text-sm text-slate-300">
                Local-First de verdad: los PDFs viven en tus dispositivos o en tu propio cloud.
                FaktuGo gestiona metadatos y automatizaciones.
              </p>
            </div>
          </div>
        </section>

        

        {/* Sección 4 — Funciones avanzadas */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Funciones avanzadas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">IA para categorías</h3>
              <p className="mt-2 text-sm text-slate-300">
                Aprende de tus proveedores habituales (REPSOL, MERCADONA, AMAZON…) para sugerir
                categorías automáticamente.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Estadísticas</h3>
              <p className="mt-2 text-sm text-slate-300">
                Visualiza gasto por mes, por categoría y por proveedor con gráficas simples y
                accionables.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Detección de duplicados</h3>
              <p className="mt-2 text-sm text-slate-300">
                Evita subir la misma factura dos veces con reglas por importe, proveedor y fecha o
                checksum del archivo.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Export ZIP</h3>
              <p className="mt-2 text-sm text-slate-300">
                Exporta un mes o una semana completa en un ZIP listo para enviar o archivar.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Panel web</h3>
              <p className="mt-2 text-sm text-slate-300">
                Revisa, filtra y edita tus facturas desde cualquier ordenador con un panel web
                pensado para negocio.
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
                Escanea tickets al momento y olvídate de cajas de zapatos llenas de papeles.
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
                Empieza con una demo Local-First y cuando veas que FaktuGo encaja en tu día a día,
                pasa a un plan de pago que se ajuste a tu volumen real de facturas.
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

        {/* Sección 8 — Prueba social (placeholder inicial) */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Confianza y claridad</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            FaktuGo está diseñado específicamente para la realidad de autónomos, pequeñas empresas
            y gestorías. A medida que avance el desarrollo se añadirán testimonios y casos reales
            de uso.
          </p>
        </section>

        {/* Sección 9 — CTA final */}
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-[#0B1220] p-6 text-center md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            La forma más inteligente, automática y segura de gestionar tus facturas.
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-300">
            Hacemos el trabajo que no quieres hacer. Automáticamente. Empieza con la demo Local
            First y decide después si quieres activar sincronización, Drive y envíos automáticos.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="#demo"
              className="inline-flex items-center justify-center rounded-full bg-[#2A5FFF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#224bcc]"
            >
              Probar demo ahora
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 hover:border-slate-300 hover:bg-slate-900/60"
            >
              Ver planes cuando estén disponibles
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

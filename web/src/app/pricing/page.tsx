import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-10 font-sans">
        <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Planes de FaktuGo
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              FaktuGo es un producto profesional orientado a negocio. Puedes probarlo con una demo
              Local First limitada y, cuando veas que encaja, pasar a uno de los planes de pago
              para desbloquear automatizaciones, sincronizacion y panel para gestorias.
            </p>
          </div>
        </header>

        {/* Banda de demo arriba, ancho completo */}
        <section className="mb-8">
          <article className="flex flex-col gap-3 rounded-3xl border border-slate-800/80 bg-[#0B1220] p-6 shadow-2xl shadow-black/60 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">Demo Local First</h2>
              <p className="mt-1 text-xs uppercase tracking-wide text-emerald-300">
                Demo limitada para probar el flujo de trabajo
              </p>
              <p className="mt-3 text-sm text-slate-300">
                Escanea algunas facturas, revisa como se organizan y decide despues que plan de pago
                se ajusta mejor a tu volumen real.
              </p>
            </div>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm text-slate-200 sm:mt-0 sm:items-end">
              <div className="flex items-baseline gap-1 text-2xl font-semibold">
                <span>0</span>
                <span className="text-xs font-normal text-slate-400">EUR durante la demo</span>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                Limite de tiempo o facturas a definir
              </span>
            </div>
          </article>
        </section>

        {/* Tres planes de pago abajo */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Plan Basico (pago) */}
          <article className="flex flex-col rounded-3xl border border-slate-800/80 bg-[#0B1220] p-6 shadow-2xl shadow-black/60">
            <h2 className="text-lg font-semibold text-slate-50">Plan Basico</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">
              Para volumen moderado de facturas
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Pensado para autonomos y pequenos negocios con un volumen de facturas controlado.
              Incluye todas las funciones Local First mas sincronizacion, envios automaticos y
              panel web completo, con limites de uso ajustados (facturas/mes, empresas y usuarios).
            </p>
            <div className="mt-4 flex items-baseline gap-1 text-3xl font-semibold">
              <span>Por definir</span>
            </div>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-200">
              <li>Todo lo de la demo Local First sin limites de tiempo</li>
              <li>Cuenta FaktuGo y sincronizacion multi dispositivo</li>
              <li>Hasta cierto numero de facturas al mes (a definir)</li>
              <li>1 usuario y 1 empresa incluidos (a definir)</li>
              <li>Integracion con Google Drive</li>
            </ul>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#2A5FFF] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/40 hover:bg-[#224bcc]"
              disabled
            >
              Proximamente
            </button>
          </article>

          {/* Plan Empresa (alto volumen, no gestorias) */}
          <article className="flex flex-col rounded-3xl border border-[#2A5FFF]/60 bg-[#0B1220] p-6 shadow-[0_0_40px_rgba(42,95,255,0.35)]">
            <div className="mb-2 inline-flex items-center rounded-full bg-[#2A5FFF]/20 px-3 py-1 text-xs font-medium text-[#AECBFF]">
              Recomendado
            </div>
            <h2 className="text-lg font-semibold text-slate-50">Plan Empresa</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">
              Para equipos y alto volumen de facturas
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Pensado para pymes con varios usuarios, varias empresas y muchos movimientos cada mes.
              Incluye limites mas amplios y opciones avanzadas de automatizacion.
            </p>
            <div className="mt-4 flex items-baseline gap-1 text-3xl font-semibold">
              <span>Por definir</span>
            </div>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-200">
              <li>Todo lo del plan Basico</li>
              <li>Mas usuarios y empresas incluidos (a definir)</li>
              <li>Limites de facturas/mes sensiblemente superiores</li>
              <li>Envios programados a gestoria y automatizaciones avanzadas</li>
              <li>Buscador avanzado y panel de estadisticas mas completo</li>
              <li>Soporte con mayor prioridad</li>
            </ul>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-300 hover:bg-white/10"
              disabled
            >
              Proximamente
            </button>
          </article>

          {/* Plan Gestorias (alto uso) */}
          <article className="flex flex-col rounded-3xl border border-slate-800/80 bg-[#0B1220] p-6 shadow-2xl shadow-black/60">
            <h2 className="text-lg font-semibold text-slate-50">Gestorias</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">
              Pensado para despachos con muchos clientes y alto volumen de documentos
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Panel multi cliente para recibir documentacion ordenada sin perseguir a nadie por
              correo.
            </p>
            <div className="mt-4 flex items-baseline gap-1 text-3xl font-semibold">
              <span>Por definir</span>
            </div>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-200">
              <li>Panel web con clientes y estados de documentacion</li>
              <li>Acceso seguro para cada gestor o gestora</li>
              <li>Historial de envios y comentarios por factura</li>
              <li>Integracion futura con sistemas contables</li>
            </ul>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-300 hover:bg-white/10"
              disabled
            >
              Hablar con nosotros
            </button>
          </article>
        </section>
      </main>
    </div>
  );
}

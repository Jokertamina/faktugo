export default function AppMobilePage() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            App móvil
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Lleva FaktuGo en el bolsillo.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            La app móvil de FaktuGo estará disponible para Android y iOS. Escanea tus facturas al
            momento y tenlo todo sincronizado con el panel web cuando actives la cuenta en la nube.
          </p>
        </header>

        <section className="space-y-4 rounded-3xl border border-slate-800 bg-[#0B1220] p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Estado actual
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Estamos terminando de pulir la app móvil antes de publicarla en las tiendas oficiales.
            Mientras tanto, puedes utilizar el panel web y la demo Local-First para organizar tus
            facturas desde el ordenador.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 shadow-sm shadow-black/40 cursor-not-allowed opacity-70"
            >
              Próximamente en Google Play
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 shadow-sm shadow-black/40 cursor-not-allowed opacity-70"
            >
              Próximamente en App Store
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Qué podrás hacer desde la app
          </h2>
          <ul className="grid gap-4 text-sm text-slate-200 md:grid-cols-3">
            <li className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Escanear al instante</h3>
              <p className="mt-2 text-sm text-slate-300">
                Haz una foto a cada ticket justo al pagar y olvídate de guardar papeles en el bolso
                o en la guantera.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Organizar sin pensar</h3>
              <p className="mt-2 text-sm text-slate-300">
                Cada factura se enviará a su carpeta del mes o la semana correspondiente siguiendo la
                misma lógica que en el panel web.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-800 bg-[#0B1220] p-4">
              <h3 className="text-sm font-semibold text-slate-50">Sincronizar con el panel</h3>
              <p className="mt-2 text-sm text-slate-300">
                Cuando actives la cuenta en la nube, verás las facturas escaneadas desde el móvil
                también en el panel web, listas para revisar o enviar a tu gestoría.
              </p>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getInvoices } from "@/lib/invoices";
import { getUserSubscription, getMonthlyInvoiceCount } from "@/lib/subscription";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function parseAmountToNumber(amount: string | null | undefined): number {
  if (!amount) return 0;
  const cleaned = amount.replace(/[^0-9,.-]/g, "");
  if (!cleaned) return 0;
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export default async function AnalyticsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const invoices = await getInvoices(supabase);

  const now = new Date();
  const startWindow = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  type MonthlyBucket = {
    key: string;
    label: string;
    total: number;
    count: number;
  };

  const monthlyMap = new Map<string, MonthlyBucket>();
  const categoryMap = new Map<string, { total: number; count: number }>();
  const supplierMap = new Map<string, { total: number; count: number }>();

  for (const inv of invoices) {
    const d = new Date(inv.date as any);
    if (Number.isNaN(d.getTime()) || d < startWindow) continue;

    const amountNumber = parseAmountToNumber(inv.amount as any);
    const ymKey = `${d.getFullYear()}-${d.getMonth()}`;
    const monthLabel = `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(-2)}`;

    const existingMonth = monthlyMap.get(ymKey) ?? {
      key: ymKey,
      label: monthLabel,
      total: 0,
      count: 0,
    };
    existingMonth.total += amountNumber;
    existingMonth.count += 1;
    monthlyMap.set(ymKey, existingMonth);

    const category = inv.category || "Sin categoría";
    const existingCat = categoryMap.get(category) ?? { total: 0, count: 0 };
    existingCat.total += amountNumber;
    existingCat.count += 1;
    categoryMap.set(category, existingCat);

    const supplier = inv.supplier || "Sin proveedor";
    const existingSup = supplierMap.get(supplier) ?? { total: 0, count: 0 };
    existingSup.total += amountNumber;
    existingSup.count += 1;
    supplierMap.set(supplier, existingSup);
  }

  const monthlyTotals = Array.from(monthlyMap.values()).sort((a, b) => (a.key < b.key ? -1 : 1));
  const maxMonthlyTotal = monthlyTotals.reduce((max, m) => (m.total > max ? m.total : max), 0) || 1;

  const categories = Array.from(categoryMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
  const maxCategoryTotal = categories.reduce((max, c) => (c.total > max ? c.total : max), 0) || 1;

  const suppliers = Array.from(supplierMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
  const maxSupplierTotal = suppliers.reduce((max, s) => (s.total > max ? s.total : max), 0) || 1;

  // Plan y uso del límite de facturas
  const subscription = await getUserSubscription(supabase as any, user.id);
  const invoicesThisMonth = await getMonthlyInvoiceCount(supabase as any, user.id);
  const planLimit = subscription.limits.invoicesPerMonth;
  const remaining = planLimit === Infinity ? Infinity : Math.max(planLimit - invoicesThisMonth, 0);
  const usagePercent = planLimit === Infinity || planLimit === 0
    ? 0
    : Math.min(100, (invoicesThisMonth / planLimit) * 100);

  // Estadísticas hacia gestoría (mes actual)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const sentThisMonth = invoices.filter((inv) => {
    if (!inv.sent_to_gestoria_at) return false;
    const d = new Date(inv.sent_to_gestoria_at as any);
    if (Number.isNaN(d.getTime())) return false;
    return d >= startOfMonth && d <= endOfMonth;
  }).length;

  const pendingToSend = invoices.filter((inv) => {
    if (inv.archival_only) return false;
    return inv.status === "Pendiente" && !inv.sent_to_gestoria_at;
  }).length;

  const totalLast12Months = monthlyTotals.reduce((sum, m) => sum + m.total, 0);

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-6 font-sans space-y-6 sm:px-6 sm:py-10 sm:space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">Analítica avanzada</h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Visor profesional con evolución de gasto, distribución por categorías, proveedores principales y uso de tu plan.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Datos calculados sobre los últimos 12 meses (según la fecha de la factura).
            </p>
          </div>
        </header>

        {invoices.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-[#020617] p-6 text-center">
            <p className="text-lg mb-2">
              Aún no hay suficientes datos para mostrar gráficas.
            </p>
            <p className="text-sm text-slate-400">
              Cuando subas algunas facturas empezaremos a construir tu panel de analítica automáticamente.
            </p>
          </section>
        ) : (
          <>
            {/* Resumen rápido */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#020617] p-5">
                <p className="text-xs text-slate-400 mb-1">Gasto total (12 meses)</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {totalLast12Months.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#020617] p-5">
                <p className="text-xs text-slate-400 mb-1">Facturas (12 meses)</p>
                <p className="text-2xl font-bold text-blue-400">{monthlyTotals.reduce((sum, m) => sum + m.count, 0)}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#020617] p-5">
                <p className="text-xs text-slate-400 mb-1">Enviadas a gestoría (mes actual)</p>
                <p className="text-2xl font-bold text-emerald-400">{sentThisMonth}</p>
                <p className="mt-1 text-[11px] text-slate-500">Basado en la fecha real de envío.</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#020617] p-5">
                <p className="text-xs text-slate-400 mb-1">Pendientes de enviar</p>
                <p className="text-2xl font-bold text-amber-400">{pendingToSend}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Facturas en estado "Pendiente" y no marcadas solo para archivo.
                </p>
              </div>
            </section>

            {/* Gráficas principales */}
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] mt-4">
              {/* Evolución mensual */}
              <div className="rounded-2xl border border-slate-800 bg-[#020617] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-50">Evolucin del gasto</h2>
                    <p className="text-xs text-slate-400">Importe total por mes (12 meses)</p>
                  </div>
                </div>
                <div className="h-56 flex items-end gap-2">
                  {monthlyTotals.map((m) => {
                    const height = (m.total / maxMonthlyTotal) * 100;
                    return (
                      <div key={m.key} className="flex-1 flex flex-col items-center gap-1 min-w-[16px]">
                        <div className="relative w-full h-40 rounded-full bg-slate-900 overflow-hidden flex items-end">
                          <div
                            className="w-full bg-gradient-to-t from-emerald-400 to-emerald-300"
                            style={{ height: `${height || 2}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">{m.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Uso del plan */}
              <div className="rounded-2xl border border-slate-800 bg-[#020617] p-5 space-y-3">
                <h2 className="text-sm font-semibold text-slate-50">Uso de tu plan</h2>
                <p className="text-xs text-slate-400">
                  Plan actual: <span className="font-semibold text-slate-100">{subscription.planConfig.displayName}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Facturas subidas este mes: {invoicesThisMonth}
                  {planLimit === Infinity ? " (sin límite)" : ` de ${planLimit}`}
                </p>
                {planLimit !== Infinity && (
                  <div className="mt-2">
                    <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {remaining === 0
                        ? "Has alcanzado el límite de tu plan para este mes."
                        : `Te quedan ${remaining} facturas este mes antes de llegar al límite.`}
                    </p>
                  </div>
                )}
                {planLimit === Infinity && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Tu plan actual no tiene límite de facturas mensuales.
                  </p>
                )}
              </div>
            </section>

            {/* Categorías y proveedores */}
            <section className="grid gap-4 lg:grid-cols-2 mt-4">
              {/* Categorías */}
              <div className="rounded-2xl border border-slate-800 bg-[#020617] p-5">
                <h2 className="text-sm font-semibold text-slate-50 mb-3">Distribución por categorías</h2>
                {categories.length === 0 ? (
                  <p className="text-sm text-slate-400">Aún no hay datos suficientes.</p>
                ) : (
                  <div className="space-y-3">
                    {categories.map((cat) => {
                      const width = (cat.total / maxCategoryTotal) * 100;
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span className="truncate max-w-[60%]" title={cat.name}>
                              {cat.name}
                            </span>
                            <span>
                              {cat.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400"
                              style={{ width: `${width || 4}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Proveedores */}
              <div className="rounded-2xl border border-slate-800 bg-[#020617] p-5">
                <h2 className="text-sm font-semibold text-slate-50 mb-3">Top proveedores</h2>
                {suppliers.length === 0 ? (
                  <p className="text-sm text-slate-400">Aún no hay datos suficientes.</p>
                ) : (
                  <div className="space-y-3">
                    {suppliers.map((sup) => {
                      const width = (sup.total / maxSupplierTotal) * 100;
                      return (
                        <div key={sup.name} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span className="truncate max-w-[60%]" title={sup.name}>
                              {sup.name}
                            </span>
                            <span>
                              {sup.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-fuchsia-400 to-purple-500"
                              style={{ width: `${width || 4}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

import Link from "next/link";
import { Fragment } from "react";
import { redirect } from "next/navigation";
import { getInvoices } from "@/lib/invoices";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type InvoicesPageProps = {
  searchParams: Promise<{
    estado?: string;
    sort?: string;
    view?: string;
    q?: string;
    category?: string;
    from?: string;
    to?: string;
  }>;
};

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

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const invoices = await getInvoices(supabase);

  const estadoFilter = resolvedSearchParams?.estado ?? "todos";
  const sort = resolvedSearchParams?.sort ?? "date_desc";
  const view = (resolvedSearchParams?.view === "week" ? "week" : "month") as
    | "month"
    | "week";
  const search = (resolvedSearchParams?.q ?? "").trim();
  const categoryFilter = resolvedSearchParams?.category ?? "";
  const fromDateStr = resolvedSearchParams?.from ?? "";
  const toDateStr = resolvedSearchParams?.to ?? "";

  const fromDate = fromDateStr ? new Date(fromDateStr) : null;
  const toDate = toDateStr ? new Date(toDateStr) : null;

  const categoryOptions = Array.from(new Set(invoices.map((inv) => inv.category))).sort(
    (a, b) => a.localeCompare(b, "es")
  );

  const buildHref = (
    overrides: Partial<{
      estado: string;
      sort: string;
      view: string;
      q: string;
      category: string;
      from: string;
      to: string;
    }>
  ) => {
    const params = new URLSearchParams();
    const current = {
      estado: estadoFilter,
      sort,
      view,
      q: search,
      category: categoryFilter,
      from: fromDateStr,
      to: toDateStr,
      ...overrides,
    };

    (Object.entries(current) as [string, string | undefined][]).forEach(([key, value]) => {
      if (value && value.length > 0) {
        params.set(key, value);
      }
    });

    const qs = params.toString();
    return qs ? `/invoices?${qs}` : "/invoices";
  };

  const filtered = invoices.filter((invoice) => {
    if (estadoFilter === "Enviada" || estadoFilter === "Pendiente") {
      if (invoice.status !== estadoFilter) return false;
    }

    if (search) {
      const query = search.toLowerCase();
      const supplier = (invoice.supplier ?? "").toLowerCase();
      const category = (invoice.category ?? "").toLowerCase();
      if (!supplier.includes(query) && !category.includes(query)) {
        return false;
      }
    }

    if (categoryFilter && invoice.category !== categoryFilter) {
      return false;
    }

    if (fromDate || toDate) {
      const d = new Date(invoice.date);
      if (Number.isNaN(d.getTime())) return false;
      if (fromDate && d < fromDate) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "date_asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    // date_desc por defecto
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const nextSort = sort === "date_desc" ? "date_asc" : "date_desc";

  const getOriginLabel = (uploadSource?: string | null): string => {
    if (uploadSource === "email_ingest") return "Email";
    if (uploadSource === "mobile_upload") return "Móvil";
    if (uploadSource === "web_upload") return "Web";
    return "Otro";
  };

  function getIsoWeek(date: Date): number {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  const sections = (() => {
    const groups: Record<
      string,
      {
        title: string;
        items: typeof sorted;
      }
    > = {};

    for (const inv of sorted) {
      const d = new Date(inv.date);
      if (Number.isNaN(d.getTime())) continue;

      let key = "";
      let title = "";

      if (view === "week") {
        const week = getIsoWeek(d);
        const year = d.getFullYear();
        key = `${year}-S${String(week).padStart(2, "0")}`;

        const jsDay = d.getDay(); // 0 (domingo) - 6 (sabado)
        const dayAsMondayFirst = jsDay === 0 ? 7 : jsDay; // 1 (lunes) - 7 (domingo)
        const diffToMonday = dayAsMondayFirst - 1;

        const start = new Date(d);
        start.setDate(d.getDate() - diffToMonday);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const startDay = start.getDate();
        const endDay = end.getDate();
        const sameMonth =
          start.getMonth() === end.getMonth() &&
          start.getFullYear() === end.getFullYear();

        if (sameMonth) {
          const monthName = MONTH_NAMES[start.getMonth()] ?? "";
          title = monthName
            ? `Semana del ${startDay}-${endDay} ${monthName} ${start.getFullYear()}`
            : `Semana del ${startDay}-${endDay} ${start.getFullYear()}`;
        } else {
          const startMonthName = MONTH_NAMES[start.getMonth()] ?? "";
          const endMonthName = MONTH_NAMES[end.getMonth()] ?? "";
          if (start.getFullYear() === end.getFullYear()) {
            title = `Semana del ${startDay} ${startMonthName}–${endDay} ${endMonthName} ${start.getFullYear()}`;
          } else {
            title = `Semana del ${startDay} ${startMonthName} ${start.getFullYear()}–${endDay} ${endMonthName} ${end.getFullYear()}`;
          }
        }
      } else {
        const year = d.getFullYear();
        const monthIndex = d.getMonth();
        const monthName = MONTH_NAMES[monthIndex] ?? "";
        const month = String(monthIndex + 1).padStart(2, "0");
        key = `${year}-${month}`;
        title = monthName ? `${monthName} ${year}` : `${year}-${month}`;
      }

      if (!groups[key]) {
        groups[key] = { title, items: [] } as any;
      }
      groups[key].items.push(inv);
    }

    return Object.entries(groups)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([, value]) => value);
  })();

  const totalCount = invoices.length;
  const filteredCount = filtered.length;

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-10 font-sans">
        <header className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/dashboard" className="hover:underline">
              Panel
            </Link>
            <span className="text-slate-600">/</span>
            <span>Facturas</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Facturas (demo)
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Vista de ejemplo basada en el documento tecnico de FaktuGo. Aqui veras tus facturas
                cuando conectemos el backend y la sincronizacion real.
              </p>
            </div>
            <Link
              href="/invoices/upload"
              className="inline-flex items-center justify-center rounded-full bg-[#22CC88] px-4 py-2 text-xs font-semibold text-slate-900 shadow-md shadow-emerald-500/30 hover:bg-[#18a96f]"
            >
              Subir facturas
            </Link>
          </div>
        </header>

        <form
          method="get"
          className="mb-4 grid gap-3 rounded-2xl border border-slate-800 bg-[#020617] p-4 text-xs text-slate-200 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]"
        >
          <div className="space-y-1">
            <label className="block text-slate-300" htmlFor="q">
              Buscar
            </label>
            <input
              id="q"
              name="q"
              placeholder="Proveedor o categoría"
              defaultValue={search}
              className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300" htmlFor="category">
              Categoría
            </label>
            <select
              id="category"
              name="category"
              defaultValue={categoryFilter}
              className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
            >
              <option value="">Todas las categorías</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300" htmlFor="from">
              Rango de fechas
            </label>
            <div className="flex items-center gap-2">
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={fromDateStr}
                className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
              />
              <span className="text-slate-500">–</span>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={toDateStr}
                className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
              />
            </div>
          </div>

          <input type="hidden" name="estado" value={estadoFilter} />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="view" value={view} />

          <div className="col-span-full flex justify-end gap-2 pt-1 text-[11px]">
            <Link
              href="/invoices"
              className="rounded-full border border-slate-700 px-3 py-1 text-slate-300 hover:border-slate-400 hover:bg-white/10"
            >
              Limpiar
            </Link>
            <button
              type="submit"
              className="rounded-full bg-[#2A5FFF] px-4 py-1.5 font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-[#224bcc]"
            >
              Aplicar filtros
            </button>
          </div>
        </form>

        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <span className="font-medium text-slate-400">Estado:</span>
          <div className="inline-flex rounded-full bg-white/5 p-1">
            {[{ label: "Todos", value: "todos" }, { label: "Enviadas", value: "Enviada" }, { label: "Pendientes", value: "Pendiente" }].map((option) => {
              const active = estadoFilter === option.value;
              return (
                <Link
                  key={option.value}
                  href={buildHref({ estado: option.value })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-[#22CC88]/20 text-[#22CC88]"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
          <span className="h-4 w-px bg-slate-700" />
          <span className="font-medium text-slate-400">Orden:</span>
          <Link
            href={buildHref({ sort: nextSort })}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-slate-300 hover:bg-white/10"
          >
            <span>Fecha</span>
            <span className="text-[10px] text-slate-500">
              {sort === "date_desc" ? "(desc)" : "(asc)"}
            </span>
          </Link>
          <span className="h-4 w-px bg-slate-700" />
          <span className="font-medium text-slate-400">Vista:</span>
          <div className="inline-flex rounded-full bg-white/5 p-1">
            {[{ label: "Por mes", value: "month" }, { label: "Por semana", value: "week" }].map((option) => {
              const active = view === option.value;
              return (
                <Link
                  key={option.value}
                  href={buildHref({ view: option.value })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-slate-100/10 text-slate-50"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mb-4 text-xs text-slate-400">
          Mostrando
          <span className="mx-1 font-semibold text-slate-100">{filteredCount}</span>
          facturas
          {filteredCount !== totalCount && (
            <>
              {" de "}
              <span className="mx-1 font-semibold text-slate-100">{totalCount}</span>
              en total
            </>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0B1220] shadow-2xl shadow-black/60">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Origen</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-transparent">
              {sections.map((section) => (
                <Fragment key={section.title}>
                  <tr className="bg-black/20">
                    <td
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300"
                      colSpan={6}
                    >
                      {section.title}
                    </td>
                  </tr>
                  {section.items.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 align-middle text-slate-200">{invoice.date}</td>
                      <td className="px-4 py-3 align-middle font-medium text-slate-50">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="hover:underline"
                        >
                          {invoice.supplier}
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-300">{invoice.category}</td>
                      <td className="px-4 py-3 align-middle">
                        {(() => {
                          const originLabel = getOriginLabel(invoice.upload_source ?? null);
                          const baseClasses =
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium";
                          const colorClasses =
                            originLabel === "Email"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                              : originLabel === "Móvil"
                              ? "bg-sky-500/10 text-sky-300 border border-sky-500/30"
                              : originLabel === "Web"
                              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                              : "bg-slate-800/60 text-slate-200 border border-slate-700";
                          return (
                            <span className={`${baseClasses} ${colorClasses}`}>
                              {originLabel}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 align-middle text-right font-semibold text-[#22CC88]">
                        {invoice.amount}
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-300">
                        {invoice.archival_only ? "Solo almacenada" : invoice.status}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

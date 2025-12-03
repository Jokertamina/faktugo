import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getInvoices } from "@/lib/invoices";
import ProfileForm, { type ProfileData } from "./ProfileForm";
import EmailAliasCard from "./EmailAliasCard";
import SubscriptionCard from "./SubscriptionCard";
import SupportButton from "./SupportButton";
import AccountSettings from "./AccountSettings";

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

function parseAmountToNumber(amount: string): number {
	if (!amount) return 0;
	const cleaned = amount.replace(/[^0-9,.-]/g, "");
	if (!cleaned) return 0;
	const normalized = cleaned.replace(/\./g, "").replace(",", ".");
	const n = Number(normalized);
	return Number.isFinite(n) ? n : 0;
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const invoices = await getInvoices(supabase);
  const lastInvoices = invoices.slice(0, 5);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIndex];

  const monthInvoices = invoices.filter((inv) => {
    const d = new Date(inv.date);
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === currentYear && d.getMonth() === currentMonthIndex;
  });

  const monthTotal = monthInvoices.reduce(
    (sum, inv) => sum + parseAmountToNumber(inv.amount),
    0
  );
  const monthCount = monthInvoices.length;

  const totalsByCategory = monthInvoices.reduce((acc, inv) => {
    const value = parseAmountToNumber(inv.amount);
    acc[inv.category] = (acc[inv.category] ?? 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const topCategoryEntry = Object.entries(totalsByCategory).sort(
    ([, a], [, b]) => b - a
  )[0];
  const topCategoryName = topCategoryEntry ? topCategoryEntry[0] : "Sin datos";
  const topCategoryAmount = topCategoryEntry ? topCategoryEntry[1] : 0;

  // Estadísticas adicionales
  const pendingCount = invoices.filter((inv) => inv.status === "Pendiente").length;
  const sentCount = invoices.filter((inv) => inv.status === "Enviada").length;
  const archivedCount = invoices.filter((inv) => inv.status === "Archivada" || inv.archival_only).length;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,first_name,last_name,type,company_name,country,gestoria_email")
    .eq("id", user.id)
    .maybeSingle<ProfileData>();

  // Verificar si tiene suscripción activa
  const { data: activeSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const hasActiveSubscription = !!activeSubscription;

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-6 font-sans space-y-6 sm:px-6 sm:py-10 sm:space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">
              Panel
            </h1>
            <p className="mt-1 hidden text-sm text-slate-300 sm:block">
              Resumen rápido de tu cuenta y facturas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/invoices/upload"
              className="rounded-full bg-[#22CC88] px-4 py-2 text-xs font-semibold text-slate-900 shadow-md shadow-emerald-500/30 hover:bg-[#18a96f]"
            >
              + Subir facturas
            </Link>
            <div className="hidden rounded-2xl border border-slate-800 bg-[#020617] px-4 py-3 text-xs text-slate-200 sm:block">
              <p className="font-semibold">Sesión iniciada</p>
              <p className="mt-1 text-slate-300 truncate max-w-[180px]">
                {user.user_metadata?.full_name || user.email}
              </p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#0B1220] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <span className="text-lg">💰</span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Gasto del mes</p>
                <p className="text-xl font-bold text-emerald-400">
                  {monthTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">{currentMonthName} {currentYear}</p>
            <p className="mt-2 text-[11px] text-slate-500">
              Incluye todas las facturas subidas en el mes actual, estén pendientes, enviadas o archivadas.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#0B1220] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <span className="text-lg">📄</span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Facturas del mes</p>
                <p className="text-xl font-bold text-blue-400">{monthCount}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Total: {invoices.length} facturas</p>
            <p className="mt-2 text-[11px] text-slate-500">
              Útil para saber cuánta documentación has generado antes de enviar el paquete del trimestre.
            </p>
          </div>

          <Link
            href="/invoices?estado=Pendiente"
            className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#0B1220] p-5 transition hover:border-amber-500/30 hover:bg-[#0F172A]"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <span className="text-lg">⏳</span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Pendientes</p>
                <p className="text-xl font-bold text-amber-400">{pendingCount}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Pendiente = aún no enviada a gestoría ni archivada.</p>
          </Link>

          <Link
            href="/invoices"
            className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] to-[#0B1220] p-5 transition hover:border-purple-500/30 hover:bg-[#0F172A]"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <span className="text-lg">🏷️</span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Top categoría</p>
                <p className="text-lg font-bold text-purple-400 truncate max-w-[140px]" title={topCategoryName}>
                  {topCategoryName.split(" - ")[0]}
                </p>
              </div>
            </div>
            {topCategoryEntry ? (
              <>
                <p className="text-xs text-slate-500">
                  {topCategoryAmount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })} →
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Basado en las categorías asignadas por ti o por la IA este mes.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500">Ver facturas →</p>
            )}
          </Link>
        </div>

        <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0B1220] p-4 sm:p-5 shadow-2xl shadow-black/60">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-50">Últimas facturas</h2>
                <Link
                  href="/invoices"
                  className="text-xs text-slate-300 hover:text-slate-100 hover:underline"
                >
                  Ver todas
                </Link>
              </div>
              <div className="space-y-2 text-sm">
                {lastInvoices.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <span className="text-3xl mb-3">📭</span>
                    <p className="text-slate-400 text-sm">
                      Aún no hay facturas. ¡Sube tu primera factura!
                    </p>
                  </div>
                )}
                {lastInvoices.map((inv) => {
                  const statusInfo = inv.status === "Enviada"
                    ? { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: "✓" }
                    : inv.status === "Archivada" || inv.archival_only
                    ? { color: "text-purple-400", bg: "bg-purple-500/10", icon: "📦" }
                    : { color: "text-amber-400", bg: "bg-amber-500/10", icon: "⏳" };

                  return (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${statusInfo.bg}`}>
                        <span className="text-sm">{statusInfo.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-50 truncate">{inv.supplier}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {inv.date} · {inv.category?.split(" - ")[0] || "Sin categoría"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#22CC88]">{inv.amount}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0B1220] p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-50">Tu cuenta</h2>
              <p className="mt-2 hidden text-xs text-slate-300 sm:block">
                Tus datos se usan en emails, envíos a gestoría y facturas emitidas desde FaktuGo.
              </p>
              <div className="mt-3">
                <ProfileForm
                  userId={user.id}
                  email={user.email ?? ""}
                  profile={profile ?? null}
                />
              </div>
            </div>
            <EmailAliasCard />

            <SubscriptionCard />

            <div className="flex justify-center">
              <SupportButton />
            </div>

            <AccountSettings hasActiveSubscription={hasActiveSubscription} />
          </div>
        </section>
      </main>
    </div>
  );
}

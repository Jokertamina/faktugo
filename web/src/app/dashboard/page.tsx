import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getInvoices } from "@/lib/invoices";
import ProfileForm, { type ProfileData } from "./ProfileForm";
import EmailAliasCard from "./EmailAliasCard";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,first_name,last_name,type,company_name,country,gestoria_email")
    .eq("id", user.id)
    .maybeSingle<ProfileData>();

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-10 font-sans space-y-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Panel de FaktuGo
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Resumen rapido de tu cuenta, ultimas facturas y accesos a las funciones clave.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/invoices/upload"
              className="hidden rounded-full bg-[#22CC88] px-4 py-2 text-xs font-semibold text-slate-900 shadow-md shadow-emerald-500/30 hover:bg-[#18a96f] sm:inline-flex"
            >
              Subir facturas
            </Link>
            <div className="rounded-2xl border border-slate-800 bg-[#020617] px-4 py-3 text-xs text-slate-200">
              <p className="font-semibold">Sesión iniciada</p>
              <p className="mt-1 text-slate-300">
                {user.user_metadata?.full_name || user.email}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-4 text-xs sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-[#0B1220] px-4 py-3">
            <p className="text-[11px] text-slate-400">Gasto mes actual</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">
              {monthTotal.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {currentMonthName} {currentYear}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#0B1220] px-4 py-3">
            <p className="text-[11px] text-slate-400">Facturas este mes</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">{monthCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Contando las facturas con fecha en el mes actual.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#0B1220] px-4 py-3">
            <p className="text-[11px] text-slate-400">Top categoría del mes</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">{topCategoryName}</p>
            {topCategoryEntry ? (
              <p className="mt-1 text-[11px] text-slate-500">
                ≈
                {topCategoryAmount.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">Sin datos suficientes.</p>
            )}
          </div>
        </div>

        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-[#0B1220] p-5 shadow-2xl shadow-black/60">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-50">Ultimas facturas</h2>
                <Link
                  href="/invoices"
                  className="text-xs text-slate-300 hover:text-slate-100 hover:underline"
                >
                  Ver todas
                </Link>
              </div>
              <div className="space-y-2 text-sm">
                {lastInvoices.length === 0 && (
                  <p className="text-slate-400 text-sm">
                    Aun no hay facturas sincronizadas. Cuando conectemos el backend real veras aqui tus
                    ultimos movimientos.
                  </p>
                )}
                {lastInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-50">{inv.supplier}</p>
                      <p className="text-xs text-slate-400">
                        {inv.date} · {inv.category}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#22CC88]">{inv.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-[#0B1220] p-5">
              <h2 className="text-sm font-semibold text-slate-50">Tu cuenta</h2>
              <p className="mt-2 text-xs text-slate-300">
                Datos basicos de tu perfil en FaktuGo. Esta capa sirve como base de CRM (tipo de
                cliente, nombre comercial, pais) sin almacenar informacion sensible de pagos.
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

            <div className="rounded-3xl border border-slate-800 bg-[#020617] p-5">
              <h2 className="text-sm font-semibold text-slate-50">Siguiente paso</h2>
              <p className="mt-2 text-xs text-slate-300">
                Pronto añadiremos aqui enlaces a integraciones con Stripe para facturacion, panel de
                gestorias y configuracion avanzada de automatizaciones.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

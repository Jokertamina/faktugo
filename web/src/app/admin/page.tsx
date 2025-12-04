import { getSupabaseServerClient } from "@/lib/supabaseServer";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await getSupabaseServerClient();

  // Estadísticas de usuarios
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  // Estadísticas de suscripciones activas
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("plan_name, is_manual, current_period_end, status")
    .in("status", ["active", "trialing"]);

  const now = new Date();
  const activeSubscriptions = (subscriptions || []).filter((sub: any) => {
    if (sub.is_manual && sub.current_period_end) {
      const end = new Date(sub.current_period_end as any);
      if (Number.isNaN(end.getTime())) return false;
      return end >= now;
    }
    return true;
  });

  const subsByPlan = activeSubscriptions.reduce((acc: Record<string, number>, sub: any) => {
    const plan = sub.plan_name || "free";
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const manualSubsCount = activeSubscriptions.filter((sub: any) => sub.is_manual).length;

  // Tickets pendientes
  const { count: pendingTickets } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // Facturas del mes
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const { count: monthlyInvoices } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  // Usuarios nuevos este mes
  const { count: newUsersMonth } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Panel de Administración</h1>
        <p className="mt-1 text-sm text-slate-400">
          Resumen general de FaktuGo
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Usuarios totales"
          value={totalUsers || 0}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Suscripciones activas"
          value={activeSubscriptions.length}
          subtitle={`Básico: ${subsByPlan["basico"] || 0} · Pro: ${subsByPlan["pro"] || 0} · Manuales: ${manualSubsCount}`}
          icon="💳"
          color="emerald"
        />
        <StatCard
          title="Tickets pendientes"
          value={pendingTickets || 0}
          icon="📩"
          color={pendingTickets && pendingTickets > 0 ? "amber" : "slate"}
          href="/admin/tickets"
        />
        <StatCard
          title="Facturas este mes"
          value={monthlyInvoices || 0}
          subtitle={`Usuarios nuevos: ${newUsersMonth || 0}`}
          icon="📄"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          title="Gestionar Usuarios"
          description="Asigna planes manualmente a usuarios"
          href="/admin/users"
          icon="👥"
        />
        <QuickAction
          title="Gestionar Planes"
          description="Edita límites, precios y características de los planes"
          href="/admin/plans"
          icon="⚙️"
        />
        <QuickAction
          title="Ver Tickets"
          description="Responde a las solicitudes de soporte de usuarios Pro"
          href="/admin/tickets"
          icon="💬"
          badge={pendingTickets && pendingTickets > 0 ? `${pendingTickets} nuevos` : undefined}
        />
        <QuickAction
          title="Volver a FaktuGo"
          description="Accede a tu cuenta normal de FaktuGo"
          href="/dashboard"
          icon="↩️"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  href,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: string;
  color: "blue" | "emerald" | "amber" | "purple" | "slate";
  href?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    purple: "bg-purple-500/10 text-purple-400",
    slate: "bg-slate-500/10 text-slate-400",
  };

  const content = (
    <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          <span className="text-lg">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-400">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color].split(" ")[1]}`}>
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:scale-[1.02]">
        {content}
      </Link>
    );
  }

  return content;
}

function QuickAction({
  title,
  description,
  href,
  icon,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block rounded-xl border border-slate-800 bg-[#0B1220] p-4 transition hover:border-slate-700 hover:bg-[#0F172A]"
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-slate-900">
          {badge}
        </span>
      )}
      <div className="mb-2 text-2xl">{icon}</div>
      <h3 className="font-medium text-slate-50 group-hover:text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </Link>
  );
}

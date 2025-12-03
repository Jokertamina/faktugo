import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import ProfileForm, { type ProfileData } from "../ProfileForm";
import AccountSettings from "../AccountSettings";

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,first_name,last_name,type,company_name,country,gestoria_email")
    .eq("id", user.id)
    .maybeSingle<ProfileData>();

  const { data: activeSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const hasActiveSubscription = !!activeSubscription;

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-6 font-sans space-y-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">Tu cuenta</h1>
            <p className="mt-1 text-sm text-slate-300">
              Datos personales, email de gestoría, exportación de facturas y eliminación de cuenta.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Volver al panel
          </Link>
        </header>

        <section className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0B1220] p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-50">Datos de tu cuenta</h2>
            <p className="mt-2 text-xs text-slate-300">
              Estos datos se usan en emails, envíos a gestoría y facturas emitidas desde FaktuGo.
            </p>
            <div className="mt-3">
              <ProfileForm
                userId={user.id}
                email={user.email ?? ""}
                profile={profile ?? null}
              />
            </div>
          </div>

          <AccountSettings hasActiveSubscription={hasActiveSubscription} />
        </section>
      </main>
    </div>
  );
}

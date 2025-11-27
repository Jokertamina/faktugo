import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import UploadInvoicesPanel from "../UploadInvoicesPanel";

export default async function UploadInvoicesPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-10 font-sans">
        <header className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/dashboard" className="hover:underline">
              Panel
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/invoices" className="hover:underline">
              Facturas
            </Link>
            <span className="text-slate-600">/</span>
            <span>Subir facturas</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Subir facturas
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Sube PDFs o imagenes de tus facturas para organizarlas por periodos y compartirlas con tu
              asesoria.
            </p>
          </div>
        </header>

        <UploadInvoicesPanel />
      </main>
    </div>
  );
}

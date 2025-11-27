import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import SendToGestoriaButton from "./SendToGestoriaButton";

type InvoiceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const invoice = await getInvoiceById(id, supabase);

  if (!invoice) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gestoria_email")
    .eq("id", user.id)
    .maybeSingle<{ gestoria_email: string | null }>();

  const hasGestoriaEmail = !!profile?.gestoria_email;

  let fileUrl: string | null = null;
  if (invoice.file_path) {
    const { data, error } = await supabase.storage
      .from("invoices")
      .createSignedUrl(invoice.file_path, 60 * 60);
    if (!error && data?.signedUrl) {
      fileUrl = data.signedUrl;
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-10 font-sans">
        <div className="mb-6 flex items-center justify-between text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hover:underline">
              Panel
            </Link>
            <span className="text-slate-500">/</span>
            <Link href="/invoices" className="hover:underline">
              Facturas
            </Link>
            <span className="text-slate-500">/</span>
            <span>{invoice.id}</span>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-800/80 bg-[#0B1220] p-6 shadow-2xl shadow-black/60">
          <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Proveedor</p>
              <h1 className="text-xl font-semibold text-slate-50">{invoice.supplier}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400">Importe</p>
              <p className="text-lg font-semibold text-[#22CC88]">{invoice.amount}</p>
            </div>
          </header>

          <dl className="grid grid-cols-1 gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Fecha</dt>
              <dd className="mt-1 text-slate-100">{invoice.date}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Categoria</dt>
              <dd className="mt-1 text-slate-100">{invoice.category}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Estado</dt>
              <dd className="mt-1 text-slate-100">{invoice.status}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Identificador</dt>
              <dd className="mt-1 text-slate-100">{invoice.id}</dd>
            </div>
          </dl>

          <SendToGestoriaButton
            invoiceId={invoice.id}
            hasGestoriaEmail={hasGestoriaEmail}
            initialStatus={invoice.sent_to_gestoria_status ?? null}
          />

          {fileUrl && (
            <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Documento adjunto
                </p>
                <p className="mt-1 text-xs text-slate-200">
                  {invoice.file_name_original || "Factura subida desde web/movil"}
                </p>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-white"
              >
                Ver documento
              </a>
            </div>
          )}

          <p className="mt-6 text-xs text-slate-500">
            Aqui puedes consultar los metadatos de la factura y acceder al documento original. En el
            futuro añadiremos notas internas y estados de gestoria.
          </p>
        </section>
      </main>
    </div>
  );
}

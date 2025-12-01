import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import SendToGestoriaButton from "./SendToGestoriaButton";
import DeleteInvoiceButton from "./DeleteInvoiceButton";
import EditInvoiceForm from "./EditInvoiceForm";

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

  const usoLabel = invoice.archival_only
    ? "Solo almacenada (ya enviada por otro canal)"
    : "Factura para gestionar con tu gestoria";

  let envioGestoriaLabel = "No enviada a la gestoria";
  if (invoice.sent_to_gestoria_status === "sent") {
    if (invoice.sent_to_gestoria_at) {
      const sentDate = new Date(invoice.sent_to_gestoria_at);
      const formatted = sentDate.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      });
      envioGestoriaLabel = `Enviada a la gestoria el ${formatted}`;
    } else {
      envioGestoriaLabel = "Enviada a la gestoria";
    }
  } else if (invoice.sent_to_gestoria_status === "failed") {
    envioGestoriaLabel = "Envio a la gestoria fallido";
  } else if (invoice.sent_to_gestoria_status === "pending") {
    envioGestoriaLabel = "Envio a la gestoria pendiente";
  }

  // Status info
  const statusInfo = invoice.status === "Enviada"
    ? { label: "Enviada", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "✓" }
    : invoice.status === "Archivada" || invoice.archival_only
    ? { label: "Archivada", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "📦" }
    : { label: "Pendiente", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "⏳" };

  // Origin info
  const originLabel = invoice.upload_source === "email_ingest" ? "Email"
    : invoice.upload_source === "mobile_upload" ? "Móvil"
    : invoice.upload_source === "web_upload" ? "Web"
    : "Desconocido";

  // Parse category and concept
  const categoryParts = (invoice.category || "").split(" - ");
  const categoryName = categoryParts[0] || "Sin categoría";
  const conceptName = categoryParts.length > 1 ? categoryParts.slice(1).join(" - ") : null;

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-6 font-sans sm:px-6 sm:py-10">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400 sm:mb-6">
          <Link href="/invoices" className="hover:text-white transition">
            ← Volver
          </Link>
        </div>

        {/* Main Card */}
        <section className="rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0F172A] to-[#0B1220] p-4 sm:p-6 shadow-2xl shadow-black/60">
          {/* Status Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
              <span>{statusInfo.icon}</span>
              {statusInfo.label}
            </span>
          </div>

          {/* Header */}
          <header className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-50">{invoice.supplier}</h1>
            <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-[#22CC88]">{invoice.amount}</p>
          </header>

          {/* Details Grid */}
          <div className="grid gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-800 bg-black/20 p-3 sm:p-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <span className="text-lg">📅</span>
              <div>
                <p className="text-xs text-slate-400">Fecha</p>
                <p className="text-sm text-slate-100">{invoice.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">🏷️</span>
              <div>
                <p className="text-xs text-slate-400">Categoría</p>
                <p className="text-sm text-slate-100">{categoryName}</p>
              </div>
            </div>
            {conceptName && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <span className="text-lg">📝</span>
                <div>
                  <p className="text-xs text-slate-400">Concepto</p>
                  <p className="text-sm text-slate-100">{conceptName}</p>
                </div>
              </div>
            )}
            {invoice.invoice_number && (
              <div className="flex items-center gap-3">
                <span className="text-lg">🔢</span>
                <div>
                  <p className="text-xs text-slate-400">Nº Factura</p>
                  <p className="text-sm text-slate-100">{invoice.invoice_number}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-lg">📤</span>
              <div>
                <p className="text-xs text-slate-400">Origen</p>
                <p className="text-sm text-slate-100">{originLabel}</p>
              </div>
            </div>
          </div>

          {/* Edit Section */}
          <div className="mt-3 sm:mt-4">
            <EditInvoiceForm
              invoice={{
                id: invoice.id,
                date: invoice.date,
                supplier: invoice.supplier,
                category: invoice.category ?? "",
                amount: invoice.amount,
              }}
            />
          </div>

          {/* Gestoria Section */}
          <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border border-slate-800 bg-black/20 p-3 sm:p-4">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <span className="text-lg">🏢</span>
              <h3 className="text-sm font-semibold text-slate-100">Gestoría</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-3">{envioGestoriaLabel}</p>
            <SendToGestoriaButton
              invoiceId={invoice.id}
              hasGestoriaEmail={hasGestoriaEmail}
              initialStatus={invoice.sent_to_gestoria_status ?? null}
            />
          </div>

          {/* Document Preview */}
          {fileUrl && (
            <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border border-slate-800 bg-black/20 p-3 sm:p-4">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <span className="text-lg">📄</span>
                <h3 className="text-sm font-semibold text-slate-100">Documento</h3>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400 truncate">
                  {invoice.file_name_original || "Factura adjunta"}
                </p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2A5FFF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#224bcc] transition"
                >
                  <span>👁️</span>
                  Ver documento
                </a>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border border-red-900/30 bg-red-950/20 p-3 sm:p-4">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <span className="text-lg">⚠️</span>
              <h3 className="text-sm font-semibold text-red-400">Zona de peligro</h3>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Eliminar esta factura borrará permanentemente el registro y el documento asociado.
            </p>
            <DeleteInvoiceButton invoiceId={invoice.id} />
          </div>
        </section>
      </main>
    </div>
  );
}

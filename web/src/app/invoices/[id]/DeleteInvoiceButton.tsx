"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  invoiceId: string;
}

export default function DeleteInvoiceButton({ invoiceId }: Props) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?id=${invoiceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "No se pudo eliminar la factura.");
        return;
      }

      router.push("/invoices");
      router.refresh();
    } catch (e: any) {
      alert("No se pudo eliminar la factura.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-[11px] text-red-400">¿Estás seguro? Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full bg-red-500 px-4 py-1.5 text-[11px] font-semibold text-white shadow-md hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </button>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-4 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-600 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      className="mt-4 inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/20"
    >
      Eliminar factura
    </button>
  );
}

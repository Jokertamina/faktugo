"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  invoice: {
    id: string;
    date: string;
    supplier: string;
    category: string;
    amount: string;
  };
}

export default function EditInvoiceForm({ invoice }: Props) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const [date, setDate] = useState(invoice.date);
  const [supplier, setSupplier] = useState(invoice.supplier);
  const [category, setCategory] = useState(invoice.category);
  const [amount, setAmount] = useState(invoice.amount);

  async function handleSave() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: invoice.id,
          date,
          supplier,
          category,
          amount,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data?.error ?? "No se pudo guardar los cambios.");
        return;
      }

      setMessage("Cambios guardados.");
      setEditing(false);
      router.refresh();
    } catch (e: any) {
      setMessage("No se pudo guardar los cambios.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setDate(invoice.date);
    setSupplier(invoice.supplier);
    setCategory(invoice.category);
    setAmount(invoice.amount);
    setEditing(false);
    setMessage(null);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-4 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
      >
        ✏️ Editar datos
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Proveedor</label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Categoría</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Importe</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-full bg-[#22CC88] px-4 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-[#18a96f] disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-4 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-600 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>

      {message && (
        <p className={`text-[11px] ${message.includes("guardados") ? "text-emerald-400" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

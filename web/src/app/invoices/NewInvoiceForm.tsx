"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function NewInvoiceForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"Enviada" | "Pendiente">("Enviada");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!date || !supplier || !amount) {
      setError("Fecha, proveedor e importe son obligatorios.");
      return;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          supplier,
          category: category || null,
          amount,
          status,
        }),
      });

      if (!res.ok) {
        let message = "No se pudo crear la factura.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignorar error de parseo
        }
        throw new Error(message);
      }

      setSuccess("Factura creada correctamente.");
      setSupplier("");
      setCategory("");
      setAmount("");

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear la factura.";
      setError(message);
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-slate-800 bg-[#020617] p-4 text-xs text-slate-200">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">Nueva factura</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Crea una factura rapida para probar el flujo end-to-end con Supabase.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)]"
      >
        <div className="space-y-1">
          <label htmlFor="new-date" className="block text-[11px] text-slate-300">
            Fecha
          </label>
          <input
            id="new-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="new-supplier" className="block text-[11px] text-slate-300">
            Proveedor
          </label>
          <input
            id="new-supplier"
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="REPSOL, MERCADONA..."
            className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="new-category" className="block text-[11px] text-slate-300">
            Categoria (opcional)
          </label>
          <input
            id="new-category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Gasolina, Dietas..."
            className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="new-amount" className="block text-[11px] text-slate-300">
            Importe
          </label>
          <input
            id="new-amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="45.60 EUR"
            className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="new-status" className="block text-[11px] text-slate-300">
            Estado
          </label>
          <select
            id="new-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "Enviada" | "Pendiente")}
            className="w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
          >
            <option value="Enviada">Enviada</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>

        <div className="flex flex-col justify-end gap-1 sm:items-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full bg-[#22CC88] px-4 py-2 text-[11px] font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-[#18a96f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Guardar factura"}
          </button>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          {success && !error && (
            <p className="text-[11px] text-emerald-400">{success}</p>
          )}
        </div>
      </form>
    </section>
  );
}

"use client";

import { useState } from "react";

interface Props {
  invoiceId: string;
  hasGestoriaEmail: boolean;
  initialStatus: "pending" | "sent" | "failed" | null;
}

export default function SendToGestoriaButton({ invoiceId, hasGestoriaEmail, initialStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "failed">(initialStatus ?? "idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/gestoria/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("failed");
        setMessage(data?.error ?? "No se pudo enviar la factura a la gestoria.");
        return;
      }

      setStatus("sent");
      setMessage("Factura enviada a la gestoria.");
    } catch (e: any) {
      setStatus("failed");
      setMessage("No se pudo enviar la factura a la gestoria.");
    } finally {
      setLoading(false);
    }
  }

  if (!hasGestoriaEmail) {
    return (
      <p className="mt-4 text-[11px] text-amber-300/90">
        Configura primero el email de tu gestoria en el panel para poder enviarle esta factura.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2 text-[11px]">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-full bg-[#22CC88] px-4 py-1.5 text-[11px] font-semibold text-slate-900 shadow-md shadow-emerald-500/30 hover:bg-[#18a96f] disabled:opacity-60"
      >
        {loading ? "Enviando..." : status === "sent" ? "Reenviar a gestoria" : "Enviar a gestoria"}
      </button>
      {message && <p className={status === "failed" ? "text-red-400" : "text-emerald-400"}>{message}</p>}
    </div>
  );
}

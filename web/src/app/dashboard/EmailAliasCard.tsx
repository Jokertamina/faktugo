'use client';

import { useEffect, useState } from "react";

interface EmailAliasResponse {
  alias: string;
  autoSendToGestoria: boolean;
  hasGestoriaEmail: boolean;
  gestoriaEmail: string | null;
}

export default function EmailAliasCard() {
  const [loading, setLoading] = useState(true);
  const [alias, setAlias] = useState<string>("");
  const [autoSend, setAutoSend] = useState<boolean>(false);
  const [hasGestoriaEmail, setHasGestoriaEmail] = useState<boolean>(false);
  const [gestoriaEmail, setGestoriaEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copyLabel, setCopyLabel] = useState<string>("Copiar");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/email-alias", { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "No se pudo cargar la configuracion de correo interno.");
        }
        const data = (await res.json()) as EmailAliasResponse;
        if (cancelled) return;
        setAlias(data.alias);
        setAutoSend(data.autoSendToGestoria);
        setHasGestoriaEmail(data.hasGestoriaEmail);
        setGestoriaEmail(data.gestoriaEmail ?? null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "No se pudo cargar la configuracion de correo interno.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggleChange(next: boolean) {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      setAutoSend(next);

      const res = await fetch("/api/email-alias", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ autoSendToGestoria: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar la configuracion.");
      }

      setMessage("Configuracion guardada.");
    } catch (e: any) {
      setError(e?.message ?? "No se pudo guardar la configuracion.");
      // Revertimos el cambio local si la peticion falla
      setAutoSend((prev) => !prev);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!alias) return;
    try {
      await navigator.clipboard.writeText(alias);
      setCopyLabel("Copiado");
      setTimeout(() => setCopyLabel("Copiar"), 1500);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  }

  function handleSendInstructions() {
    if (!gestoriaEmail) {
      setError("Configura primero el email de tu gestoria en la seccion 'Tu cuenta'.");
      return;
    }
    if (!alias) {
      setError("Todavia no se ha generado tu direccion interna.");
      return;
    }

    const subject = "Nueva direccion para enviarme facturas (FaktuGo)";
    const body = `Hola,%0D%0A%0D%0AA partir de ahora, para que mis facturas se guarden automaticamente en mi sistema FaktuGo, por favor enviadlas a esta direccion:%0D%0A%0D%0A${encodeURIComponent(
      alias
    )}%0D%0A%0D%0APodeis usarla como destinatario principal o en CC/BCC, lo que os resulte mas comodo.%0D%0A%0D%0AGracias.`;

    const mailto = `mailto:${encodeURIComponent(gestoriaEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${body}`;
    window.location.href = mailto;
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#020617] p-5">
      <h2 className="text-sm font-semibold text-slate-50">Correo interno FaktuGo</h2>
      <p className="mt-2 text-xs text-slate-300">
        Direccion especial para que tus facturas entren solas en FaktuGo desde tu correo. Puedes
        compartirla con tu gestoria o proveedores.
      </p>

      <div className="mt-3 space-y-2 text-xs text-slate-300">
        <div>
          <p className="text-[11px] text-slate-400">Tu direccion interna</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-[11px] text-slate-50 overflow-hidden text-ellipsis">
              {loading ? "Generando..." : alias || "No disponible"}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !alias}
              className="rounded-full bg-[#111827] px-3 py-1 text-[11px] font-semibold text-slate-50 hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copyLabel}
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2">
          <input
            id="autoSendToGestoria"
            type="checkbox"
            checked={autoSend}
            disabled={saving || loading}
            onChange={(e) => handleToggleChange(e.target.checked)}
            className="mt-0.5 h-3 w-3 rounded border-slate-700 bg-[#020617] text-[#2A5FFF]"
          />
          <label htmlFor="autoSendToGestoria" className="text-[11px] text-slate-300">
            Enviar automaticamente a mi gestoria todo lo que llegue por este correo.
            <span className="block text-[11px] text-slate-500">
              Si lo activas, cada factura que entre por esta direccion se enviara a tu gestoria usando
              FaktuGo.
            </span>
          </label>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleSendInstructions}
            disabled={!hasGestoriaEmail || loading}
            className="inline-flex items-center justify-center rounded-full bg-[#2A5FFF] px-4 py-2 text-[11px] font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-[#224bcc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasGestoriaEmail
              ? "Enviar instrucciones a mi gestoria"
              : "Configura primero el email de tu gestoria"}
          </button>
        </div>

        {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
        {message && <p className="mt-2 text-[11px] text-emerald-400">{message}</p>}
      </div>
    </div>
  );
}

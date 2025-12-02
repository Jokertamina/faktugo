"use client";

import { useState, useEffect } from "react";

interface UsageData {
  plan: string;
}

export default function SupportButton() {
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch("/api/stripe/usage");
        if (res.ok) {
          const data: UsageData = await res.json();
          setPlan(data.plan || "free");
        }
      } catch {
        // Error silencioso
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  if (loading) return null;

  const isPro = plan === "pro";

  if (isPro) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <span>💬</span>
          <span>Soporte prioritario</span>
        </button>
        {showModal && <SupportModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <a
      href="mailto:soporte@faktugo.com?subject=Consulta de soporte - FaktuGo"
      className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
    >
      <span>📧</span>
      <span>Contactar</span>
    </a>
  );
}

function SupportModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Por favor completa el asunto y el mensaje");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, phone, companyName }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || "Error al enviar el mensaje");
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-2xl">
        {sent ? (
          <div className="text-center">
            <div className="mb-4 text-5xl">✅</div>
            <h3 className="text-xl font-semibold text-slate-50">
              ¡Mensaje enviado!
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Hemos recibido tu solicitud y te responderemos lo antes posible.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-50">
                Soporte prioritario
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-400">
              Como usuario Pro, tienes acceso a soporte prioritario. Describe tu
              problema o sugerencia y te responderemos lo antes posible.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Asunto *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="¿En qué podemos ayudarte?"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Mensaje *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe tu problema, sugerencia o consulta..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">
                    Empresa (opcional)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Tu empresa"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? "Enviando..." : "Enviar mensaje"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AccountSettingsProps {
  hasActiveSubscription: boolean;
}

export default function AccountSettings({ hasActiveSubscription }: AccountSettingsProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error || "Error al abrir el portal");
      }
    } catch {
      alert("Error al abrir el portal de facturación");
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleExportInvoices() {
    try {
      setExportLoading(true);
      const res = await fetch("/api/account/export-invoices");

      if (!res.ok) {
        const json = await res.json().catch(() => null as any);
        alert(json?.error || "No se pudo generar el ZIP de facturas");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "faktugo-facturas.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo descargar el ZIP de facturas");
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "ELIMINAR") {
      setError('Escribe "ELIMINAR" para confirmar');
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const json = await res.json();

      if (res.ok) {
        // Redirigir al login
        window.location.href = "/login";
      } else {
        setError(json.error || "Error al eliminar la cuenta");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">Configuración de cuenta</h3>
      
      {/* Gestionar suscripción - solo si tiene suscripción activa */}
      {hasActiveSubscription && (
        <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-200">Facturación y suscripción</p>
              <p className="mt-1 text-xs text-slate-400">
                Gestiona tu método de pago, historial de facturas y cancela o cambia tu plan.
              </p>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {portalLoading ? "Cargando..." : "Gestionar"}
            </button>
          </div>
        </div>
      )}

      {/* Exportar facturas */}
      <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-200">Exportar facturas</p>
            <p className="mt-1 text-xs text-slate-400">
              Descarga un archivo ZIP con todas las facturas guardadas en FaktuGo antes de eliminar tu cuenta.
            </p>
          </div>
          <button
            onClick={handleExportInvoices}
            disabled={exportLoading}
            className="shrink-0 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-50"
          >
            {exportLoading ? "Preparando ZIP..." : "Descargar ZIP"}
          </button>
        </div>
      </div>

      {/* Eliminar cuenta */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-red-300">Zona de peligro</p>
            <p className="mt-1 text-xs text-slate-400">
              Eliminar tu cuenta borrará todas tus facturas y datos. Esta acción es irreversible.
              Te recomendamos descargar antes un ZIP con tus facturas.
            </p>
            {hasActiveSubscription && (
              <p className="mt-2 text-xs text-amber-400">
                ⚠️ Debes cancelar tu suscripción antes de poder eliminar tu cuenta.
              </p>
            )}
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={hasActiveSubscription}
            className="shrink-0 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eliminar cuenta
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0B1220] p-6">
            <h3 className="text-lg font-semibold text-red-400">¿Eliminar cuenta?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Esta acción eliminará permanentemente:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              <li>• Todas tus facturas</li>
              <li>• Tu perfil y datos personales</li>
              <li>• Historial de suscripciones</li>
            </ul>
            <p className="mt-4 text-sm text-slate-300">
              Escribe <strong className="text-red-400">ELIMINAR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-red-500 focus:outline-none"
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setError("");
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

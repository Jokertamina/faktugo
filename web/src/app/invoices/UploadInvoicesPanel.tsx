"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LocalFileState = {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
};

const maxFiles = 20;
const maxSizeBytes = 20 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

type UploadInvoicesPanelProps = {
  hasGestoriaEmail: boolean;
  autoSendIngested: boolean;
  canSendToGestoria: boolean;
};

export default function UploadInvoicesPanel({
  hasGestoriaEmail,
  autoSendIngested,
  canSendToGestoria,
}: UploadInvoicesPanelProps) {
  const router = useRouter();
  const [files, setFiles] = useState<LocalFileState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [archivalOnly, setArchivalOnly] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sendToGestoria, setSendToGestoria] = useState(false);
  const [showPurposeDialog, setShowPurposeDialog] = useState(false);
  const [purpose, setPurpose] = useState<"archive" | "gestoria">(() =>
    hasGestoriaEmail && canSendToGestoria && autoSendIngested ? "gestoria" : "archive"
  );

  function addFiles(selected: File[]) {
    setError(null);
    setInfo(null);

    const existing = files;
    const remainingSlots = maxFiles - existing.length;
    const toTake = selected.slice(0, remainingSlots);

    const next: LocalFileState[] = [...existing];
    for (const file of toTake) {
      if (file.size > maxSizeBytes) {
        setError("Algunos archivos superan el tamaño maximo permitido");
        continue;
      }
      const id = `${file.name}-${file.lastModified}-${file.size}-${Math.random()}`;
      next.push({
        id,
        file,
        name: file.name,
        size: file.size,
        status: "pending",
      });
    }

    setFiles(next);

    if (!existing.length && next.length) {
      setShowPurposeDialog(true);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (!fileList) return;
    const selected = Array.from(fileList);
    addFiles(selected);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    if (!droppedFiles.length) return;
    addFiles(droppedFiles);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function resetList() {
    setFiles([]);
    setError(null);
    setInfo(null);
    setArchivalOnly(false);
    setSendToGestoria(false);
    setPurpose("archive");
  }

  function applyPurposeSelection(choice: "archive" | "gestoria") {
    if (choice === "archive") {
      setArchivalOnly(true);
      setSendToGestoria(false);
    } else {
      setArchivalOnly(false);
      if (hasGestoriaEmail && canSendToGestoria) {
        setSendToGestoria(true);
      } else {
        setSendToGestoria(false);
      }
    }
  }

  function handleConfirmPurpose() {
    applyPurposeSelection(purpose);
    setShowPurposeDialog(false);
  }

  async function handleUpload() {
    setError(null);
    setInfo(null);

    const pending = files.filter((f) => f.status === "pending" || f.status === "error");
    if (!pending.length) {
      setError("No hay archivos pendientes de subir");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    for (const item of pending) {
      formData.append("files", item.file, item.name);
    }

    if (archivalOnly) {
      formData.append("archivalOnly", "true");
    }

    if (sendToGestoria) {
      formData.append("sendToGestoria", "true");
    }

    const updated: LocalFileState[] = files.map((f) =>
      pending.some((p) => p.id === f.id)
        ? ({ ...f, status: "uploading", error: undefined } as LocalFileState)
        : f
    );
    setFiles(updated);

    try {
      const res = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "No se pudo completar la subida";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }

      const data = (await res.json()) as {
        results: { originalName: string; id?: string; error?: string }[];
      };

      const results = data.results || [];

      const nextFiles: LocalFileState[] = files.map((file) => {
        const match = results.find((r) => r.originalName === file.name);
        if (!match) return file;
        if (match.error) {
          return { ...file, status: "error", error: match.error } as LocalFileState;
        }
        return { ...file, status: "success", error: undefined } as LocalFileState;
      });

      setFiles(nextFiles);

      // Contar éxitos y errores para mostrar mensaje apropiado
      const successCount = nextFiles.filter((f) => f.status === "success").length;
      const errorCount = nextFiles.filter((f) => f.status === "error").length;

      if (errorCount === 0 && successCount > 0) {
        setInfo("Subida completada. Tus facturas se estan organizando en el panel.");
      } else if (successCount > 0 && errorCount > 0) {
        setInfo(`${successCount} factura(s) subida(s). ${errorCount} documento(s) rechazado(s) (ver detalles abajo).`);
      } else if (errorCount > 0 && successCount === 0) {
        setError(`Ningun documento fue aceptado. ${errorCount} rechazado(s) (ver detalles abajo).`);
      }

      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error inesperado durante la subida";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-[#020617] p-5 text-xs text-slate-200">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">Subir facturas</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Arrastra aqui tus PDFs o fotos de facturas, o selecciona archivos desde tu ordenador.
          </p>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center hover:border-slate-500 hover:bg-slate-900/70"
      >
        <p className="text-xs text-slate-200">Arrastra y suelta archivos aqui</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Formatos aceptados: PDF, JPG, PNG, HEIC. Maximo {maxFiles} archivos, {(
            maxSizeBytes /
            (1024 * 1024)
          ).toFixed(0)}
          MB por archivo.
        </p>
        <label className="mt-3 inline-flex cursor-pointer items-center rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-white">
          <span>Seleccionar archivos</span>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-[11px] font-semibold text-slate-300">Archivos seleccionados</p>
          <ul className="space-y-1">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-100">{file.name}</p>
                  <p className="text-[11px] text-slate-500">{formatSize(file.size)}</p>
                </div>
                <div className="ml-3 flex flex-col items-end text-[11px]">
                  {file.status === "pending" && (
                    <span className="text-slate-400">Pendiente</span>
                  )}
                  {file.status === "uploading" && (
                    <span className="text-blue-400">Subiendo...</span>
                  )}
                  {file.status === "success" && (
                    <span className="text-emerald-400">✓ Factura guardada</span>
                  )}
                  {file.status === "error" && (
                    <div className="text-right">
                      <span className="text-red-400">✗ Rechazado</span>
                      {file.error && (
                        <p className="mt-0.5 max-w-[200px] text-[10px] text-red-300/80">{file.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px]">
          {error && <p className="text-red-400">{error}</p>}
          {!error && info && <p className="text-emerald-400">{info}</p>}
        </div>
        <div className="flex gap-2 text-[11px]">
          <button
            type="button"
            onClick={resetList}
            className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
          >
            Limpiar lista
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="rounded-full bg-[#22CC88] px-4 py-1.5 font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-[#18a96f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Subiendo..." : "Subir facturas"}
          </button>
        </div>
      </div>

      {showPurposeDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#020617] p-4 text-xs text-slate-200 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-50">
              ¿Qué quieres hacer con estas facturas?
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              {hasGestoriaEmail && canSendToGestoria &&
                "Elige si son solo para almacenarlas o si quieres usarlas para tu gestoria."}
              {hasGestoriaEmail && !canSendToGestoria &&
                "Tu plan actual no permite enviar facturas a la gestoria. Puedes almacenarlas igualmente en FaktuGo."}
              {!hasGestoriaEmail &&
                "Aun no has configurado el email de tu gestoria; de momento solo podremos subir las facturas."}
            </p>
            <div className="mt-3 space-y-2">
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  className="mt-0.5 h-3 w-3 rounded border-slate-600 bg-slate-900 text-[#22CC88] focus:ring-0"
                  checked={purpose === "archive"}
                  onChange={() => setPurpose("archive")}
                />
                <div>
                  <p>Solo almacenarlas en FaktuGo (la gestoria ya las tiene).</p>
                  <p className="text-[10px] text-slate-500">
                    Se marcaran como "Solo almacenadas" y no se enviaran a tu gestoria.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  className="mt-0.5 h-3 w-3 rounded border-slate-600 bg-slate-900 text-[#22CC88] focus:ring-0"
                  checked={purpose === "gestoria"}
                  onChange={() => setPurpose("gestoria")}
                  disabled={!hasGestoriaEmail || !canSendToGestoria}
                />
                <div className={hasGestoriaEmail && canSendToGestoria ? "" : "opacity-60"}>
                  <p>
                    {hasGestoriaEmail && canSendToGestoria
                      ? autoSendIngested
                        ? "Subirlas y enviarlas automaticamente a tu gestoria."
                        : "Subirlas y enviarlas ahora a tu gestoria."
                      : hasGestoriaEmail && !canSendToGestoria
                        ? "Tu plan actual no permite enviar facturas a la gestoria. Actualiza a un plan con envio para activarlo."
                        : "Subirlas para tu gestoria (no se enviaran hasta que configures su email)."}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {hasGestoriaEmail && canSendToGestoria
                      ? "Se usara el email de tu gestoria configurado en tu perfil."
                      : hasGestoriaEmail && !canSendToGestoria
                        ? "Tu email de gestoria está configurado, pero tu plan actual no permite envios automáticos."
                        : "Configura el email de tu gestoria en tu cuenta para poder enviarlas."}
                  </p>
                </div>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setShowPurposeDialog(false);
                  if (!files.length) {
                    setArchivalOnly(false);
                    setSendToGestoria(false);
                    setPurpose("archive");
                  }
                }}
                className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPurpose}
                className="rounded-full bg-[#22CC88] px-4 py-1.5 font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-[#18a96f]"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

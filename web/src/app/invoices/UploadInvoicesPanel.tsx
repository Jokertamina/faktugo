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

export default function UploadInvoicesPanel() {
  const router = useRouter();
  const [files, setFiles] = useState<LocalFileState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      setInfo("Subida completada. Tus facturas se estan organizando en el panel.");
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
                <div className="ml-3 text-[11px]">
                  {file.status === "pending" && (
                    <span className="text-slate-400">Pendiente</span>
                  )}
                  {file.status === "uploading" && (
                    <span className="text-blue-400">Subiendo...</span>
                  )}
                  {file.status === "success" && (
                    <span className="text-emerald-400">Subida correcta</span>
                  )}
                  {file.status === "error" && (
                    <span className="text-red-400">Error</span>
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
    </section>
  );
}

'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

const TYPE_OPTIONS = [
  { value: "autonomo", label: "Autónomo" },
  { value: "empresa", label: "Empresa" },
];

export type ProfileData = {
  display_name: string;
  first_name?: string | null;
  last_name?: string | null;
  type: string;
  company_name: string | null;
  country: string | null;
  gestoria_email?: string | null;
};

interface ProfileFormProps {
  userId: string;
  email: string;
  profile: ProfileData | null;
}

export default function ProfileForm({ userId, email, profile }: ProfileFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile?.first_name ?? profile?.display_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [type, setType] = useState<string>(profile?.type ?? "autonomo");
  const [companyName, setCompanyName] = useState(profile?.company_name ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [gestoriaEmail, setGestoriaEmail] = useState(profile?.gestoria_email ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const trimmedCompany = companyName.trim();
      const trimmedGestoriaEmail = gestoriaEmail.trim();
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
      const isBusiness = type === "empresa";

      if (!trimmedFirst || !trimmedLast) {
        setError("Nombre y apellidos son obligatorios.");
        setSaving(false);
        return;
      }

      if (isBusiness && !trimmedCompany) {
        setError("Para empresas, el nombre de la empresa es obligatorio.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            display_name: fullName,
            first_name: trimmedFirst || null,
            last_name: trimmedLast || null,
            type,
            company_name: trimmedCompany || null,
            country: country.trim() || null,
            gestoria_email: trimmedGestoriaEmail || null,
          },
          { onConflict: "id" }
        );

      if (error) throw error;

      setMessage("Perfil actualizado correctamente.");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-xs text-slate-300">
      <div>
        <label className="block text-slate-300" htmlFor="firstName">
          Nombre
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-slate-300" htmlFor="lastName">
          Apellidos
        </label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-slate-300" htmlFor="type">
          Tipo de cliente
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-slate-300" htmlFor="companyName">
  {type === "empresa"
            ? "Nombre de la empresa"
            : "Nombre comercial (opcional)"}
        </label>
        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-slate-300" htmlFor="country">
          País (opcional)
        </label>
        <input
          id="country"
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-slate-300" htmlFor="gestoriaEmail">
          Email de tu gestoría (opcional)
        </label>
        <input
          id="gestoriaEmail"
          type="email"
          value={gestoriaEmail}
          onChange={(e) => setGestoriaEmail(e.target.value)}
          placeholder="gestoria@ejemplo.com"
          className="mt-1 w-full rounded-lg border border-slate-800 bg-[#020617] px-3 py-2 text-xs text-slate-50 outline-none ring-0 focus:border-slate-500"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Usaremos este email para enviar tus facturas a tu gestor/asesor fiscal.
        </p>
      </div>

      <div>
        <label className="block text-slate-400 text-[11px]">Email (solo lectura)</label>
        <p className="mt-1 text-[11px] text-slate-300">{email}</p>
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {message && <p className="text-[11px] text-emerald-400">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-1 inline-flex items-center justify-center rounded-full bg-[#2A5FFF] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-[#224bcc] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

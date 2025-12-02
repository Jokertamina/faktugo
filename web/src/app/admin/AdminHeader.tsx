"use client";

import { useAdmin } from "./AdminAuthGate";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminHeader() {
  const admin = useAdmin();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.refresh();
      window.location.href = "/admin";
    } catch {
      setLoggingOut(false);
    }
  }

  if (!admin) return null;

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    manager: "Manager",
    support: "Soporte",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-slate-200">{admin.name}</p>
        <p className="text-xs text-slate-400">{roleLabels[admin.role] || admin.role}</p>
      </div>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
      >
        {loggingOut ? "..." : "Salir"}
      </button>
    </div>
  );
}

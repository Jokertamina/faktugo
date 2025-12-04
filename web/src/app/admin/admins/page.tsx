"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdmin } from "../AdminAuthGate";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: {
    dashboard: boolean;
    users: boolean;
    plans: boolean;
    tickets: boolean;
    security: boolean;
    admins: boolean;
  };
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

const ROLES = [
  { value: "super_admin", label: "Super Admin", description: "Acceso total" },
  { value: "manager", label: "Manager", description: "Gestión de usuarios y planes" },
  { value: "support", label: "Soporte", description: "Solo tickets" },
];

const PERMISSIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Usuarios" },
  { key: "plans", label: "Planes" },
  { key: "tickets", label: "Tickets" },
  { key: "security", label: "Seguridad" },
  { key: "admins", label: "Admins" },
];

export default function AdminsPage() {
  const currentAdmin = useAdmin();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    pin: "",
    role: "support",
    permissions: {
      dashboard: true,
      users: false,
      plans: false,
      tickets: true,
      security: false,
      admins: false,
    },
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Verificar permiso
  if (currentAdmin?.role !== "super_admin" && !currentAdmin?.permissions?.admins) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-[#0B1220] p-8 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-lg font-semibold text-slate-50">Sin acceso</h2>
        <p className="mt-2 text-sm text-slate-400">
          No tienes permiso para gestionar administradores.
        </p>
      </div>
    );
  }

  async function fetchAdmins() {
    try {
      const res = await fetch("/api/admin/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch {
      setMessage({ type: "error", text: "Error cargando admins" });
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingAdmin(null);
    setFormData({
      email: "",
      name: "",
      pin: "",
      role: "support",
      permissions: {
        dashboard: true,
        users: false,
        plans: false,
        tickets: true,
        security: false,
        admins: false,
      },
    });
    setShowModal(true);
  }

  function openEditModal(admin: AdminUser) {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      name: admin.name,
      pin: "",
      role: admin.role,
      permissions: admin.permissions,
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (editingAdmin) {
        // Actualizar
        const res = await fetch("/api/admin/admins", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAdmin.id,
            name: formData.name,
            role: formData.role,
            permissions: formData.permissions,
            newPin: formData.pin || undefined,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage({ type: "success", text: "Admin actualizado" });
          setShowModal(false);
          fetchAdmins();
        } else {
          setMessage({ type: "error", text: data.error });
        }
      } else {
        // Crear
        if (!formData.email || !formData.name || !formData.pin) {
          setMessage({ type: "error", text: "Completa todos los campos" });
          setSaving(false);
          return;
        }

        const res = await fetch("/api/admin/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage({ type: "success", text: "Admin creado" });
          setShowModal(false);
          fetchAdmins();
        } else {
          setMessage({ type: "error", text: data.error });
        }
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(admin: AdminUser) {
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: admin.id,
          is_active: !admin.is_active,
        }),
      });

      if (res.ok) {
        fetchAdmins();
      }
    } catch {
      setMessage({ type: "error", text: "Error actualizando" });
    }
  }

  async function deleteAdmin(admin: AdminUser) {
    if (!confirm(`¿Eliminar a ${admin.name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/admins?id=${admin.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Admin eliminado" });
        fetchAdmins();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Error eliminando" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Administradores</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona quién tiene acceso al panel de administración
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            860 Volver al panel
          </Link>
          <button
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo admin
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`rounded-lg p-3 text-sm ${
          message.type === "error"
            ? "bg-red-500/20 text-red-300"
            : "bg-emerald-500/20 text-emerald-300"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className={`rounded-xl border p-4 ${
              admin.is_active
                ? "border-slate-800 bg-[#0B1220]"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-50">{admin.name}</h3>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    admin.role === "super_admin"
                      ? "bg-amber-500/20 text-amber-300"
                      : admin.role === "manager"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-slate-700 text-slate-300"
                  }`}>
                    {ROLES.find(r => r.value === admin.role)?.label || admin.role}
                  </span>
                  {!admin.is_active && (
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                      Desactivado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-400">{admin.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(admin.permissions).map(([key, value]) => (
                    value && (
                      <span key={key} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                        {PERMISSIONS.find(p => p.key === key)?.label || key}
                      </span>
                    )
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {admin.last_login_at && (
                  <p className="text-xs text-slate-500">
                    Último acceso: {new Date(admin.last_login_at).toLocaleDateString("es-ES")}
                  </p>
                )}
                <button
                  onClick={() => openEditModal(admin)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Editar
                </button>
                {admin.id !== currentAdmin?.id && (
                  <>
                    <button
                      onClick={() => toggleActive(admin)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        admin.is_active
                          ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {admin.is_active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => deleteAdmin(admin)}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0B1220] p-6">
            <h3 className="text-lg font-semibold text-slate-50">
              {editingAdmin ? `Editar: ${editingAdmin.name}` : "Nuevo administrador"}
            </h3>

            <div className="mt-4 space-y-4">
              {!editingAdmin && (
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm text-slate-300">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  {editingAdmin ? "Nuevo PIN (dejar vacío para mantener)" : "PIN de acceso"}
                </label>
                <input
                  type="password"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder={editingAdmin ? "••••••" : "Mínimo 4 caracteres"}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 focus:border-blue-500 focus:outline-none"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Permisos</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions[perm.key as keyof typeof formData.permissions]}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [perm.key]: e.target.checked,
                          },
                        })}
                        className="rounded border-slate-600"
                      />
                      <span className="text-sm text-slate-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : editingAdmin ? "Guardar cambios" : "Crear admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

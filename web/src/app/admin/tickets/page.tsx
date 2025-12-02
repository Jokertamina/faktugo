"use client";

import { useState, useEffect } from "react";

interface Ticket {
  id: string;
  user_id: string | null;
  user_email: string;
  user_plan: string;
  company_name: string | null;
  phone: string | null;
  subject: string;
  message: string;
  source: "form" | "email";
  status: "pending" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  profiles: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
  } | null;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente", color: "amber" },
  { value: "in_progress", label: "En progreso", color: "blue" },
  { value: "resolved", label: "Resuelto", color: "emerald" },
  { value: "closed", label: "Cerrado", color: "slate" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baja", color: "slate" },
  { value: "normal", label: "Normal", color: "blue" },
  { value: "high", label: "Alta", color: "amber" },
  { value: "urgent", label: "Urgente", color: "red" },
];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const url = filter === "all" 
        ? "/api/admin/tickets" 
        : `/api/admin/tickets?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Error cargando tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateTicket(id: string, updates: Partial<Ticket>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      if (res.ok) {
        await fetchTickets();
        if (selectedTicket?.id === id) {
          const data = await res.json();
          setSelectedTicket({ ...selectedTicket, ...data.ticket });
        }
      }
    } catch (error) {
      console.error("Error actualizando ticket:", error);
    } finally {
      setSaving(false);
    }
  }

  const pendingCount = tickets.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">
          Tickets de Soporte
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-sm text-slate-900">
              {pendingCount} pendientes
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Gestiona las solicitudes de soporte de usuarios Pro
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          Todos
        </FilterButton>
        {STATUS_OPTIONS.map((s) => (
          <FilterButton
            key={s.value}
            active={filter === s.value}
            onClick={() => setFilter(s.value)}
          >
            {s.label}
          </FilterButton>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-8 text-center">
          <p className="text-slate-400">No hay tickets{filter !== "all" ? ` con estado "${filter}"` : ""}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Ticket List */}
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isSelected={selectedTicket?.id === ticket.id}
                onClick={() => setSelectedTicket(ticket)}
              />
            ))}
          </div>

          {/* Ticket Detail */}
          {selectedTicket && (
            <div className="lg:sticky lg:top-4">
              <TicketDetail
                ticket={selectedTicket}
                saving={saving}
                onUpdateStatus={(status) => updateTicket(selectedTicket.id, { status })}
                onUpdatePriority={(priority) => updateTicket(selectedTicket.id, { priority })}
                onUpdateNotes={(notes) => updateTicket(selectedTicket.id, { admin_notes: notes })}
                onClose={() => setSelectedTicket(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm transition ${
        active
          ? "bg-blue-600 text-white"
          : "border border-slate-700 text-slate-300 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function TicketCard({
  ticket,
  isSelected,
  onClick,
}: {
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === ticket.status);
  const priorityOption = PRIORITY_OPTIONS.find((p) => p.value === ticket.priority);
  const userName = ticket.profiles?.display_name || 
    `${ticket.profiles?.first_name || ""} ${ticket.profiles?.last_name || ""}`.trim() ||
    ticket.user_email;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition ${
        isSelected
          ? "border-blue-500 bg-blue-500/10"
          : "border-slate-800 bg-[#0B1220] hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-50">{ticket.subject}</p>
          <p className="mt-1 truncate text-sm text-slate-400">{userName}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <span>{ticket.user_plan.toUpperCase()}</span>
        <span>·</span>
        <span>{new Date(ticket.created_at).toLocaleDateString("es-ES")}</span>
        {ticket.source === "email" && (
          <>
            <span>·</span>
            <span>📧 Email</span>
          </>
        )}
      </div>
    </button>
  );
}

function TicketDetail({
  ticket,
  saving,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateNotes,
  onClose,
}: {
  ticket: Ticket;
  saving: boolean;
  onUpdateStatus: (status: Ticket["status"]) => void;
  onUpdatePriority: (priority: Ticket["priority"]) => void;
  onUpdateNotes: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(ticket.admin_notes || "");
  const userName = ticket.profiles?.display_name || 
    `${ticket.profiles?.first_name || ""} ${ticket.profiles?.last_name || ""}`.trim() ||
    "Usuario";

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4 sm:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">{ticket.subject}</h3>
          <p className="text-sm text-slate-400">
            Ticket #{ticket.id.slice(0, 8)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          ✕
        </button>
      </div>

      {/* User Info */}
      <div className="mb-4 rounded-lg bg-slate-800/50 p-3">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-slate-400">Usuario:</span>{" "}
            <span className="text-slate-200">{userName}</span>
          </div>
          <div>
            <span className="text-slate-400">Email:</span>{" "}
            <span className="text-slate-200">{ticket.user_email}</span>
          </div>
          {ticket.company_name && (
            <div>
              <span className="text-slate-400">Empresa:</span>{" "}
              <span className="text-slate-200">{ticket.company_name}</span>
            </div>
          )}
          {ticket.phone && (
            <div>
              <span className="text-slate-400">Teléfono:</span>{" "}
              <span className="text-slate-200">{ticket.phone}</span>
            </div>
          )}
          <div>
            <span className="text-slate-400">Plan:</span>{" "}
            <span className="text-slate-200">{ticket.user_plan.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-slate-400">Fecha:</span>{" "}
            <span className="text-slate-200">
              {new Date(ticket.created_at).toLocaleString("es-ES")}
            </span>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-slate-400">Mensaje:</p>
        <div className="max-h-48 overflow-y-auto rounded-lg bg-slate-800/50 p-3 text-sm text-slate-200 whitespace-pre-wrap">
          {ticket.message}
        </div>
      </div>

      {/* Status & Priority */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Estado</label>
          <select
            value={ticket.status}
            onChange={(e) => onUpdateStatus(e.target.value as Ticket["status"])}
            disabled={saving}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Prioridad</label>
          <select
            value={ticket.priority}
            onChange={(e) => onUpdatePriority(e.target.value as Ticket["priority"])}
            disabled={saving}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="mb-4">
        <label className="mb-1 block text-xs text-slate-400">Notas internas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus:border-blue-500 focus:outline-none"
          placeholder="Añade notas sobre este ticket..."
        />
        <button
          onClick={() => onUpdateNotes(notes)}
          disabled={saving || notes === (ticket.admin_notes || "")}
          className="mt-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50"
        >
          Guardar notas
        </button>
      </div>

      {/* Quick Reply */}
      <div className="border-t border-slate-800 pt-4">
        <a
          href={`mailto:${ticket.user_email}?subject=Re: ${encodeURIComponent(ticket.subject)}`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          📧 Responder por email
        </a>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Ticket["status"] }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-300",
    in_progress: "bg-blue-500/20 text-blue-300",
    resolved: "bg-emerald-500/20 text-emerald-300",
    closed: "bg-slate-500/20 text-slate-300",
  };
  const labels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En progreso",
    resolved: "Resuelto",
    closed: "Cerrado",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Ticket["priority"] }) {
  const colors: Record<string, string> = {
    low: "text-slate-400",
    normal: "text-blue-400",
    high: "text-amber-400",
    urgent: "text-red-400",
  };
  const icons: Record<string, string> = {
    low: "↓",
    normal: "→",
    high: "↑",
    urgent: "⚠️",
  };

  return (
    <span className={`text-xs ${colors[priority]}`}>
      {icons[priority]} {priority}
    </span>
  );
}

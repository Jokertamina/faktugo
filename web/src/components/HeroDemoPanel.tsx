"use client";

import { useState } from "react";

interface DemoInvoice {
  id: string;
  date: string;
  supplier: string;
  category: string;
  amount: string;
}

interface DemoGroup {
  id: string;
  label: string;
  folder: string;
  invoices: DemoInvoice[];
}

const MONTHLY_GROUPS: DemoGroup[] = [
  {
    id: "m-2025-02",
    label: "Febrero 2025",
    folder: "/FaktuGo/2025-02",
    invoices: [
      {
        id: "m-2025-02-1",
        date: "14/02/2025",
        supplier: "REPSOL",
        category: "Gasolina",
        amount: "45.60 EUR",
      },
      {
        id: "m-2025-02-2",
        date: "13/02/2025",
        supplier: "MERCADONA",
        category: "Dietas",
        amount: "32.10 EUR",
      },
    ],
  },
  {
    id: "m-2025-01",
    label: "Enero 2025",
    folder: "/FaktuGo/2025-01",
    invoices: [
      {
        id: "m-2025-01-1",
        date: "21/01/2025",
        supplier: "AMAZON",
        category: "Compras",
        amount: "89.99 EUR",
      },
      {
        id: "m-2025-01-2",
        date: "09/01/2025",
        supplier: "UBER",
        category: "Transporte",
        amount: "18.40 EUR",
      },
    ],
  },
  {
    id: "m-2024-12",
    label: "Diciembre 2024",
    folder: "/FaktuGo/2024-12",
    invoices: [
      {
        id: "m-2024-12-1",
        date: "18/12/2024",
        supplier: "RENAULT TALLER",
        category: "Mantenimiento",
        amount: "210.00 EUR",
      },
      {
        id: "m-2024-12-2",
        date: "02/12/2024",
        supplier: "CAFETERÍA PLAZA",
        category: "Dietas",
        amount: "8.90 EUR",
      },
    ],
  },
];

const WEEKLY_GROUPS: DemoGroup[] = [
  {
    id: "w-2025-S07",
    label: "10–16 febrero 2025",
    folder: "/FaktuGo/2025-S07",
    invoices: [
      {
        id: "w-2025-S07-1",
        date: "11/02/2025",
        supplier: "CABIFY",
        category: "Transporte",
        amount: "23.40 EUR",
      },
      {
        id: "w-2025-S07-2",
        date: "10/02/2025",
        supplier: "MCDONALD'S",
        category: "Dietas",
        amount: "12.60 EUR",
      },
    ],
  },
  {
    id: "w-2025-S06",
    label: "3–9 febrero 2025",
    folder: "/FaktuGo/2025-S06",
    invoices: [
      {
        id: "w-2025-S06-1",
        date: "06/02/2025",
        supplier: "BP",
        category: "Gasolina",
        amount: "52.30 EUR",
      },
      {
        id: "w-2025-S06-2",
        date: "05/02/2025",
        supplier: "DECATHLON",
        category: "Material",
        amount: "34.90 EUR",
      },
    ],
  },
  {
    id: "w-2025-S05",
    label: "27 enero – 2 febrero 2025",
    folder: "/FaktuGo/2025-S05",
    invoices: [
      {
        id: "w-2025-S05-1",
        date: "30/01/2025",
        supplier: "REPSOL",
        category: "Gasolina",
        amount: "47.15 EUR",
      },
      {
        id: "w-2025-S05-2",
        date: "29/01/2025",
        supplier: "GLOVO",
        category: "Dietas",
        amount: "16.80 EUR",
      },
    ],
  },
];

export default function HeroDemoPanel() {
  const [view, setView] = useState<"month" | "week">("month");
  const groups = view === "month" ? MONTHLY_GROUPS : WEEKLY_GROUPS;

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-[#0B1220] p-6 shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <span className="text-sm font-medium text-slate-100">Panel FaktuGo — Ejemplo</span>
        <span className="rounded-full bg-[#22CC88]/20 px-3 py-1 text-xs font-medium text-[#22CC88]">
          Mes actual
        </span>
      </div>

      <div className="mt-4 mb-3 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setView("month")}
          className={`rounded-full px-3 py-1 border text-[11px] font-medium transition ${
            view === "month"
              ? "bg-[#22CC88]/10 border-[#22CC88] text-[#22CC88]"
              : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
          }`}
        >
          Vista mensual
        </button>
        <button
          type="button"
          onClick={() => setView("week")}
          className={`rounded-full px-3 py-1 border text-[11px] font-medium transition ${
            view === "week"
              ? "bg-[#22CC88]/10 border-[#22CC88] text-[#22CC88]"
              : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
          }`}
        >
          Vista semanal
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-2xl bg-white/5 px-4 py-3 space-y-2"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div>
                <p className="font-medium text-[#22CC88]">{group.label}</p>
                <p className="text-[11px] text-slate-500">Carpeta: {group.folder}</p>
              </div>
            </div>

            {group.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2"
              >
                <div>
                  <p className="text-xs text-slate-400">{invoice.date}</p>
                  <p className="text-sm font-medium text-slate-50">{invoice.supplier}</p>
                  <p className="text-[11px] text-slate-400">{invoice.category}</p>
                </div>
                <p className="text-sm font-semibold text-[#22CC88]">{invoice.amount}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
        <span>
          Ejemplo de cómo se agrupan tus facturas en carpetas mensuales o semanales.
        </span>
        <span>/FaktuGo/YYYY-MM · /FaktuGo/YYYY-SWW</span>
      </div>
    </div>
  );
}

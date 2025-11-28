import { NextResponse } from "next/server";
import { getInvoices, computePeriodFromDate } from "@/lib/invoices";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const invoices = await getInvoices(supabase);
  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const { id, date, supplier, category, amount, status } = body ?? {};

  if (!date || !supplier || !amount) {
    return NextResponse.json(
      { error: "Campos obligatorios: date, supplier, amount" },
      { status: 400 }
    );
  }

  const baseStatus = status === "Pendiente" ? "Pendiente" : "Enviada";
  const { period_type, period_key, folder_path } = computePeriodFromDate(date, "month");

  const upsertPayload = {
    id: id ?? crypto.randomUUID(),
    user_id: user.id,
    date,
    supplier,
    category: category ?? "Otros",
    amount,
    status: baseStatus,
    period_type,
    period_key,
    folder_path,
  };

  const { data, error } = await supabase
    .from("invoices")
    .upsert(upsertPayload, { onConflict: "id" })
    .select("id, date, supplier, category, amount, status, period_type, period_key, folder_path")
    .maybeSingle();

  if (error || !data) {
    console.error("Error al crear/actualizar factura desde POST /api/invoices:", error);
    return NextResponse.json({ error: "No se pudo guardar la factura" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

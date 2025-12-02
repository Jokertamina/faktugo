import { NextResponse } from "next/server";
import { getInvoices, computePeriodFromDate } from "@/lib/invoices";
import { getSupabaseServerClient, getSupabaseClientWithToken, getSupabaseServiceClient, verifyAccessToken } from "@/lib/supabaseServer";
import { headers } from "next/headers";

async function getAuthenticatedSupabaseAndUser() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  // Si hay Bearer token (móvil), verificar con service role
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { user, error } = await verifyAccessToken(token);
    
    if (error || !user) {
      console.warn("[/api/invoices] Token inválido:", error);
      return { supabase: null, user: null };
    }
    
    return { supabase: getSupabaseClientWithToken(token), user };
  }
  
  // Si no, usar cookies (web)
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

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

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseAndUser();

    if (!supabase || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
    }

    const { id, date, supplier, category, amount, status } = body ?? {};

    if (!id) {
      return NextResponse.json({ error: "ID de factura requerido" }, { status: 400 });
    }

    // Verificar que la factura existe y pertenece al usuario
    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    // Construir objeto de actualización solo con campos proporcionados
    const updatePayload: Record<string, any> = {};
    if (date !== undefined) {
      updatePayload.date = date;
      const { period_type, period_key, folder_path } = computePeriodFromDate(date, "month");
      updatePayload.period_type = period_type;
      updatePayload.period_key = period_key;
      updatePayload.folder_path = folder_path;
    }
    if (supplier !== undefined) updatePayload.supplier = supplier;
    if (category !== undefined) updatePayload.category = category;
    if (amount !== undefined) updatePayload.amount = amount;
    if (status !== undefined) updatePayload.status = status;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("invoices")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, date, supplier, category, amount, status, period_type, period_key, folder_path")
      .maybeSingle();

    if (error || !data) {
      console.error("Error al actualizar factura:", error);
      return NextResponse.json({ error: "No se pudo actualizar la factura" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Error inesperado en PATCH /api/invoices:", e);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Primero autenticar al usuario
    const { supabase, user } = await getAuthenticatedSupabaseAndUser();

    if (!supabase || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");

    if (!invoiceId) {
      return NextResponse.json({ error: "ID de factura requerido" }, { status: 400 });
    }

    // Usar service client para bypass de RLS en DELETE
    const serviceClient = getSupabaseServiceClient();

    // Obtener la factura para verificar propiedad y obtener file_path
    const { data: invoice, error: fetchError } = await serviceClient
      .from("invoices")
      .select("id, file_path, user_id")
      .eq("id", invoiceId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error al buscar factura para eliminar:", fetchError);
      return NextResponse.json({ error: "No se pudo encontrar la factura" }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    // Verificar que la factura pertenece al usuario autenticado
    if (invoice.user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Eliminar archivo del storage si existe
    if (invoice.file_path) {
      const { error: storageError } = await serviceClient.storage
        .from("invoices")
        .remove([invoice.file_path]);

      if (storageError) {
        console.warn("No se pudo eliminar el archivo del storage:", storageError);
        // Continuamos con la eliminación de la factura aunque falle el storage
      }
    }

    // Eliminar la factura de la base de datos (con service client para bypass RLS)
    const { error: deleteError } = await serviceClient
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (deleteError) {
      console.error("Error al eliminar factura:", deleteError);
      return NextResponse.json({ error: "No se pudo eliminar la factura" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deletedId: invoiceId });
  } catch (e) {
    console.error("Error inesperado en DELETE /api/invoices:", e);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

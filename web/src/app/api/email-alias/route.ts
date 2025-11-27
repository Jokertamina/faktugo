import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

async function getOrCreateEmailAlias(userId: string) {
  const supabase = await getSupabaseServerClient();

  const { data: existing, error: existingError } = await supabase
    .from("email_ingestion_aliases")
    .select("id, full_address")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle<{ id: string; full_address: string }>();

  if (existingError) {
    console.error("Error al buscar alias de correo interno:", existingError);
  }

  if (existing?.full_address) {
    return existing.full_address;
  }

  const domain = process.env.INVOICE_INGESTION_DOMAIN || "invoice.faktugo.com";
  const safeId = userId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const localPart = `u_${safeId}`;
  const fullAddress = `${localPart}@${domain}`;

  const { data: inserted, error: insertError } = await supabase
    .from("email_ingestion_aliases")
    .insert({
      user_id: userId,
      local_part: localPart,
      domain,
      full_address: fullAddress,
      active: true,
    })
    .select("full_address")
    .single<{ full_address: string }>();

  if (insertError || !inserted?.full_address) {
    console.error("Error al crear alias de correo interno:", insertError);
    throw new Error("No se pudo crear tu direccion interna de FaktuGo");
  }

  return inserted.full_address;
}

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const alias = await getOrCreateEmailAlias(user.id);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("auto_send_ingested_to_gestoria, gestoria_email")
      .eq("id", user.id)
      .maybeSingle<{
        auto_send_ingested_to_gestoria: boolean | null;
        gestoria_email: string | null;
      }>();

    if (profileError) {
      console.error("Error al obtener perfil para correo interno:", profileError);
    }

    const autoSend = profile?.auto_send_ingested_to_gestoria ?? false;
    const gestoriaEmail = profile?.gestoria_email ?? null;

    return NextResponse.json({
      alias,
      autoSendToGestoria: autoSend,
      hasGestoriaEmail: !!gestoriaEmail,
      gestoriaEmail,
    });
  } catch (e) {
    console.error("Error inesperado en /api/email-alias [GET]:", e);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const autoSend = body?.autoSendToGestoria as boolean | undefined;

    if (typeof autoSend !== "boolean") {
      return NextResponse.json(
        { error: "autoSendToGestoria debe ser boolean" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const alias = await getOrCreateEmailAlias(user.id);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ auto_send_ingested_to_gestoria: autoSend })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error al actualizar auto_send_ingested_to_gestoria:", updateError);
      return NextResponse.json(
        { error: "No se pudo guardar la configuracion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, alias, autoSendToGestoria: autoSend });
  } catch (e) {
    console.error("Error inesperado en /api/email-alias [PATCH]:", e);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseClientWithToken } from "@/lib/supabaseServer";
import { canUseEmailIngestion } from "@/lib/subscription";
import { headers } from "next/headers";

async function getAuthenticatedSupabase() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  // Si hay Bearer token (móvil), usar ese
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return getSupabaseClientWithToken(token);
  }
  
  // Si no, usar cookies (web)
  return getSupabaseServerClient();
}

async function getOrCreateEmailAlias(userId: string) {
  const supabase = await getSupabaseServerClient();

  const { data: existing, error: existingError } = await supabase
    .from("email_ingestion_aliases")
    .select("id, full_address, local_part, domain, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle<{
      id: string;
      full_address: string;
      local_part: string | null;
      domain: string | null;
      active: boolean;
    }>();

  if (existingError) {
    console.error("Error al buscar alias de correo interno:", existingError);
  }

  if (existing?.full_address) {
    const currentLocal = (existing.local_part ?? "").trim();
    const currentDomain = (existing.domain ?? "").trim();

    // Detectamos alias "legacy" muy largos o con prefijo antiguo (u_) para migrarlos
    // automaticamente al nuevo formato mas corto basado en nombre comercial/empresa.
    const isLegacy =
      currentLocal.startsWith("u_") ||
      currentLocal.length > 40 ||
      currentDomain === "invoice.faktugo.com"; // antiguo dominio por defecto

    if (!isLegacy) {
      return existing.full_address;
    }

    // Para alias legacy, seguimos abajo generando uno nuevo y actualizando la fila existente.
  }

  const domain = process.env.INVOICE_INGESTION_DOMAIN || "invoice.faktugo.com";

  // Obtenemos datos del perfil para generar un alias legible (empresa o nombre comercial).
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("type, company_name, first_name, last_name")
    .eq("id", userId)
    .maybeSingle<{
      type: string | null;
      company_name: string | null;
      first_name: string | null;
      last_name: string | null;
    }>();

  if (profileError) {
    console.error("Error al obtener perfil para generar alias de correo interno:", profileError);
  }

  const type = (profile?.type ?? "autonomo").trim();
  const company = (profile?.company_name ?? "").trim();
  const first = (profile?.first_name ?? "").trim();
  const last = (profile?.last_name ?? "").trim();

  let baseName = "";
  if (type === "empresa") {
    // Empresas: priorizamos el nombre de la empresa.
    baseName = company || `${first} ${last}`.trim();
  } else {
    // Autónomos: usamos nombre comercial si existe, si no nombre completo.
    baseName = company || `${first} ${last}`.trim();
  }

  if (!baseName) {
    baseName = "cliente";
  }

  // Normalizamos a un slug corto: sin acentos, solo [a-z0-9-], max ~20 chars.
  const slug = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20) || "cliente";

  // Intentamos unas pocas veces por si hay colision de UNIQUE en full_address.
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rand = crypto
      .randomUUID()
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 4)
      .toLowerCase();

    const localPart = `${slug}-${rand}`;
    const fullAddress = `${localPart}@${domain}`;

    // Si ya existe una fila (legacy), actualizamos esa misma fila. Si no, insertamos una nueva.
    if (existing?.id) {
      const { data: updated, error: updateError } = await supabase
        .from("email_ingestion_aliases")
        .update({
          local_part: localPart,
          domain,
          full_address: fullAddress,
          active: true,
        })
        .eq("id", existing.id)
        .select("full_address")
        .single<{ full_address: string }>();

      if (!updateError && updated?.full_address) {
        return updated.full_address;
      }

      // Si hay error por colision de UNIQUE, reintentamos con otro sufijo.
      if (updateError && (updateError as any).code === "23505") {
        console.warn("Colision de alias interno al actualizar, reintentando...");
        continue;
      }

      console.error("Error al actualizar alias de correo interno legacy:", updateError);
      throw new Error("No se pudo crear tu direccion interna de FaktuGo");
    }

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

    if (!insertError && inserted?.full_address) {
      return inserted.full_address;
    }

    if (insertError && (insertError as any).code === "23505") {
      console.warn("Colision de alias interno al crear, reintentando...");
      continue;
    }

    console.error("Error al crear alias de correo interno:", insertError);
    throw new Error("No se pudo crear tu direccion interna de FaktuGo");
  }

  throw new Error("No se pudo crear un alias interno unico tras varios intentos");
}

export async function GET() {
  try {
    const supabase = await getAuthenticatedSupabase();
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

    // Comprobamos si el usuario puede usar la ingesta por email segun su plan
    const emailIngestionCheck = await canUseEmailIngestion(supabase, user.id);

    return NextResponse.json({
      alias,
      autoSendToGestoria: autoSend,
      hasGestoriaEmail: !!gestoriaEmail,
      gestoriaEmail,
      canUseEmailIngestion: emailIngestionCheck.allowed,
      emailIngestionReason: emailIngestionCheck.reason ?? null,
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

    const supabase = await getAuthenticatedSupabase();
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

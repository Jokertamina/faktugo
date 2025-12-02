import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";
import crypto from "crypto";

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

// Verificar admin autenticado con sesión válida
async function verifyAdminSession() {
  const serverSupabase = await getSupabaseServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();

  if (!user) return null;

  const supabase = getSupabaseServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return null;

  return { user, supabase };
}

// GET: Obtener configuración de seguridad
export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data, error } = await auth.supabase
      .from("admin_security")
      .select("allowed_ips, require_ip_check, updated_at")
      .eq("id", "main")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      allowedIPs: data?.allowed_ips || [],
      requireIPCheck: data?.require_ip_check || false,
      updatedAt: data?.updated_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar configuración de seguridad
export async function PUT(request: Request) {
  try {
    const auth = await verifyAdminSession();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    // Cambiar PIN
    if (body.newPin) {
      if (body.newPin.length < 4) {
        return NextResponse.json({ error: "El PIN debe tener al menos 4 caracteres" }, { status: 400 });
      }
      updates.pin_hash = hashPin(body.newPin);
    }

    // Actualizar IPs permitidas
    if (body.allowedIPs !== undefined) {
      updates.allowed_ips = body.allowedIPs;
    }

    // Activar/desactivar verificación de IP
    if (body.requireIPCheck !== undefined) {
      updates.require_ip_check = body.requireIPCheck;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await auth.supabase
      .from("admin_security")
      .update(updates)
      .eq("id", "main");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si se cambió el PIN, invalidar todas las sesiones
    if (body.newPin) {
      await auth.supabase
        .from("admin_sessions")
        .delete()
        .neq("id", "none"); // Eliminar todas
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

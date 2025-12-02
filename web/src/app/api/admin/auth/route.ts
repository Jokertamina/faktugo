import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";
import crypto from "crypto";

// Hash SHA256 para el PIN
function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

// Obtener IP del cliente
async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIP = headersList.get("x-real-ip");
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

// GET: Verificar si tiene sesión de admin válida
export async function GET() {
  try {
    const serverSupabase = await getSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ valid: false, reason: "not_authenticated" });
    }

    const supabase = getSupabaseServiceClient();

    // Verificar si es admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.json({ valid: false, reason: "not_admin" });
    }

    // Obtener configuración de seguridad
    const { data: security } = await supabase
      .from("admin_security")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (!security) {
      return NextResponse.json({ valid: false, reason: "no_security_config" });
    }

    const clientIP = await getClientIP();

    // Verificar IP si está habilitado
    if (security.require_ip_check && security.allowed_ips?.length > 0) {
      const isIPAllowed = security.allowed_ips.includes(clientIP) || 
                          security.allowed_ips.includes("*");
      if (!isIPAllowed) {
        return NextResponse.json({ 
          valid: false, 
          reason: "ip_not_allowed",
          ip: clientIP 
        });
      }
    }

    // Verificar sesión de admin
    const { data: session } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("ip_address", clientIP)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (session) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ 
      valid: false, 
      reason: "pin_required",
      ip: clientIP 
    });
  } catch (error: any) {
    console.error("Error verificando admin auth:", error);
    return NextResponse.json({ valid: false, reason: "error" }, { status: 500 });
  }
}

// POST: Verificar PIN y crear sesión
export async function POST(request: Request) {
  try {
    const serverSupabase = await getSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();

    // Verificar si es admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: "PIN requerido" }, { status: 400 });
    }

    // Obtener configuración de seguridad
    const { data: security } = await supabase
      .from("admin_security")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (!security) {
      return NextResponse.json({ error: "Configuración no encontrada" }, { status: 500 });
    }

    const clientIP = await getClientIP();

    // Verificar IP si está habilitado
    if (security.require_ip_check && security.allowed_ips?.length > 0) {
      const isIPAllowed = security.allowed_ips.includes(clientIP) || 
                          security.allowed_ips.includes("*");
      if (!isIPAllowed) {
        return NextResponse.json({ 
          error: "Acceso denegado desde esta IP",
          ip: clientIP 
        }, { status: 403 });
      }
    }

    // Verificar PIN
    const pinHash = hashPin(pin);
    if (pinHash !== security.pin_hash) {
      return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
    }

    // Crear/actualizar sesión (válida por 24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await supabase
      .from("admin_sessions")
      .upsert({
        user_id: user.id,
        ip_address: clientIP,
        verified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: "user_id,ip_address"
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error verificando PIN:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

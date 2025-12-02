import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServiceClient } from "@/lib/supabaseServer";
import crypto from "crypto";

const COOKIE_NAME = "faktugo_admin_session";
const SESSION_DURATION_HOURS = 24;

// Hash SHA256 para el PIN
function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

// Generar token de sesión
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// GET: Verificar si tiene sesión de admin válida
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ valid: false, reason: "no_session" });
    }

    const supabase = getSupabaseServiceClient();

    // Buscar sesión válida
    const { data: session } = await supabase
      .from("admin_sessions")
      .select(`
        *,
        admin_users (
          id,
          email,
          name,
          role,
          permissions,
          is_active
        )
      `)
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!session || !session.admin_users) {
      return NextResponse.json({ valid: false, reason: "invalid_session" });
    }

    const adminUser = session.admin_users as any;

    if (!adminUser.is_active) {
      return NextResponse.json({ valid: false, reason: "account_disabled" });
    }

    return NextResponse.json({
      valid: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        permissions: adminUser.permissions,
      },
    });
  } catch (error: any) {
    console.error("Error verificando admin auth:", error);
    return NextResponse.json({ valid: false, reason: "error" }, { status: 500 });
  }
}

// POST: Login con email + PIN
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, pin } = body;

    if (!email || !pin) {
      return NextResponse.json(
        { error: "Email y PIN son obligatorios" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Buscar admin por email
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verificar PIN
    const pinHash = hashPin(pin);
    if (pinHash !== adminUser.pin_hash) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Crear sesión
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    // Eliminar sesiones anteriores del mismo admin
    await supabase
      .from("admin_sessions")
      .delete()
      .eq("admin_user_id", adminUser.id);

    // Crear nueva sesión
    await supabase.from("admin_sessions").insert({
      admin_user_id: adminUser.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

    // Actualizar last_login_at
    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", adminUser.id);

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        role: adminUser.role,
        permissions: adminUser.permissions,
      },
    });

    // Establecer cookie de sesión
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error: any) {
    console.error("Error en login admin:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE: Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value;

    if (sessionToken) {
      const supabase = getSupabaseServiceClient();
      await supabase
        .from("admin_sessions")
        .delete()
        .eq("session_token", sessionToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("Error en logout admin:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

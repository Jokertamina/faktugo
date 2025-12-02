import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServiceClient } from "@/lib/supabaseServer";
import crypto from "crypto";

const COOKIE_NAME = "faktugo_admin_session";

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

// Verificar admin con permiso de gestionar admins
async function verifyAdminWithPermission() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const supabase = getSupabaseServiceClient();

  const { data: session } = await supabase
    .from("admin_sessions")
    .select(`
      admin_users (
        id,
        role,
        permissions
      )
    `)
    .eq("session_token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!session?.admin_users) return null;

  const admin = session.admin_users as any;
  
  // Solo super_admin puede gestionar admins
  if (admin.role !== "super_admin" && !admin.permissions?.admins) {
    return null;
  }

  return { admin, supabase };
}

// GET: Listar admins
export async function GET() {
  try {
    const auth = await verifyAdminWithPermission();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data, error } = await auth.supabase
      .from("admin_users")
      .select("id, email, name, role, permissions, is_active, created_at, last_login_at")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ admins: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear nuevo admin
export async function POST(request: Request) {
  try {
    const auth = await verifyAdminWithPermission();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, pin, role, permissions } = body;

    if (!email || !name || !pin) {
      return NextResponse.json(
        { error: "Email, nombre y PIN son obligatorios" },
        { status: 400 }
      );
    }

    if (pin.length < 4) {
      return NextResponse.json(
        { error: "El PIN debe tener al menos 4 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que el email no existe
    const { data: existing } = await auth.supabase
      .from("admin_users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un admin con ese email" },
        { status: 400 }
      );
    }

    const defaultPermissions = {
      dashboard: true,
      users: false,
      plans: false,
      tickets: true,
      security: false,
      admins: false,
    };

    const { data, error } = await auth.supabase
      .from("admin_users")
      .insert({
        email: email.toLowerCase().trim(),
        name,
        pin_hash: hashPin(pin),
        role: role || "support",
        permissions: permissions || defaultPermissions,
        created_by: auth.admin.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ admin: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar admin
export async function PUT(request: Request) {
  try {
    const auth = await verifyAdminWithPermission();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const dbUpdates: Record<string, any> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions;
    if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
    
    // Si se proporciona nuevo PIN
    if (updates.newPin) {
      if (updates.newPin.length < 4) {
        return NextResponse.json(
          { error: "El PIN debe tener al menos 4 caracteres" },
          { status: 400 }
        );
      }
      dbUpdates.pin_hash = hashPin(updates.newPin);
      
      // Invalidar sesiones del admin
      await auth.supabase
        .from("admin_sessions")
        .delete()
        .eq("admin_user_id", id);
    }

    const { data, error } = await auth.supabase
      .from("admin_users")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ admin: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar admin
export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdminWithPermission();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // No permitir eliminar al propio usuario
    if (id === auth.admin.id) {
      return NextResponse.json(
        { error: "No puedes eliminarte a ti mismo" },
        { status: 400 }
      );
    }

    // Eliminar sesiones primero
    await auth.supabase
      .from("admin_sessions")
      .delete()
      .eq("admin_user_id", id);

    // Eliminar admin
    const { error } = await auth.supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Hash PIN con SHA256
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("faktugo_admin_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar sesión
    const { data: session } = await supabase
      .from("admin_sessions")
      .select("admin_id")
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const { currentPin, newPin } = await request.json();

    if (!currentPin || !newPin) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (newPin.length < 4) {
      return NextResponse.json(
        { error: "El PIN debe tener al menos 4 caracteres" },
        { status: 400 }
      );
    }

    // Obtener admin actual
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id, pin_hash")
      .eq("id", session.admin_id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });
    }

    // Verificar PIN actual
    const currentPinHash = await hashPin(currentPin);
    if (currentPinHash !== admin.pin_hash) {
      return NextResponse.json({ error: "PIN actual incorrecto" }, { status: 400 });
    }

    // Actualizar PIN
    const newPinHash = await hashPin(newPin);
    const { error: updateError } = await supabase
      .from("admin_users")
      .update({ pin_hash: newPinHash })
      .eq("id", admin.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Error actualizando PIN" },
        { status: 500 }
      );
    }

    // Invalidar otras sesiones (excepto la actual)
    await supabase
      .from("admin_sessions")
      .delete()
      .eq("admin_id", admin.id)
      .neq("session_token", sessionToken);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

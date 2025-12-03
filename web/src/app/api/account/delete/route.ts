import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabaseServer";

export async function DELETE() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que no tiene suscripción activa
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (subscription) {
      return NextResponse.json(
        { error: "No puedes eliminar tu cuenta mientras tengas una suscripción activa. Cancela tu suscripción primero." },
        { status: 400 }
      );
    }

    const serviceClient = getSupabaseServiceClient();

    // Eliminar archivos de facturas del storage
    const { data: userInvoices, error: invoicesError } = await serviceClient
      .from("invoices")
      .select("file_path")
      .eq("user_id", user.id);

    if (invoicesError) {
      console.error("No se pudieron obtener las facturas antes de eliminar cuenta:", invoicesError);
    } else if (userInvoices && userInvoices.length > 0) {
      const paths = userInvoices
        .map((inv: any) => inv.file_path as string | null)
        .filter((p): p is string => !!p);

      if (paths.length > 0) {
        const { error: storageError } = await serviceClient.storage.from("invoices").remove(paths);
        if (storageError) {
          console.error("No se pudieron eliminar archivos de invoices storage al borrar cuenta:", storageError);
        }
      }
    }

    // Eliminar facturas del usuario
    await serviceClient
      .from("invoices")
      .delete()
      .eq("user_id", user.id);

    // Eliminar perfil
    await serviceClient
      .from("profiles")
      .delete()
      .eq("id", user.id);

    // Eliminar suscripciones inactivas/canceladas
    await serviceClient
      .from("subscriptions")
      .delete()
      .eq("user_id", user.id);

    // Eliminar el usuario de auth
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error eliminando usuario:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar la cuenta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Cuenta eliminada correctamente" });
  } catch (error: any) {
    console.error("Error eliminando cuenta:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar la cuenta" },
      { status: 500 }
    );
  }
}

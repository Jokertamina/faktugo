import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const invoiceId = body?.invoiceId as string | undefined;

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId es obligatorio" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("gestoria_email,first_name,last_name,display_name")
      .eq("id", user.id)
      .maybeSingle<{
        gestoria_email: string | null;
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
      }>();

    if (profileError) {
      console.error("Error al obtener perfil para envio a gestoria:", profileError);
    }

    const gestoriaEmail = profile?.gestoria_email ?? null;
    const first = (profile?.first_name ?? "").trim();
    const last = (profile?.last_name ?? "").trim();
    const combined = `${first} ${last}`.trim();
    const clientDisplayName = combined || profile?.display_name || user.email || "Tu cliente";

    if (!gestoriaEmail) {
      return NextResponse.json(
        { error: "Configura primero el email de tu gestoria en el panel." },
        { status: 400 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, date, supplier, category, amount, file_path, file_name_original")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (invoiceError) {
      console.error("Error al obtener factura para envio a gestoria:", invoiceError);
      return NextResponse.json(
        { error: "No se pudo cargar la factura para el envio." },
        { status: 500 }
      );
    }

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    if (!invoice.file_path) {
      return NextResponse.json(
        { error: "La factura no tiene documento adjunto para enviar a la gestoria." },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.GESTORIA_FROM_EMAIL;

    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        {
          error:
            "Falta configurar RESEND_API_KEY y/o GESTORIA_FROM_EMAIL en el backend para poder enviar correos reales.",
        },
        { status: 500 }
      );
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from("invoices")
      .createSignedUrl(invoice.file_path, 60 * 60 * 24 * 7); // 7 dias

    if (signedError || !signed?.signedUrl) {
      console.error("No se pudo crear URL firmada para envio a gestoria:", signedError);
      return NextResponse.json(
        { error: "No se pudo generar el enlace al documento para el envio." },
        { status: 500 }
      );
    }

    const fileUrl = signed.signedUrl;

    const subject = `Factura ${invoice.supplier || "sin proveedor"} - ${clientDisplayName} - ${invoice.date}`;
    const html = `
      <p>Hola,</p>
      <p>
        Su cliente <strong>${clientDisplayName}</strong>
        (${user.email ?? ""}) ha compartido la siguiente factura a través de
        <strong>FaktuGo</strong>, su sistema de gestión y archivo de facturas.
      </p>
      <ul>
        <li><strong>Proveedor:</strong> ${invoice.supplier}</li>
        <li><strong>Fecha:</strong> ${invoice.date}</li>
        <li><strong>Categoría:</strong> ${invoice.category}</li>
        <li><strong>Importe:</strong> ${invoice.amount}</li>
      </ul>
      <p>Encontrará la factura adjunta en este mismo correo como archivo.</p>
      <p>
        Si tiene cualquier duda sobre el contenido de la factura, por favor contacte
        directamente con su cliente en ${user.email ?? ""}.
      </p>
      <p>
        Este mensaje ha sido generado automáticamente por <strong>FaktuGo</strong> en nombre
        de su cliente para facilitar el envío y archivo de facturas.
      </p>
    `;

    const text = `Su cliente ${clientDisplayName} (${user.email ?? ""}) ha compartido una factura de ${invoice.supplier} (${invoice.date}) por ${invoice.amount}. La factura se adjunta en este correo.`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: gestoriaEmail,
        reply_to: user.email ?? undefined,
        subject,
        html,
        text,
        attachments: [
          {
            path: fileUrl,
            filename: invoice.file_name_original || `factura-${invoice.id}.pdf`,
          },
        ],
      }),
    });

    const emailJson = await emailResponse.json().catch(() => ({}));

    if (!emailResponse.ok) {
      console.error("Error al enviar email a la gestoria:", emailResponse.status, emailJson);
      return NextResponse.json(
        { error: "El proveedor de correo rechazo el envio a la gestoria." },
        { status: 502 }
      );
    }

    const messageId = (emailJson as any)?.id ?? null;
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        sent_to_gestoria_at: now,
        sent_to_gestoria_status: "sent",
        sent_to_gestoria_message_id: messageId,
      })
      .eq("id", invoice.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error al actualizar estado de envio a gestoria:", updateError);
      return NextResponse.json(
        {
          error:
            "El correo se ha enviado a la gestoria, pero no se pudo actualizar el estado de la factura.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, messageId });
  } catch (e) {
    console.error("Error inesperado en /api/gestoria/send:", e);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

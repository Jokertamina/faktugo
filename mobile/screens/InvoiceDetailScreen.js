import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Linking } from "react-native";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";

function getOriginLabel(uploadSource) {
  if (uploadSource === "email_ingest") return "Recibida por correo";
  if (uploadSource === "mobile_upload") return "Escaneada desde el móvil";
  if (uploadSource === "web_upload") return "Subida desde la web";
  return "Origen desconocido";
}

export default function InvoiceDetailScreen({ navigation, route, invoices }) {
  const { invoiceId } = route.params || {};
  const invoice = invoices.find((item) => item.id === invoiceId);
  const [fileUrl, setFileUrl] = useState(null);

  if (!invoice) {
    return (
      <View style={styles.container}>
        <View style={styles.invoicesHeaderRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.invoicesHeaderTitle}>Detalle de factura</Text>
          <View style={{ width: 60 }} />
        </View>
        <Text style={{ color: "#E5E7EB", fontSize: 14 }}>
          No se encontro la factura seleccionada.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function loadFileUrl() {
      if (!invoice || !invoice.file_path) return;

      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        const { data, error } = await supabase.storage
          .from("invoices")
          .createSignedUrl(invoice.file_path, 60 * 60);
        if (!isMounted) return;
        if (!error && data?.signedUrl) {
          setFileUrl(data.signedUrl);
        }
      } catch (e) {
        console.warn("Error al obtener URL firmada de factura en movil:", e);
      }
    }

    loadFileUrl();

    return () => {
      isMounted = false;
    };
  }, [invoice?.file_path]);

  const usoLabel = invoice.archival_only
    ? "Solo almacenada (ya enviada por otro canal)"
    : "Factura para gestionar con tu gestoria";

  let envioGestoriaLabel = "No enviada a la gestoria";
  if (invoice.sent_to_gestoria_status === "sent") {
    if (invoice.sent_to_gestoria_at) {
      try {
        const sentDate = new Date(invoice.sent_to_gestoria_at);
        const formatted = sentDate.toLocaleString("es-ES", {
          dateStyle: "short",
          timeStyle: "short",
        });
        envioGestoriaLabel = `Enviada a la gestoria el ${formatted}`;
      } catch {
        envioGestoriaLabel = "Enviada a la gestoria";
      }
    } else {
      envioGestoriaLabel = "Enviada a la gestoria";
    }
  } else if (invoice.sent_to_gestoria_status === "failed") {
    envioGestoriaLabel = "Envio a la gestoria fallido";
  } else if (invoice.sent_to_gestoria_status === "pending") {
    envioGestoriaLabel = "Envio a la gestoria pendiente";
  }

  const origenLabel = getOriginLabel(invoice.upload_source);

  return (
    <View style={styles.container}>
      <View style={styles.invoicesHeaderRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.invoicesHeaderTitle}>Detalle de factura</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailHeaderRow}>
          <View>
            <Text style={styles.invoiceSupplier}>{invoice.supplier}</Text>
            <Text style={styles.invoiceMeta}>
              {invoice.date} · {invoice.category}
            </Text>
          </View>
          <Text style={styles.invoiceAmount}>{invoice.amount}</Text>
        </View>

        <View style={{ marginTop: 4 }}>
          <Text style={[styles.invoiceMeta, { marginTop: 0 }]}>Uso en FaktuGo: {usoLabel}</Text>
          <Text style={[styles.invoiceMeta, { marginTop: 2 }]}>
            Envio a gestoria: {envioGestoriaLabel}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
            <Text style={styles.invoiceMeta}>Origen:</Text>
            {(() => {
              const badgeStyles = [styles.originBadge];
              if (invoice.upload_source === "email_ingest") {
                badgeStyles.push(styles.originBadgeEmail);
              } else if (invoice.upload_source === "mobile_upload") {
                badgeStyles.push(styles.originBadgeMobile);
              } else if (invoice.upload_source === "web_upload") {
                badgeStyles.push(styles.originBadgeWeb);
              }
              return <Text style={badgeStyles}>{origenLabel}</Text>;
            })()}
          </View>
        </View>

        {invoice.imageUri ? (
          <Image
            source={{ uri: invoice.imageUri }}
            style={styles.detailImage}
            resizeMode="cover"
          />
        ) : fileUrl && invoice.file_mime_type?.startsWith("image/") ? (
          <Image
            source={{ uri: fileUrl }}
            style={styles.detailImage}
            resizeMode="cover"
          />
        ) : fileUrl ? (
          <TouchableOpacity
            style={[styles.scanButton, { marginTop: 12 }]}
            onPress={() => {
              if (fileUrl) {
                Linking.openURL(fileUrl).catch((e) => {
                  console.warn("No se pudo abrir el documento de la factura:", e);
                });
              }
            }}
          >
            <Text style={styles.scanButtonText}>Ver documento</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.detailHint}>
          Aqui puedes ver el documento original y el estado de envio a tu gestoria. En el futuro
          se añadiran notas internas y datos extraidos automaticamente.
        </Text>
      </View>
    </View>
  );
}

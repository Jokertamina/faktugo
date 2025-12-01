import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Linking, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";

function getOriginInfo(uploadSource) {
  if (uploadSource === "email_ingest") return { label: "Correo", icon: "mail", color: "#6EE7B7", bg: "rgba(16,185,129,0.15)" };
  if (uploadSource === "mobile_upload") return { label: "Móvil", icon: "phone-portrait", color: "#7DD3FC", bg: "rgba(56,189,248,0.15)" };
  if (uploadSource === "web_upload") return { label: "Web", icon: "globe", color: "#A5B4FC", bg: "rgba(129,140,248,0.15)" };
  return { label: "Desconocido", icon: "help-circle", color: "#9CA3AF", bg: "rgba(107,114,128,0.15)" };
}

export default function InvoiceDetailScreen({ navigation, route, invoices }) {
  const { invoiceId } = route.params || {};
  const invoice = invoices.find((item) => item.id === invoiceId);
  const [fileUrl, setFileUrl] = useState(null);

  if (!invoice) {
    return (
      <View style={{ flex: 1, backgroundColor: "#050816", paddingHorizontal: 20, paddingTop: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
        >
          <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
          <Text style={{ color: "#9CA3AF", fontSize: 14, marginLeft: 8 }}>Volver</Text>
        </TouchableOpacity>
        <View style={{
          backgroundColor: "#0F172A",
          borderRadius: 16,
          padding: 32,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#1E293B",
        }}>
          <Ionicons name="document-outline" size={40} color="#374151" />
          <Text style={{ color: "#6B7280", fontSize: 14, marginTop: 12, textAlign: "center" }}>
            No se encontró la factura seleccionada.
          </Text>
        </View>
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

  const originInfo = getOriginInfo(invoice.upload_source);

  // Status info
  let statusInfo = { label: "Pendiente", icon: "time-outline", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" };
  if (invoice.status === "Enviada") {
    statusInfo = { label: "Enviada", icon: "checkmark-circle", color: "#22CC88", bg: "rgba(34,204,136,0.15)" };
  } else if (invoice.status === "Archivada") {
    statusInfo = { label: "Archivada", icon: "archive", color: "#A78BFA", bg: "rgba(167,139,250,0.15)" };
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#050816" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
        >
          <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
          <Text style={{ color: "#9CA3AF", fontSize: 14, marginLeft: 8 }}>Volver</Text>
        </TouchableOpacity>

        {/* Main Card */}
        <View style={{
          backgroundColor: "#0F172A",
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: "#1E293B",
          marginBottom: 16,
        }}>
          {/* Status Badge */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: statusInfo.bg,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
              <Text style={{ color: statusInfo.color, fontSize: 12, fontWeight: "600", marginLeft: 6 }}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* Supplier & Amount */}
          <Text style={{ color: "#F9FAFB", fontSize: 20, fontWeight: "700", marginBottom: 4 }}>
            {invoice.supplier}
          </Text>
          <Text style={{ color: "#22CC88", fontSize: 28, fontWeight: "700", marginBottom: 12 }}>
            {invoice.amount}
          </Text>

          {/* Details Grid */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={{ color: "#6B7280", fontSize: 13, marginLeft: 10 }}>Fecha</Text>
              <Text style={{ color: "#E5E7EB", fontSize: 13, marginLeft: "auto" }}>{invoice.date}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
              <Text style={{ color: "#6B7280", fontSize: 13, marginLeft: 10 }}>Categoría</Text>
              <Text style={{ color: "#E5E7EB", fontSize: 13, marginLeft: "auto", flex: 1, textAlign: "right" }} numberOfLines={1}>
                {invoice.category?.split(" - ")[0] || "Sin categoría"}
              </Text>
            </View>
            {invoice.invoice_number && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                <Text style={{ color: "#6B7280", fontSize: 13, marginLeft: 10 }}>Nº Factura</Text>
                <Text style={{ color: "#E5E7EB", fontSize: 13, marginLeft: "auto" }}>{invoice.invoice_number}</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name={originInfo.icon} size={16} color={originInfo.color} />
              <Text style={{ color: "#6B7280", fontSize: 13, marginLeft: 10 }}>Origen</Text>
              <View style={{ marginLeft: "auto", backgroundColor: originInfo.bg, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: originInfo.color, fontSize: 11, fontWeight: "500" }}>{originInfo.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gestoria Status Card */}
        <View style={{
          backgroundColor: "#0F172A",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "#1E293B",
          marginBottom: 16,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons name="business-outline" size={18} color="#6B7280" />
            <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginLeft: 8 }}>Gestoría</Text>
          </View>
          <Text style={{ color: "#9CA3AF", fontSize: 13 }}>{envioGestoriaLabel}</Text>
        </View>

        {/* Document Preview */}
        {(invoice.imageUri || fileUrl) && (
          <View style={{
            backgroundColor: "#0F172A",
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#1E293B",
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1E293B" }}>
              <Ionicons name="image-outline" size={18} color="#6B7280" />
              <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginLeft: 8 }}>Documento</Text>
            </View>
            
            {invoice.imageUri ? (
              <Image
                source={{ uri: invoice.imageUri }}
                style={{ width: "100%", height: 250 }}
                resizeMode="cover"
              />
            ) : fileUrl && invoice.file_mime_type?.startsWith("image/") ? (
              <Image
                source={{ uri: fileUrl }}
                style={{ width: "100%", height: 250 }}
                resizeMode="cover"
              />
            ) : fileUrl ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(fileUrl).catch(() => {})}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 32,
                }}
              >
                <Ionicons name="document-outline" size={32} color="#3B82F6" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: "#3B82F6", fontSize: 14, fontWeight: "600" }}>Abrir documento</Text>
                  <Text style={{ color: "#6B7280", fontSize: 11 }}>PDF</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

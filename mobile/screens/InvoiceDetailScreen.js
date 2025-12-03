import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Linking, ScrollView, Alert, ActivityIndicator, TextInput, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";
import { API_BASE_URL } from "../config";

function getOriginInfo(uploadSource) {
  if (uploadSource === "email_ingest") return { label: "Correo", icon: "mail", color: "#6EE7B7", bg: "rgba(16,185,129,0.15)" };
  if (uploadSource === "mobile_upload") return { label: "Móvil", icon: "phone-portrait", color: "#7DD3FC", bg: "rgba(56,189,248,0.15)" };
  if (uploadSource === "web_upload") return { label: "Web", icon: "globe", color: "#A5B4FC", bg: "rgba(129,140,248,0.15)" };
  return { label: "Desconocido", icon: "help-circle", color: "#9CA3AF", bg: "rgba(107,114,128,0.15)" };
}

export default function InvoiceDetailScreen({ navigation, route, invoices, onRefresh }) {
  const { invoiceId } = route.params || {};
  const invoice = invoices.find((item) => item.id === invoiceId);
  const [fileUrl, setFileUrl] = useState(null);
  const [sendingToGestoria, setSendingToGestoria] = useState(false);
  const [gestoriaStatus, setGestoriaStatus] = useState(invoice?.sent_to_gestoria_status || null);
  const [deleting, setDeleting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDate, setEditDate] = useState(invoice?.date || "");
  const [editSupplier, setEditSupplier] = useState(invoice?.supplier || "");
  const [editCategory, setEditCategory] = useState(invoice?.category || "");
  const [editAmount, setEditAmount] = useState(invoice?.amount || "");

  const handleSaveEdit = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        Alert.alert("Error", "No se pudo obtener la sesión.");
        setSaving(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: invoice.id,
          date: editDate,
          supplier: editSupplier,
          category: editCategory,
          amount: editAmount,
        }),
      });

      if (res.status === 401) {
        console.warn("InvoiceDetailScreen: 401 en PATCH /api/invoices, cerrando sesión.");
        await supabase.auth.signOut({ scope: "local" });
        Alert.alert("Sesión caducada", "Vuelve a iniciar sesión para editar facturas.");
        setSaving(false);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert("Error", data?.error || "No se pudieron guardar los cambios.");
        setSaving(false);
        return;
      }

      setEditModalVisible(false);
      Alert.alert("Guardado", "Los cambios se han guardado correctamente.");
      if (onRefresh) onRefresh();
    } catch (e) {
      console.warn("Error al guardar cambios:", e);
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar factura",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const supabase = getSupabaseClient();
            if (!supabase) return;

            setDeleting(true);
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              const accessToken = sessionData?.session?.access_token;

              if (!accessToken) {
                Alert.alert("Error", "No se pudo obtener la sesión.");
                setDeleting(false);
                return;
              }

              const res = await fetch(`${API_BASE_URL}/api/invoices?id=${invoice.id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (res.status === 401) {
                console.warn("InvoiceDetailScreen: 401 en DELETE /api/invoices, cerrando sesión.");
                await supabase.auth.signOut({ scope: "local" });
                Alert.alert("Sesión caducada", "Vuelve a iniciar sesión para eliminar facturas.");
                setDeleting(false);
                return;
              }

              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                Alert.alert("Error", data?.error || "No se pudo eliminar la factura.");
                setDeleting(false);
                return;
              }

              if (onRefresh) onRefresh();
              navigation.goBack();
            } catch (e) {
              console.warn("Error al eliminar factura:", e);
              Alert.alert("Error", "No se pudo eliminar la factura.");
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSendToGestoria = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSendingToGestoria(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        Alert.alert("Error", "No se pudo obtener la sesión.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/gestoria/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      if (res.status === 401) {
        console.warn("InvoiceDetailScreen: 401 en /api/gestoria/send, cerrando sesión.");
        await supabase.auth.signOut({ scope: "local" });
        Alert.alert("Sesión caducada", "Vuelve a iniciar sesión para enviar facturas a la gestoría.");
        setSendingToGestoria(false);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert("Error", data?.error || "No se pudo enviar la factura.");
        return;
      }

      setGestoriaStatus("sent");
      Alert.alert("Enviada", "La factura se ha enviado a tu gestoría.");
      if (onRefresh) onRefresh();
    } catch (e) {
      console.warn("Error al enviar a gestoría:", e);
      Alert.alert("Error", "No se pudo enviar la factura a la gestoría.");
    } finally {
      setSendingToGestoria(false);
    }
  };

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

  const currentGestoriaStatus = gestoriaStatus || invoice.sent_to_gestoria_status;
  let envioGestoriaLabel = "No enviada a la gestoría";
  let canSendToGestoria = true;
  
  if (currentGestoriaStatus === "sent") {
    if (invoice.sent_to_gestoria_at) {
      try {
        const sentDate = new Date(invoice.sent_to_gestoria_at);
        const formatted = sentDate.toLocaleString("es-ES", {
          dateStyle: "short",
          timeStyle: "short",
        });
        envioGestoriaLabel = `Enviada a la gestoría el ${formatted}`;
      } catch {
        envioGestoriaLabel = "Enviada a la gestoría";
      }
    } else {
      envioGestoriaLabel = "Enviada a la gestoría";
    }
    canSendToGestoria = true; // Permitir reenvío
  } else if (currentGestoriaStatus === "failed") {
    envioGestoriaLabel = "Envío a la gestoría fallido";
  } else if (currentGestoriaStatus === "pending") {
    envioGestoriaLabel = "Envío a la gestoría pendiente";
    canSendToGestoria = false;
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
            {invoice.category?.includes(" - ") && (
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Ionicons name="reader-outline" size={16} color="#6B7280" style={{ marginTop: 2 }} />
                <Text style={{ color: "#6B7280", fontSize: 13, marginLeft: 10 }}>Concepto</Text>
                <Text style={{ color: "#E5E7EB", fontSize: 13, marginLeft: "auto", flex: 1, textAlign: "right" }} numberOfLines={2}>
                  {invoice.category.split(" - ").slice(1).join(" - ")}
                </Text>
              </View>
            )}
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

          {/* Edit Button */}
          <TouchableOpacity
            onPress={() => setEditModalVisible(true)}
            style={{
              marginTop: 16,
              backgroundColor: "#1E293B",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="create-outline" size={16} color="#E5E7EB" />
            <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "500" }}>Editar datos</Text>
          </TouchableOpacity>
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
          <Text style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 12 }}>{envioGestoriaLabel}</Text>
          
          {canSendToGestoria && !invoice.archival_only && (
            <TouchableOpacity
              onPress={handleSendToGestoria}
              disabled={sendingToGestoria}
              style={{
                backgroundColor: "#22CC88",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: sendingToGestoria ? 0.7 : 1,
              }}
            >
              {sendingToGestoria ? (
                <ActivityIndicator size="small" color="#022c22" />
              ) : (
                <Ionicons name="send" size={16} color="#022c22" />
              )}
              <Text style={{ color: "#022c22", fontSize: 14, fontWeight: "600" }}>
                {sendingToGestoria 
                  ? "Enviando..." 
                  : currentGestoriaStatus === "sent" 
                    ? "Reenviar a gestoría" 
                    : "Enviar a gestoría"}
              </Text>
            </TouchableOpacity>
          )}
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

        {/* Danger Zone */}
        <View style={{
          backgroundColor: "rgba(127,29,29,0.2)",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "rgba(239,68,68,0.3)",
          marginBottom: 16,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontSize: 14, fontWeight: "600", marginLeft: 8 }}>Zona de peligro</Text>
          </View>
          <Text style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 12 }}>
            Eliminar esta factura borrará permanentemente el registro y el documento asociado.
          </Text>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            style={{
              backgroundColor: "rgba(239,68,68,0.15)",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.3)",
            }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            )}
            <Text style={{ color: "#EF4444", fontSize: 14, fontWeight: "500" }}>
              {deleting ? "Eliminando..." : "Eliminar factura"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "flex-end",
        }}>
          <View style={{
            backgroundColor: "#0F172A",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 40,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ color: "#F9FAFB", fontSize: 18, fontWeight: "700" }}>Editar factura</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 6 }}>Fecha (YYYY-MM-DD)</Text>
                <TextInput
                  value={editDate}
                  onChangeText={setEditDate}
                  style={{
                    backgroundColor: "#1E293B",
                    borderRadius: 12,
                    padding: 14,
                    color: "#F9FAFB",
                    fontSize: 15,
                  }}
                  placeholderTextColor="#6B7280"
                  placeholder="2024-01-15"
                />
              </View>

              <View>
                <Text style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 6 }}>Proveedor</Text>
                <TextInput
                  value={editSupplier}
                  onChangeText={setEditSupplier}
                  style={{
                    backgroundColor: "#1E293B",
                    borderRadius: 12,
                    padding: 14,
                    color: "#F9FAFB",
                    fontSize: 15,
                  }}
                  placeholderTextColor="#6B7280"
                  placeholder="Nombre del proveedor"
                />
              </View>

              <View>
                <Text style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 6 }}>Categoría</Text>
                <TextInput
                  value={editCategory}
                  onChangeText={setEditCategory}
                  style={{
                    backgroundColor: "#1E293B",
                    borderRadius: 12,
                    padding: 14,
                    color: "#F9FAFB",
                    fontSize: 15,
                  }}
                  placeholderTextColor="#6B7280"
                  placeholder="Categoría"
                />
              </View>

              <View>
                <Text style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 6 }}>Importe</Text>
                <TextInput
                  value={editAmount}
                  onChangeText={setEditAmount}
                  style={{
                    backgroundColor: "#1E293B",
                    borderRadius: 12,
                    padding: 14,
                    color: "#F9FAFB",
                    fontSize: 15,
                  }}
                  placeholderTextColor="#6B7280"
                  placeholder="123.45 EUR"
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#1E293B",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#E5E7EB", fontSize: 15, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: "#22CC88",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#022c22" />
                ) : (
                  <Text style={{ color: "#022c22", fontSize: 15, fontWeight: "600" }}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

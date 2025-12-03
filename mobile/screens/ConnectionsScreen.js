import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Clipboard, Alert, ActivityIndicator, Modal, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://faktugo.com";

export default function ConnectionsScreen({ invoices = [], onRefresh }) {
  const [email, setEmail] = useState(null);
  const [emailAlias, setEmailAlias] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sendingBatch, setSendingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ sent: 0, total: 0 });
  const [canUseEmailIngestion, setCanUseEmailIngestion] = useState(null);
  const [emailIngestionReason, setEmailIngestionReason] = useState(null);
  const [hasGestoriaEmail, setHasGestoriaEmail] = useState(false);
  const [batchScope, setBatchScope] = useState("month"); // "month" | "all"
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);

  const featureDisabled = canUseEmailIngestion === false;

  const handleCopyEmail = () => {
    if (!emailAlias || featureDisabled) return;
    Clipboard.setString(emailAlias);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Refrescar facturas cuando la pestaña de Conexiones gana foco
  useFocusEffect(
    useCallback(() => {
      if (typeof onRefresh === "function") {
        onRefresh();
      }
    }, [onRefresh])
  );

  // Facturas pendientes candidatas para envío (independiente del mes)
  const basePending = Array.isArray(invoices)
    ? invoices.filter((inv) => {
        if (inv.status !== "Pendiente") return false;
        if (inv.archival_only) return false;
        if (inv.sent_to_gestoria_status === "sent") return false;
        return true;
      })
    : [];

  // Pendientes filtradas por mes actual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const pendingThisMonth = basePending.filter((inv) => {
    const invDate = new Date(inv.date);
    if (Number.isNaN(invDate.getTime())) return false;
    return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
  });

  const pendingAll = basePending;
  const scopeInvoices = batchScope === "month" ? pendingThisMonth : pendingAll;

  const handleSendBatch = () => {
    if (!hasGestoriaEmail) {
      Alert.alert(
        "Configura tu gestoria",
        "Configura primero el email de tu gestoria en la sección Cuenta para poder enviar paquetes."
      );
      return;
    }

    if (scopeInvoices.length === 0) {
      Alert.alert(
        "Sin facturas",
        batchScope === "month"
          ? "No hay facturas pendientes este mes para enviar."
          : "No hay facturas pendientes para enviar."
      );
      return;
    }

    // Por defecto seleccionamos todas las facturas en el ámbito actual
    setSelectedInvoiceIds(scopeInvoices.map((inv) => inv.id));
    setSelectionModalVisible(true);
  };

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAllInScope = () => {
    setSelectedInvoiceIds(scopeInvoices.map((inv) => inv.id));
  };

  const handleClearSelection = () => {
    setSelectedInvoiceIds([]);
  };

  const handleConfirmBatchSend = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const candidates = batchScope === "month" ? pendingThisMonth : pendingAll;
    const invoicesToSend = candidates.filter((inv) =>
      selectedInvoiceIds.includes(inv.id)
    );

    if (invoicesToSend.length === 0) {
      Alert.alert("Sin selección", "Selecciona al menos una factura para enviar.");
      return;
    }

    setSelectionModalVisible(false);
    setSendingBatch(true);
    setBatchProgress({ sent: 0, total: invoicesToSend.length });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        Alert.alert("Error", "No se pudo obtener la sesión.");
        setSendingBatch(false);
        return;
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const inv of invoicesToSend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/gestoria/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ invoiceId: inv.id }),
          });

          if (res.status === 401) {
            console.warn("ConnectionsScreen: 401 en envío masivo a gestoria, cerrando sesión.");
            await supabase.auth.signOut({ scope: "local" });
            Alert.alert("Sesión caducada", "Vuelve a iniciar sesión para enviar facturas a la gestoría.");
            setSendingBatch(false);
            return;
          }

          if (res.ok) {
            sentCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
        setBatchProgress({ sent: sentCount + failedCount, total: invoicesToSend.length });
      }

      setSendingBatch(false);

      if (failedCount === 0) {
        Alert.alert("Completado", `Se han enviado ${sentCount} facturas a tu gestoría.`);
      } else {
        Alert.alert(
          "Parcialmente completado",
          `Enviadas: ${sentCount}\nFallidas: ${failedCount}`
        );
      }

      if (onRefresh) onRefresh();
    } catch (e) {
      console.warn("Error en envío masivo:", e);
      Alert.alert("Error", "No se pudo completar el envío masivo.");
      setSendingBatch(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    async function loadUser() {
      if (!supabase) {
        setLoadingUser(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("No se pudo obtener el usuario en Conexiones:", error);
        }

        const user = data?.user ?? null;

        if (isMounted) {
          setEmail(user?.email ?? null);
        }

        // Cargar email_alias desde la API (tabla email_ingestion_aliases)
        if (user) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            
            if (accessToken) {
              const res = await fetch(`${API_BASE_URL}/api/email-alias`, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });
              
              if (res.status === 401) {
                console.warn(
                  "ConnectionsScreen: 401 en /api/email-alias, ocultando correo interno (sin cerrar sesión)."
                );
                return;
              }

              if (res.ok) {
                const aliasData = await res.json();
                if (!isMounted) return;

                setEmailAlias(aliasData.alias || null);

                if (typeof aliasData.hasGestoriaEmail === "boolean") {
                  setHasGestoriaEmail(aliasData.hasGestoriaEmail);
                } else {
                  setHasGestoriaEmail(false);
                }

                if (typeof aliasData.canUseEmailIngestion === "boolean") {
                  setCanUseEmailIngestion(aliasData.canUseEmailIngestion);
                } else {
                  setCanUseEmailIngestion(true);
                }

                setEmailIngestionReason(aliasData.emailIngestionReason || null);
              }
            }
          } catch (aliasError) {
            console.warn("No se pudo obtener el email_alias:", aliasError);
          }
        }

        if (isMounted) {
          setLoadingUser(false);
        }
      } catch (e) {
        console.warn("Error inesperado al cargar usuario/perfil en Conexiones:", e);
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 24 }}>
        <View style={styles.header}>
          <View style={{ marginRight: 12 }}>
            <Image
              source={require("../assets/icon.png")}
              style={{ width: 40, height: 40, borderRadius: 12 }}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.title}>Conexiones</Text>
            <Text style={styles.subtitle}>
              Activa fuentes automáticas (correo interno) y envía paquetes cerrados a tu gestoría.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Fuentes de documentos</Text>
          <Text style={styles.sectionDescription}>
            Aqui conectaras otras fuentes ademas de la camara del movil (Drive, correo...).
          </Text>

          <View style={{ backgroundColor: "#0B1220", borderRadius: 16, padding: 14, gap: 12 }}>
            <TouchableOpacity disabled style={{ opacity: 0.7 }}>
              <Text style={{ color: "#E5E7EB", fontSize: 13 }}>
                Conectar Google Drive (proximamente)
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                Sube carpetas de facturas desde tu unidad de Drive para procesarlas en bloque.
              </Text>
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: "#111827",
                marginVertical: 8,
              }}
            />

            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Ionicons name="mail-outline" size={16} color={emailAlias ? "#22CC88" : "#6B7280"} />
                <Text style={{ color: "#E5E7EB", fontSize: 13, marginLeft: 8, fontWeight: "500" }}>
                  Correo interno FaktuGo
                </Text>
                {emailAlias && !featureDisabled && (
                  <View style={{
                    backgroundColor: "#22CC8820",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                    marginLeft: 8,
                  }}>
                    <Text style={{ color: "#22CC88", fontSize: 10, fontWeight: "600" }}>ACTIVO</Text>
                  </View>
                )}
              </View>
              {loadingUser ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color="#6B7280" />
                  <Text style={{ color: "#6B7280", fontSize: 12 }}>Cargando...</Text>
                </View>
              ) : canUseEmailIngestion === true && (
                <Text style={{ color: "#22CC88", fontSize: 11, marginBottom: 4 }}>
                  Incluido en tu plan actual.
                </Text>
              )}
              {!loadingUser && featureDisabled ? (
                <Text style={{ color: "#FBBF24", fontSize: 12 }}>
                  {emailIngestionReason ||
                    "La recepción de facturas por correo (correo interno FaktuGo) no está disponible en tu plan gratuito. Actualiza a Básico o Pro para activar tu correo interno."}
                </Text>
              ) : !loadingUser && emailAlias ? (
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ color: "#22CC88", fontSize: 14, fontWeight: "600", flex: 1 }}>
                      {emailAlias}
                    </Text>
                    <TouchableOpacity
                      onPress={handleCopyEmail}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: copied ? "#22CC8820" : "#1E293B",
                      }}
                    >
                      <Ionicons
                        name={copied ? "checkmark" : "copy-outline"}
                        size={18}
                        color={copied ? "#22CC88" : "#9CA3AF"}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                    Reenvía facturas a este correo y se guardarán automáticamente en tu cuenta.
                  </Text>
                  {!hasGestoriaEmail && !featureDisabled && (
                    <Text style={{ color: "#FBBF24", fontSize: 11, marginTop: 4 }}>
                      Para que tu gestoria reciba paquetes o envíos automáticos, configura primero su email
                      en la sección Cuenta.
                    </Text>
                  )}
                </View>
              ) : !loadingUser && !featureDisabled && (
                <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                  Genera tu correo interno desde el panel web para recibir facturas automáticamente.
                  Lo verás aquí cuando esté listo.
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Acciones rapidas</Text>
          <Text style={styles.sectionDescription}>
            Envía en bloque tus facturas pendientes a tu gestoría (requiere correo activo y plan que lo permita).
          </Text>

          <View style={{ flexDirection: "row", marginTop: 8, marginBottom: 8, gap: 8 }}>
            {["month", "all"].map((mode) => {
              const active = batchScope === mode;
              const label = mode === "month" ? "Este mes" : "Todas pendientes";
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setBatchScope(mode)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? "#3B82F6" : "#1E293B",
                    backgroundColor: active ? "#1E3A5F" : "#0F172A",
                  }}
                >
                  <Ionicons
                    name={mode === "month" ? "calendar" : "layers-outline"}
                    size={12}
                    color={active ? "#60A5FA" : "#6B7280"}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ color: active ? "#60A5FA" : "#9CA3AF", fontSize: 11, fontWeight: "500" }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={{ color: "#6B7280", fontSize: 11, marginBottom: 8 }}>
            {batchScope === "month"
              ? `Pendientes este mes: ${pendingThisMonth.length}`
              : `Pendientes en total: ${pendingAll.length}`}
          </Text>

          <TouchableOpacity
            onPress={handleSendBatch}
            disabled={sendingBatch}
            style={{
              backgroundColor: scopeInvoices.length > 0 ? "#22CC88" : "#2A5FFF",
              borderRadius: 999,
              paddingVertical: 12,
              paddingHorizontal: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: sendingBatch ? 0.7 : 1,
              marginBottom: 12,
            }}
          >
            {sendingBatch ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                  Enviando {batchProgress.sent}/{batchProgress.total}...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={16} color={scopeInvoices.length > 0 ? "#022c22" : "#FFFFFF"} />
                <Text style={{ color: scopeInvoices.length > 0 ? "#022c22" : "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                  {scopeInvoices.length > 0
                    ? batchScope === "month"
                      ? `Enviar ${scopeInvoices.length} factura${scopeInvoices.length !== 1 ? "s" : ""} del mes actual`
                      : `Enviar ${scopeInvoices.length} factura${scopeInvoices.length !== 1 ? "s" : ""} pendientes`
                    : batchScope === "month"
                      ? "Sin facturas pendientes este mes"
                      : "Sin facturas pendientes"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {scopeInvoices.length === 0 && (
            <Text style={{ color: "#6B7280", fontSize: 11, textAlign: "center" }}>
              {batchScope === "month"
                ? "No hay facturas pendientes este mes. En cuanto subas nuevas, podrás enviarlas desde aquí."
                : "No hay facturas pendientes ahora mismo. Cuando subas o marques nuevas pendientes, podrás enviarlas desde aquí."}
            </Text>
          )}
        </View>

      </ScrollView>

      {selectionModalVisible && (
        <Modal
          visible={selectionModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectionModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.8)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                maxHeight: "70%",
                backgroundColor: "#020617",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "#F9FAFB", fontSize: 16, fontWeight: "700" }}>
                  Selecciona facturas a enviar
                </Text>
                <TouchableOpacity onPress={() => setSelectionModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Text style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 12 }}>
                {batchScope === "month"
                  ? "Mostrando facturas pendientes con fecha de este mes."
                  : "Mostrando todas las facturas pendientes sin enviar."}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginBottom: 8,
                  gap: 16,
                }}
              >
                <TouchableOpacity onPress={handleSelectAllInScope}>
                  <Text style={{ color: "#60A5FA", fontSize: 12, fontWeight: "500" }}>
                    Seleccionar todas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClearSelection}>
                  <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                    Vaciar selección
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 260 }}>
                {scopeInvoices.map((inv) => {
                  const selected = selectedInvoiceIds.includes(inv.id);
                  return (
                    <TouchableOpacity
                      key={inv.id}
                      onPress={() => toggleInvoiceSelection(inv.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: "#111827",
                      }}
                    >
                      <Ionicons
                        name={selected ? "checkbox" : "square-outline"}
                        size={18}
                        color={selected ? "#22CC88" : "#6B7280"}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ color: "#E5E7EB", fontSize: 13 }}
                          numberOfLines={1}
                        >
                          {(inv.supplier || "Sin proveedor") + " · " + (inv.amount || "0.00 EUR")}
                        </Text>
                        <Text style={{ color: "#6B7280", fontSize: 11 }}>
                          {inv.date} {inv.invoice_number ? `· Nº ${inv.invoice_number}` : ""}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {scopeInvoices.length === 0 && (
                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: 12,
                      textAlign: "center",
                      marginTop: 16,
                    }}
                  >
                    No hay facturas pendientes en este ámbito.
                  </Text>
                )}
              </ScrollView>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setSelectionModalVisible(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "#111827",
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#E5E7EB", fontSize: 13, fontWeight: "600" }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmBatchSend}
                  style={{
                    flex: 1,
                    backgroundColor: "#22CC88",
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: "center",
                    opacity: selectedInvoiceIds.length === 0 ? 0.6 : 1,
                  }}
                  disabled={selectedInvoiceIds.length === 0}
                >
                  <Text style={{ color: "#022c22", fontSize: 13, fontWeight: "600" }}>
                    Enviar seleccionadas ({selectedInvoiceIds.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

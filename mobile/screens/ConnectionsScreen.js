import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Clipboard, Alert, ActivityIndicator } from "react-native";
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

  const featureDisabled = canUseEmailIngestion === false;

  const handleCopyEmail = () => {
    if (!emailAlias || featureDisabled) return;
    Clipboard.setString(emailAlias);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Obtener facturas pendientes del mes actual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const pendingThisMonth = invoices.filter((inv) => {
    if (inv.status !== "Pendiente") return false;
    if (inv.archival_only) return false;
    if (inv.sent_to_gestoria_status === "sent") return false;
    
    const invDate = new Date(inv.date);
    return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
  });

  const handleSendBatch = async () => {
    if (pendingThisMonth.length === 0) {
      Alert.alert("Sin facturas", "No hay facturas pendientes de este mes para enviar.");
      return;
    }

    Alert.alert(
      "Enviar a gestoría",
      `¿Enviar ${pendingThisMonth.length} factura${pendingThisMonth.length !== 1 ? "s" : ""} pendiente${pendingThisMonth.length !== 1 ? "s" : ""} de este mes a tu gestoría?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: async () => {
            const supabase = getSupabaseClient();
            if (!supabase) return;

            setSendingBatch(true);
            setBatchProgress({ sent: 0, total: pendingThisMonth.length });

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

              for (const inv of pendingThisMonth) {
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
                setBatchProgress({ sent: sentCount + failedCount, total: pendingThisMonth.length });
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
          },
        },
      ]
    );
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
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>FG</Text>
          </View>
          <View>
            <Text style={styles.title}>Conexiones</Text>
            <Text style={styles.subtitle}>
              Configura aqui las integraciones con otras fuentes y atajos con tu gestoria.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Fuentes de documentos</Text>
          <Text style={styles.sectionDescription}>
            Aqui conectaras otras fuentes ademas de la camara del movil (Drive, correo,
            etc.).
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
              {!featureDisabled && (
                <Text style={{ color: "#22CC88", fontSize: 11, marginBottom: 4 }}>
                  Incluido en tu plan actual.
                </Text>
              )}
              {featureDisabled ? (
                <Text style={{ color: "#FBBF24", fontSize: 12 }}>
                  {emailIngestionReason ||
                    "La ingesta por email no está disponible en tu plan gratuito. Actualiza a Básico o Pro para activar tu correo interno."}
                </Text>
              ) : emailAlias ? (
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
                </View>
              ) : (
                <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                  Genera tu correo interno desde el panel web para recibir facturas automáticamente.
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Acciones rapidas</Text>
          <Text style={styles.sectionDescription}>
            Atajos que conectaran tu app con la gestoria.
          </Text>

          <TouchableOpacity
            onPress={handleSendBatch}
            disabled={sendingBatch}
            style={{
              backgroundColor: pendingThisMonth.length > 0 ? "#22CC88" : "#2A5FFF",
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
                <Ionicons name="send" size={16} color={pendingThisMonth.length > 0 ? "#022c22" : "#FFFFFF"} />
                <Text style={{ color: pendingThisMonth.length > 0 ? "#022c22" : "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                  {pendingThisMonth.length > 0
                    ? `Enviar ${pendingThisMonth.length} factura${pendingThisMonth.length !== 1 ? "s" : ""} del mes`
                    : "Sin facturas pendientes este mes"}
                </Text>
              </>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

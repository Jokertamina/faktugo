import React, { useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView, Dimensions, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";
import { buildInvoice } from "../domain/invoice";
import { computePeriodFromDate } from "../domain/period";
import { getSupabaseClient } from "../supabaseClient";
import { API_BASE_URL } from "../config";
import PlanUsageCard from "../components/PlanUsageCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function generateUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOriginLabel(uploadSource) {
  if (uploadSource === "email_ingest") return "Correo";
  if (uploadSource === "mobile_upload") return "Móvil";
  if (uploadSource === "web_upload") return "Web";
  return null;
}

function chooseInvoicePurpose(hasGestoriaEmail) {
  return new Promise((resolve) => {
    if (!hasGestoriaEmail) {
      Alert.alert(
        "No se puede enviar a la gestoria",
        "Aun no has configurado el email de tu gestoria en FaktuGo. Guardaremos la factura, pero no se enviara automaticamente.",
        [
          {
            text: "Continuar",
            onPress: () => resolve({ archivalOnly: false, sendToGestoria: false }),
          },
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => resolve(null),
          },
        ],
        { cancelable: false }
      );
      return;
    }

    Alert.alert(
      "¿Que quieres hacer con esta factura?",
      "Puedes almacenarla solo en FaktuGo o subirla y enviarla ahora a tu gestoria.",
      [
        {
          text: "Solo almacenarla",
          onPress: () => resolve({ archivalOnly: true, sendToGestoria: false }),
        },
        {
          text: "Subir y enviar a gestoria",
          onPress: () => resolve({ archivalOnly: false, sendToGestoria: true }),
        },
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => resolve(null),
        },
      ],
      { cancelable: false }
    );
  });
}

export default function HomeScreen({ navigation, invoices, setInvoices, refreshInvoices }) {
  useFocusEffect(
    useCallback(() => {
      if (typeof refreshInvoices === "function") {
        refreshInvoices();
      }
    }, [refreshInvoices])
  );
  const handleScanDemo = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn("Supabase no esta configurado en la app movil.");
      return;
    }

    if (!API_BASE_URL) {
      Alert.alert("Error de configuración", "No se ha configurado la URL del servidor.");
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.warn("No se pudo obtener el usuario de Supabase en movil:", userError);
      }
      const user = userData?.user;
      if (!user) {
        console.warn("No hay usuario autenticado en Supabase en el movil.");
        return;
      }

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn(
          "No se pudo obtener la sesion de Supabase para subir archivo desde movil:",
          sessionError
        );
        return;
      }

      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        console.warn("No se encontro access token de Supabase para subir archivo desde movil.");
        return;
      }

      let gestoriaEmail = null;
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("gestoria_email")
          .eq("id", user.id)
          .maybeSingle({
            head: false,
          });

        if (profileError) {
          console.warn(
            "Error al obtener perfil del usuario para comprobar gestoria_email en movil:",
            profileError
          );
        }

        if (profile && typeof profile.gestoria_email === "string") {
          const trimmed = profile.gestoria_email.trim();
          if (trimmed.length > 0) {
            gestoriaEmail = trimmed;
          }
        }
      } catch (profileCheckError) {
        console.warn(
          "Error inesperado al comprobar gestoria_email del usuario en movil:",
          profileCheckError
        );
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permiso de camara no concedido");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets && result.assets[0];
      if (!asset || !asset.uri) {
        console.warn("No se obtuvo ningun recurso de imagen desde la camara.");
        return;
      }

      const choice = await chooseInvoicePurpose(!!gestoriaEmail);
      if (!choice) {
        return;
      }

      const { archivalOnly, sendToGestoria } = choice;

      const now = new Date();
      const isoDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const id = generateUuid();
      const mime = asset.mimeType || "image/jpeg";
      let mode = "month";
      let rootFolder = "/FaktuGo";
      try {
        const storedMode = await AsyncStorage.getItem("faktugo_period_mode");
        const storedRoot = await AsyncStorage.getItem("faktugo_root_folder");
        if (storedMode === "week" || storedMode === "month") {
          mode = storedMode;
        }
        if (typeof storedRoot === "string" && storedRoot.trim().length > 0) {
          rootFolder = storedRoot.trim();
        }
      } catch (settingsError) {
        console.warn(
          "No se pudieron cargar los ajustes locales de periodo/carpeta en Home:",
          settingsError
        );
      }

      // Calcular folder_path para almacenamiento local
      const { folder_path } = computePeriodFromDate(isoDate, mode, rootFolder);

      const ext = (() => {
        const uri = asset.uri;
        const dotIndex = uri.lastIndexOf(".");
        if (dotIndex === -1) return "";
        return uri.slice(dotIndex).toLowerCase();
      })();
      const fileName = `${id}${ext}`;

      // Copiar la imagen a una carpeta propia bajo documentDirectory,
      // siguiendo folder_path (ej. /FaktuGo/2025-11) y usar esa ruta como imageUri.
      let localImageUri = asset.uri;
      try {
        const logicalFolder = folder_path || "/FaktuGo";
        const normalizedFolder = logicalFolder.replace(/^\//, ""); // FaktuGo/2025-11
        const localFolderUri = `${FileSystem.documentDirectory}${normalizedFolder}`;
        await FileSystem.makeDirectoryAsync(localFolderUri, { intermediates: true });

        const localFileName = `${id}${ext || ".jpg"}`;
        const localFileUri = `${localFolderUri}/${localFileName}`;

        await FileSystem.copyAsync({ from: asset.uri, to: localFileUri });

        // Intentamos borrar el fichero temporal original para no duplicar espacio.
        try {
          await FileSystem.deleteAsync(asset.uri, { idempotent: true });
        } catch {
          // Si falla el borrado no es critico; mantenemos la copia en localFileUri igualmente.
        }

        localImageUri = localFileUri;
      } catch (copyError) {
        console.warn("No se pudo copiar la factura a la carpeta local de FaktuGo:", copyError);
      }

      // =====================================================
      // Enviar al backend para validación con IA y guardado
      // =====================================================
      try {
        // Preparar FormData para enviar al backend
        const formData = new FormData();
        formData.append("files", {
          uri: localImageUri,
          type: mime,
          name: fileName,
        });
        formData.append("archivalOnly", archivalOnly ? "true" : "false");
        formData.append("sendToGestoria", sendToGestoria ? "true" : "false");
        formData.append("uploadSource", "mobile_upload");

        const uploadResponse = await fetch(`${API_BASE_URL}/api/invoices/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            // No poner Content-Type, fetch lo detecta automáticamente para FormData
          },
          body: formData,
        });

        if (uploadResponse.status === 401) {
          console.warn("HomeScreen: 401 en upload, cerrando sesión.");
          await supabase.auth.signOut({ scope: "local" });
          Alert.alert("Sesión caducada", "Vuelve a iniciar sesión para subir facturas.");
          return;
        }

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          const errorMsg = uploadData?.error || "Error al procesar la factura";
          Alert.alert("Error", errorMsg);
          return;
        }

        const result = uploadData?.results?.[0];
        if (!result) {
          Alert.alert("Error", "No se recibió respuesta del servidor");
          return;
        }

        if (result.error) {
          // El backend rechazó el documento (no es factura válida)
          Alert.alert(
            "✗ Documento rechazado",
            result.error + "\n\nSolo se aceptan facturas válidas.",
            [{ text: "Entendido", style: "cancel" }]
          );
          // Borrar el archivo local si no es factura
          try {
            await FileSystem.deleteAsync(localImageUri, { idempotent: true });
          } catch {}
          return;
        }

        // Éxito: el backend creó la factura con datos de IA
        const newInvoice = buildInvoice({
          id: result.id,
          date: result.date || isoDate,
          supplier: result.supplier || "Proveedor pendiente",
          category: result.category || "Sin clasificar",
          amount: result.amount || "0.00 EUR",
          imageUri: localImageUri,
          status: result.status || "Pendiente",
          invoiceNumber: result.invoiceNumber || null,
        });

        setInvoices((prev) => [newInvoice, ...prev]);

        // Feedback positivo al usuario con estado
        const statusText = result.status === "Enviada" 
          ? "y enviada a tu gestoría" 
          : result.status === "Archivada" 
          ? "(solo archivada)" 
          : "";

        Alert.alert(
          "✓ Factura guardada",
          `La factura ha sido analizada y guardada ${statusText}.\n\nProveedor: ${newInvoice.supplier}\nCategoría: ${newInvoice.category}\nImporte: ${newInvoice.amount}\nFecha: ${newInvoice.date}${result.invoiceNumber ? `\nNº Factura: ${result.invoiceNumber}` : ""}`,
          [{ text: "Ver facturas", onPress: () => navigation.navigate("Invoices") }]
        );
      } catch (uploadError) {
        console.warn("Error al enviar factura al backend:", uploadError);
        Alert.alert("Error", "No se pudo conectar con el servidor. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.warn("Error en handleScanDemo:", error);
    }
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const invoicesThisMonth = Array.isArray(invoices)
    ? invoices.filter((inv) => {
        const d = new Date(inv.date);
        if (Number.isNaN(d.getTime())) return false;
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
    : [];

  const countThisMonth = invoicesThisMonth.length;

  const totalThisMonth = invoicesThisMonth.reduce((sum, inv) => {
    if (!inv.amount || typeof inv.amount !== "string") return sum;
    const numericPart = inv.amount.replace(/[^\d.,-]/g, "");
    if (!numericPart) return sum;
    const value = parseFloat(numericPart.replace(",", "."));
    if (Number.isNaN(value)) return sum;
    return sum + value;
  }, 0);

  const totalThisMonthLabel = `${totalThisMonth.toFixed(2)} EUR`;

  const pendingCount = Array.isArray(invoices)
    ? invoices.filter((inv) => inv.status === "Pendiente").length
    : 0;

  const recentInvoices = invoices.slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: "#050816" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <View style={{ marginRight: 14 }}>
            <Image
              source={require("../assets/icon.png")}
              style={{ width: 48, height: 48, borderRadius: 12 }}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#F9FAFB", fontSize: 22, fontWeight: "700" }}>FaktuGo</Text>
            <Text style={{ color: "#6B7280", fontSize: 13 }}>Tus facturas, en piloto automático</Text>
          </View>
        </View>

        {/* Plan Usage Card */}
        <PlanUsageCard navigation={navigation} />

        {/* Stats Cards */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{
            flex: 1,
            backgroundColor: "#0F172A",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#1E293B",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="document-text-outline" size={18} color="#6B7280" />
              <Text style={{ color: "#6B7280", fontSize: 12, marginLeft: 6 }}>Este mes</Text>
            </View>
            <Text style={{ color: "#22CC88", fontSize: 28, fontWeight: "700" }}>{countThisMonth}</Text>
            <Text style={{ color: "#4B5563", fontSize: 11, marginTop: 2 }}>facturas</Text>
            <Text style={{ color: "#6B7280", fontSize: 10, marginTop: 6 }}>
              Incluye todo lo que has subido este mes (pendientes, enviadas o archivadas).
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: "#0F172A",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#1E293B",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="wallet-outline" size={18} color="#6B7280" />
              <Text style={{ color: "#6B7280", fontSize: 12, marginLeft: 6 }}>Importe</Text>
            </View>
            <Text style={{ color: "#22CC88", fontSize: 24, fontWeight: "700" }}>{totalThisMonthLabel}</Text>
            <Text style={{ color: "#4B5563", fontSize: 11, marginTop: 2 }}>acumulado</Text>
            <Text style={{ color: "#6B7280", fontSize: 10, marginTop: 6 }}>
              Te ayuda a saber el volumen que entregarás a tu gestoría este periodo.
            </Text>
          </View>
        </View>

        {/* Pending Card / Helper */}
        {pendingCount > 0 ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("Invoices", { filter: "Pendiente" })}
            style={{
              backgroundColor: "#0F172A",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#F59E0B30",
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontSize: 14, fontWeight: "600", marginLeft: 10 }}>
                {pendingCount} factura{pendingCount !== 1 ? "s" : ""} pendiente{pendingCount !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#F59E0B", fontSize: 12 }}>Enviar</Text>
              <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{
            backgroundColor: "#0F172A",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#1E293B",
            marginBottom: 24,
          }}>
            <Text style={{ color: "#6B7280", fontSize: 12 }}>
              No tienes facturas pendientes. Cuando subas nuevas, aparecerán aquí para que las envíes rápido.
            </Text>
          </View>
        )}

        {/* Recent Invoices Section */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ color: "#E5E7EB", fontSize: 16, fontWeight: "600" }}>Últimas facturas</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Invoices")}>
            <Text style={{ color: "#3B82F6", fontSize: 13 }}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {recentInvoices.length === 0 ? (
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
              Aún no tienes facturas.{"\n"}Escanea tu primera factura.
            </Text>
          </View>
        ) : (
          recentInvoices.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: item.id })}
              activeOpacity={0.7}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#0F172A",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#1E293B",
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#F9FAFB", fontSize: 14, fontWeight: "500" }} numberOfLines={1}>
                    {item.supplier}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Text style={{ color: "#6B7280", fontSize: 11 }}>
                      {item.date}
                    </Text>
                    <Text style={{ color: "#374151", fontSize: 11, marginHorizontal: 6 }}>•</Text>
                    <Text style={{ color: "#6B7280", fontSize: 11 }} numberOfLines={1}>
                      {item.category?.split(" - ")[0] || "Sin categoría"}
                    </Text>
                    {(() => {
                      const label = getOriginLabel(item.upload_source);
                      if (!label) return null;
                      let bgColor = "rgba(107,114,128,0.2)";
                      let textColor = "#9CA3AF";
                      if (label === "Correo") { bgColor = "rgba(16,185,129,0.15)"; textColor = "#6EE7B7"; }
                      else if (label === "Móvil") { bgColor = "rgba(56,189,248,0.15)"; textColor = "#7DD3FC"; }
                      else if (label === "Web") { bgColor = "rgba(129,140,248,0.15)"; textColor = "#A5B4FC"; }
                      return (
                        <View style={{ backgroundColor: bgColor, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 }}>
                          <Text style={{ color: textColor, fontSize: 9, fontWeight: "500" }}>{label}</Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
                <Text style={{ color: "#22CC88", fontSize: 14, fontWeight: "600", marginLeft: 12 }}>
                  {item.amount}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB - Floating Action Button */}
      <TouchableOpacity
        onPress={handleScanDemo}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#2A5FFF",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#2A5FFF",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="camera" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

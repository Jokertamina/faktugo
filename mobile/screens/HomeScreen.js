import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles";
import { buildInvoice } from "../domain/invoice";
import { computePeriodFromDate } from "../domain/period";
import { getSupabaseClient } from "../supabaseClient";
import { API_BASE_URL } from "../config";

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

export default function HomeScreen({ navigation, invoices, setInvoices }) {
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

      // Local-First: copiar la imagen a una carpeta real bajo documentDirectory,
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
          status: "Pendiente",
        });

        setInvoices((prev) => [newInvoice, ...prev]);

        // Feedback positivo al usuario
        Alert.alert(
          "✓ Factura guardada",
          `La factura ha sido analizada y guardada correctamente.\n\nProveedor: ${newInvoice.supplier}\nCategoría: ${newInvoice.category}\nImporte: ${newInvoice.amount}\nFecha: ${newInvoice.date}`,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>FG</Text>
        </View>
        <View>
          <Text style={styles.title}>FaktuGo</Text>
          <Text style={styles.subtitle}>Tus facturas, en piloto automatico</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#0B1220",
            borderRadius: 16,
            padding: 12,
          }}
        >
          <Text style={{ color: "#9CA3AF", fontSize: 11 }}>Facturas este mes</Text>
          <Text
            style={{
              color: "#22CC88",
              fontSize: 18,
              fontWeight: "600",
              marginTop: 4,
            }}
          >
            {countThisMonth}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: "#0B1220",
            borderRadius: 16,
            padding: 12,
          }}
        >
          <Text style={{ color: "#9CA3AF", fontSize: 11 }}>Importe este mes</Text>
          <Text
            style={{
              color: "#22CC88",
              fontSize: 16,
              fontWeight: "600",
              marginTop: 4,
            }}
          >
            {totalThisMonthLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Inicio rapido</Text>
      <Text style={styles.sectionDescription}>
        Pulsa en "Escanear factura (demo)" para capturar una nueva factura y añadirla a tu
        historial. Mas adelante este flujo usara la camara real y se sincronizara con la web.
      </Text>

      <TouchableOpacity style={styles.scanButton} onPress={handleScanDemo}>
        <Text style={styles.scanButtonText}>Escanear factura (demo)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryLink}
        onPress={() => navigation.navigate("Invoices")}
      >
        <Text style={styles.secondaryLinkText}>Ver todas las facturas</Text>
      </TouchableOpacity>

      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>Ultimas facturas</Text>
        <Text style={styles.listHeaderCount}>{Math.min(invoices.length, 5)}</Text>
      </View>

      <FlatList
        data={invoices.slice(0, 5)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("InvoiceDetail", { invoiceId: item.id });
            }}
          >
            <View style={styles.invoiceCard}>
              <View>
                <Text style={styles.invoiceSupplier}>{item.supplier}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <Text style={styles.invoiceMeta}>
                    {item.date} · {item.category}
                  </Text>
                  {(() => {
                    const label = getOriginLabel(item.upload_source);
                    if (!label) return null;
                    const badgeStyles = [styles.originBadge];
                    if (label === "Correo") {
                      badgeStyles.push(styles.originBadgeEmail);
                    } else if (label === "Móvil") {
                      badgeStyles.push(styles.originBadgeMobile);
                    } else if (label === "Web") {
                      badgeStyles.push(styles.originBadgeWeb);
                    }
                    return <Text style={badgeStyles}>{label}</Text>;
                  })()}
                </View>
              </View>
              <Text style={styles.invoiceAmount}>{item.amount}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

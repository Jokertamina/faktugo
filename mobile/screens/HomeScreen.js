import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles";
import { buildInvoice } from "../domain/invoice";
import { computePeriodFromDate } from "../domain/period";
import { getSupabaseClient } from "../supabaseClient";
import { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL } from "../config";

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

    if (!SUPABASE_URL) {
      console.warn("SUPABASE_URL no esta configurada en la app movil.");
      return;
    }

    if (!SUPABASE_ANON_KEY) {
      console.warn("SUPABASE_ANON_KEY no esta configurada en la app movil.");
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

      const { period_type, period_key, folder_path } = computePeriodFromDate(
        isoDate,
        mode,
        rootFolder
      );
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const ext = (() => {
        const uri = asset.uri;
        const dotIndex = uri.lastIndexOf(".");
        if (dotIndex === -1) return "";
        return uri.slice(dotIndex).toLowerCase();
      })();
      const baseFolder = `${user.id}/${year}-${month}`;
      const fileName = `${id}${ext}`;
      const storagePath = `${baseFolder}/${fileName}`;

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

      const localInvoice = buildInvoice({
        id,
        date: isoDate,
        supplier: "Proveedor pendiente",
        category: "Sin clasificar",
        amount: "0.00 EUR",
        imageUri: localImageUri,
        status: "Pendiente",
      });

      setInvoices((prev) => [localInvoice, ...prev]);

      try {
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/invoices/${storagePath}`;

        const uploadResult = await FileSystem.uploadAsync(uploadUrl, localImageUri, {
          httpMethod: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY,
            "Content-Type": mime,
          },
        });

        if (uploadResult.status < 200 || uploadResult.status >= 300) {
          console.warn(
            "No se pudo subir el archivo a Supabase Storage desde movil:",
            uploadResult.status,
            uploadResult.body
          );
          return;
        }
      } catch (error) {
        console.warn("Error al subir archivo:", error);
      }

      try {
        const { error: insertError } = await supabase
          .from("invoices")
          .insert({
            id,
            user_id: user.id,
            date: isoDate,
            supplier: "Proveedor pendiente",
            category: "Sin clasificar",
            amount: "0.00 EUR",
            status: "Pendiente",
            period_type,
            period_key,
            folder_path,
            file_path: storagePath,
            file_name_original: fileName,
            file_mime_type: mime,
            file_size: asset.fileSize ?? null,
            upload_source: "mobile_upload",
            archival_only: archivalOnly,
          });

        if (insertError) {
          console.warn("No se pudo registrar la factura en la tabla invoices desde movil:", insertError);
        }
      
        if (sendToGestoria && API_BASE_URL) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/gestoria/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ invoiceId: id }),
            });

            if (!response.ok) {
              let message = "No se pudo enviar la factura a la gestoria";
              try {
                const data = await response.json();
                if (data?.error) message = data.error;
              } catch {}
              console.warn("Envio a gestoria desde movil fallo:", response.status, message);
            }
          } catch (sendError) {
            console.warn(
              "Error inesperado al intentar enviar la factura a la gestoria desde movil:",
              sendError
            );
          }
        }
      } catch (syncError) {
        console.warn("Error al sincronizar factura escaneada con Supabase desde movil:", syncError);
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

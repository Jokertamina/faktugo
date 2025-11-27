import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { styles } from "../styles";
import { buildInvoice } from "../domain/invoice";
import { computePeriodFromDate } from "../domain/period";
import { getSupabaseClient } from "../supabaseClient";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

function generateUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
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

      const now = new Date();
      const isoDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const id = generateUuid();
      const mime = asset.mimeType || "image/jpeg";
      const { period_type, period_key, folder_path } = computePeriodFromDate(isoDate, "month");
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

      const localInvoice = buildInvoice({
        id,
        date: isoDate,
        supplier: "Proveedor pendiente",
        category: "Sin clasificar",
        amount: "0.00 EUR",
        imageUri: asset.uri,
        status: "Pendiente",
      });

      setInvoices((prev) => [localInvoice, ...prev]);

      try {
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

        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/invoices/${storagePath}`;

        const uploadResult = await FileSystem.uploadAsync(uploadUrl, asset.uri, {
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
          });

        if (insertError) {
          console.warn("No se pudo registrar la factura en la tabla invoices desde movil:", insertError);
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
                <Text style={styles.invoiceMeta}>
                  {item.date} · {item.category}
                </Text>
              </View>
              <Text style={styles.invoiceAmount}>{item.amount}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

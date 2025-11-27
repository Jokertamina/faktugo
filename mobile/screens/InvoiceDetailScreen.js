import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Linking } from "react-native";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";

export default function InvoiceDetailScreen({ navigation, route, invoices }) {
  const { invoiceId } = route.params || {};
  const invoice = invoices.find((item) => item.id === invoiceId);
  const [fileUrl, setFileUrl] = useState(null);

  if (!invoice) {
    return (
      <View style={styles.container}>
        <View style={styles.invoicesHeaderRow}>
          <TouchableOpacity onPress={() => navigation.navigate("Invoices")}>
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

  return (
    <View style={styles.container}>
      <View style={styles.invoicesHeaderRow}>
        <TouchableOpacity onPress={() => navigation.navigate("Invoices")}>
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
          En el futuro aqui veras el PDF o la imagen procesada, junto con los datos extraidos por
          OCR (fecha, importe, proveedor, IVA, etc.).
        </Text>
      </View>
    </View>
  );
}

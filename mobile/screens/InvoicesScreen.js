import React, { useEffect, useState } from "react";
import { View, Text, SectionList, TouchableOpacity, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles";
import { computePeriodFromDate } from "../domain/period";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getOriginLabel(uploadSource) {
  if (uploadSource === "email_ingest") return "Correo";
  if (uploadSource === "mobile_upload") return "Móvil";
  if (uploadSource === "web_upload") return "Web";
  return null;
}

function buildSections(invoices, mode) {
  const groups = {};

  invoices.forEach((inv) => {
    const { period_key } = computePeriodFromDate(inv.date, mode);
    if (!period_key) return;

    if (!groups[period_key]) {
      let label = "";
      const d = new Date(inv.date);

      if (mode === "week") {
        if (Number.isNaN(d.getTime())) return;

        const jsDay = d.getDay(); // 0 (domingo) - 6 (sabado)
        const dayAsMondayFirst = jsDay === 0 ? 7 : jsDay; // 1 (lunes) - 7 (domingo)
        const diffToMonday = dayAsMondayFirst - 1;

        const start = new Date(d);
        start.setDate(d.getDate() - diffToMonday);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const startDay = start.getDate();
        const endDay = end.getDate();
        const sameMonth =
          start.getMonth() === end.getMonth() &&
          start.getFullYear() === end.getFullYear();

        if (sameMonth) {
          const monthName = MONTH_NAMES[start.getMonth()] ?? "";
          label = monthName
            ? `Semana del ${startDay}-${endDay} ${monthName} ${start.getFullYear()}`
            : `Semana del ${startDay}-${endDay} ${start.getFullYear()}`;
        } else {
          const startMonthName = MONTH_NAMES[start.getMonth()] ?? "";
          const endMonthName = MONTH_NAMES[end.getMonth()] ?? "";
          if (start.getFullYear() === end.getFullYear()) {
            label = `Semana del ${startDay} ${startMonthName}–${endDay} ${endMonthName} ${start.getFullYear()}`;
          } else {
            label = `Semana del ${startDay} ${startMonthName} ${start.getFullYear()}–${endDay} ${endMonthName} ${end.getFullYear()}`;
          }
        }
      } else {
        const [year, monthStr] = period_key.split("-");
        const monthIndex = Number(monthStr) - 1;
        const monthName = MONTH_NAMES[monthIndex] ?? period_key;
        label = `${monthName} ${year}`;
      }

      groups[period_key] = { title: label, key: period_key, data: [] };
    }

    groups[period_key].data.push(inv);
  });

  return Object.values(groups).sort((a, b) => (a.key < b.key ? 1 : -1));
}

export default function InvoicesScreen({ navigation, invoices }) {
  const [viewMode, setViewMode] = useState("month"); // "month" | "week"
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "Enviada" | "Pendiente" | "archived"

  const normalizedSearch = search.trim().toLowerCase();

  useEffect(() => {
    let isMounted = true;

    async function loadViewMode() {
      try {
        const storedMode = await AsyncStorage.getItem("faktugo_period_mode");
        if (!isMounted) return;
        if (storedMode === "week" || storedMode === "month") {
          setViewMode(storedMode);
        }
      } catch (e) {
        console.warn("No se pudo cargar el modo de vista de facturas:", e);
      }
    }

    loadViewMode();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredInvoices = Array.isArray(invoices)
    ? invoices.filter((inv) => {
        if (statusFilter === "Enviada" || statusFilter === "Pendiente") {
          if (inv.status !== statusFilter) return false;
        } else if (statusFilter === "Archivada") {
          // Filtrar por estado Archivada O por archival_only
          if (inv.status !== "Archivada" && !inv.archival_only) return false;
        }

        if (normalizedSearch) {
          const supplier = String(inv.supplier ?? "").toLowerCase();
          const category = String(inv.category ?? "").toLowerCase();
          const invoiceNum = String(inv.invoice_number ?? "").toLowerCase();
          if (
            !supplier.includes(normalizedSearch) &&
            !category.includes(normalizedSearch) &&
            !invoiceNum.includes(normalizedSearch)
          ) {
            return false;
          }
        }

        return true;
      })
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.invoicesHeaderRow}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.backText}>← Inicio</Text>
        </TouchableOpacity>
        <Text style={styles.invoicesHeaderTitle}>Todas las facturas</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={{ marginBottom: 10 }}>
        <Text style={[styles.invoiceMeta, { marginTop: 0 }]}>Buscar</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Proveedor o categoria"
          placeholderTextColor="#6B7280"
          style={{
            marginTop: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#1F2937",
            paddingHorizontal: 12,
            paddingVertical: 8,
            color: "#F9FAFB",
            fontSize: 12,
            backgroundColor: "#020617",
          }}
        />
      </View>

      <View style={styles.viewToggleRow}>
        {[
          { label: "Por mes", value: "month" },
          { label: "Por semana", value: "week" },
        ].map((option) => {
          const active = viewMode === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setViewMode(option.value)}
              style={[
                styles.viewToggleButton,
                active && styles.viewToggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  active && styles.viewToggleTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.viewToggleRow, { marginTop: 4, flexWrap: "wrap" }]}>
        {[
          { label: "Todas", value: "all" },
          { label: "Enviadas", value: "Enviada" },
          { label: "Pendientes", value: "Pendiente" },
          { label: "Archivadas", value: "Archivada" },
        ].map((option) => {
          const active = statusFilter === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setStatusFilter(option.value)}
              style={[
                styles.viewToggleButton,
                { flex: 0, paddingHorizontal: 16 },
                active && styles.viewToggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  active && styles.viewToggleTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionList
        sections={buildSections(filteredInvoices, viewMode)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitleAccent}>{section.title}</Text>
        )}
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

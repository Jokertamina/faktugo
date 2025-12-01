import React, { useEffect, useState } from "react";
import { View, Text, SectionList, TouchableOpacity, TextInput, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
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

  const statusFilters = [
    { label: "Todas", value: "all", icon: "list" },
    { label: "Enviadas", value: "Enviada", icon: "checkmark-circle" },
    { label: "Pendientes", value: "Pendiente", icon: "time" },
    { label: "Archivadas", value: "Archivada", icon: "archive" },
  ];

  const viewModes = [
    { label: "Mes", value: "month", icon: "calendar" },
    { label: "Semana", value: "week", icon: "calendar-outline" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#050816" }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ color: "#F9FAFB", fontSize: 24, fontWeight: "700" }}>Facturas</Text>
        <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 2 }}>
          {filteredInvoices.length} facturas
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#0F172A",
          borderRadius: 12,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: "#1E293B",
        }}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar proveedor, categoría o nº factura..."
            placeholderTextColor="#4B5563"
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 10,
              color: "#F9FAFB",
              fontSize: 14,
            }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 8 }}
      >
        {statusFilters.map((option) => {
          const active = statusFilter === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setStatusFilter(option.value)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: active ? "#1E3A5F" : "#0F172A",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: active ? "#3B82F6" : "#1E293B",
              }}
            >
              <Ionicons
                name={option.icon}
                size={14}
                color={active ? "#60A5FA" : "#6B7280"}
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: active ? "#60A5FA" : "#9CA3AF", fontSize: 12, fontWeight: "500" }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* View Mode Toggle */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 12 }}>
        {viewModes.map((option) => {
          const active = viewMode === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setViewMode(option.value)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? "#1E293B" : "transparent",
                borderRadius: 8,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: active ? "#374151" : "#1E293B",
              }}
            >
              <Ionicons
                name={option.icon}
                size={14}
                color={active ? "#F9FAFB" : "#6B7280"}
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: active ? "#F9FAFB" : "#6B7280", fontSize: 12, fontWeight: "500" }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Invoice List */}
      <SectionList
        sections={buildSections(filteredInvoices, viewMode)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 8 }}>
            <View style={{ width: 4, height: 16, backgroundColor: "#22CC88", borderRadius: 2, marginRight: 8 }} />
            <Text style={{ color: "#22CC88", fontSize: 13, fontWeight: "600" }}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          // Status badge
          let statusColor = "#6B7280";
          let statusBg = "rgba(107,114,128,0.15)";
          let statusIcon = "time-outline";
          if (item.status === "Enviada") {
            statusColor = "#22CC88";
            statusBg = "rgba(34,204,136,0.15)";
            statusIcon = "checkmark-circle";
          } else if (item.status === "Archivada") {
            statusColor = "#A78BFA";
            statusBg = "rgba(167,139,250,0.15)";
            statusIcon = "archive";
          }

          return (
            <TouchableOpacity
              onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: item.id })}
              activeOpacity={0.7}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#0F172A",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#1E293B",
              }}>
                {/* Status indicator */}
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: statusBg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <Ionicons name={statusIcon} size={18} color={statusColor} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#F9FAFB", fontSize: 14, fontWeight: "500" }} numberOfLines={1}>
                    {item.supplier}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                    <Text style={{ color: "#6B7280", fontSize: 11 }}>{item.date}</Text>
                    <Text style={{ color: "#374151", marginHorizontal: 6 }}>•</Text>
                    <Text style={{ color: "#6B7280", fontSize: 11 }} numberOfLines={1}>
                      {item.category?.split(" - ")[0] || "Sin categoría"}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: "#22CC88", fontSize: 14, fontWeight: "600" }}>
                    {item.amount}
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
                      <View style={{ backgroundColor: bgColor, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginTop: 4 }}>
                        <Text style={{ color: textColor, fontSize: 9, fontWeight: "500" }}>{label}</Text>
                      </View>
                    );
                  })()}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={{
            backgroundColor: "#0F172A",
            borderRadius: 16,
            padding: 32,
            alignItems: "center",
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#1E293B",
          }}>
            <Ionicons name="search-outline" size={40} color="#374151" />
            <Text style={{ color: "#6B7280", fontSize: 14, marginTop: 12, textAlign: "center" }}>
              No se encontraron facturas{search ? ` para "${search}"` : ""}.
            </Text>
          </View>
        )}
      />
    </View>
  );
}

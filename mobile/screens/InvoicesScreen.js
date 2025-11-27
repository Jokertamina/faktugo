import React, { useState } from "react";
import { View, Text, SectionList, TouchableOpacity } from "react-native";
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

  return (
    <View style={styles.container}>
      <View style={styles.invoicesHeaderRow}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.backText}>← Inicio</Text>
        </TouchableOpacity>
        <Text style={styles.invoicesHeaderTitle}>Todas las facturas</Text>
        <View style={{ width: 60 }} />
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

      <SectionList
        sections={buildSections(invoices, viewMode)}
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

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getSupabaseClient } from "../supabaseClient";
import { API_BASE_URL } from "../config";

export default function PlanUsageCard() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/stripe/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        console.warn("PlanUsageCard: no autenticado en API de uso, cerrando sesión en móvil.");
        await supabase.auth.signOut({ scope: "local" });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.warn("Error fetching usage:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !usage) return null;

  const { plan, usage: usageData } = usage;
  const { invoicesThisMonth, invoicesLimit, invoicesRemaining, percentUsed } = usageData;
  
  const planNames = {
    free: "Gratuito",
    basico: "Básico",
    pro: "Pro",
  };
  const planName = planNames[plan] || plan;
  
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = invoicesRemaining === 0;

  // Colores según el estado
  const progressColor = isAtLimit ? "#EF4444" : isNearLimit ? "#F59E0B" : "#22CC88";
  const textColor = isAtLimit ? "#FCA5A5" : isNearLimit ? "#FCD34D" : "#86EFAC";

  return (
    <View style={{
      backgroundColor: "#0F172A",
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isAtLimit ? "#EF444430" : isNearLimit ? "#F59E0B30" : "#1E293B",
      marginBottom: 12,
    }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View>
          <Text style={{ color: "#9CA3AF", fontSize: 12 }}>Tu plan</Text>
          <Text style={{ color: "#F9FAFB", fontSize: 18, fontWeight: "700" }}>{planName}</Text>
        </View>
        <View style={{
          backgroundColor: plan === "free" ? "#374151" : "#22CC8820",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
        }}>
          <Text style={{ color: plan === "free" ? "#9CA3AF" : "#22CC88", fontSize: 11, fontWeight: "600" }}>
            {plan === "free" ? "Gratis" : "Activo"}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ color: "#9CA3AF", fontSize: 12 }}>Facturas este mes</Text>
          <Text style={{ color: textColor, fontSize: 12, fontWeight: "600" }}>
            {invoicesThisMonth} / {invoicesLimit}
          </Text>
        </View>
        <View style={{
          height: 6,
          backgroundColor: "#374151",
          borderRadius: 3,
          overflow: "hidden",
        }}>
          <View style={{
            height: "100%",
            width: `${Math.min(percentUsed, 100)}%`,
            backgroundColor: progressColor,
            borderRadius: 3,
          }} />
        </View>
        <Text style={{ color: isAtLimit ? "#FCA5A5" : isNearLimit ? "#FCD34D" : "#6B7280", fontSize: 11, marginTop: 4 }}>
          {isAtLimit 
            ? "Has alcanzado el límite" 
            : `${invoicesRemaining} facturas restantes`}
        </Text>
      </View>

      {/* Upgrade Button (solo para free) */}
      {plan === "free" && (
        <TouchableOpacity
          onPress={() => Linking.openURL("https://faktugo.com/pricing")}
          style={{
            backgroundColor: isAtLimit || isNearLimit ? "#F59E0B" : "#2A5FFF",
            paddingVertical: 10,
            borderRadius: 20,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
            {isAtLimit ? "Necesitas mejorar" : "Mejorar plan"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

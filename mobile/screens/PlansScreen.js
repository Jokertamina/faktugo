import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";

const API_BASE_URL = "https://faktugo.com";

export default function PlansScreen() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar planes desde la API
      const plansRes = await fetch(`${API_BASE_URL}/api/plans`);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }

      // Cargar suscripción actual del usuario
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("*, plans(*)")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();
          
          if (subscription?.plans) {
            setCurrentPlan(subscription.plans.name);
          }
        }
      }
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert("Error", "Debes iniciar sesión para suscribirte.");
      return;
    }

    setPurchasing(plan.id);

    try {
      // Llamar al endpoint de checkout
      const response = await fetch(`${API_BASE_URL}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Abrir el checkout de Stripe en el navegador
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          Alert.alert("Error", "No se pudo abrir el enlace de pago.");
        }
      } else {
        Alert.alert("Error", data.error || "Error al crear la sesión de pago.");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      Alert.alert("Error", "No se pudo procesar la suscripción.");
    } finally {
      setPurchasing(null);
    }
  };

  const handleManageSubscription = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert("Error", "Debes iniciar sesión.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.url) {
        await Linking.openURL(data.url);
      } else {
        Alert.alert("Error", data.error || "No se pudo abrir el portal.");
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      Alert.alert("Error", "No se pudo abrir el portal de gestión.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#22CC88" />
        <Text style={{ color: "#9CA3AF", marginTop: 12 }}>Cargando planes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>FG</Text>
        </View>
        <View>
          <Text style={styles.title}>Planes</Text>
          <Text style={styles.subtitle}>Elige el plan que mejor se adapte a ti</Text>
        </View>
      </View>

      {currentPlan && (
        <View style={{
          backgroundColor: "#1E3A5F",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#3B82F6",
        }}>
          <Text style={{ color: "#93C5FD", fontSize: 14, fontWeight: "600" }}>
            Tu plan actual: {currentPlan}
          </Text>
          <TouchableOpacity
            onPress={handleManageSubscription}
            style={{
              marginTop: 12,
              backgroundColor: "#3B82F6",
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Gestionar suscripción</Text>
          </TouchableOpacity>
        </View>
      )}

      {plans.map((plan) => {
        const isCurrentPlan = currentPlan === plan.name;
        const isPurchasing = purchasing === plan.id;

        return (
          <View
            key={plan.id}
            style={{
              backgroundColor: isCurrentPlan ? "#0D2818" : "#0B1220",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isCurrentPlan ? "#22CC88" : "#1F2937",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#F9FAFB", fontSize: 18, fontWeight: "700" }}>
                {plan.name}
              </Text>
              {isCurrentPlan && (
                <View style={{
                  backgroundColor: "#22CC88",
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: "#022c22", fontSize: 11, fontWeight: "600" }}>ACTUAL</Text>
                </View>
              )}
            </View>

            <Text style={{ color: "#9CA3AF", fontSize: 13, marginTop: 8 }}>
              {plan.description}
            </Text>

            <View style={{ marginTop: 16 }}>
              <Text style={{ color: "#F9FAFB", fontSize: 28, fontWeight: "700" }}>
                {plan.price_monthly === 0 ? "Gratis" : `${plan.price_monthly}€`}
                {plan.price_monthly > 0 && (
                  <Text style={{ color: "#9CA3AF", fontSize: 14, fontWeight: "400" }}>/mes</Text>
                )}
              </Text>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={{ color: "#6EE7B7", fontSize: 12 }}>
                ✓ {plan.limits?.invoices_per_month === -1 ? "Facturas ilimitadas" : `${plan.limits?.invoices_per_month || 5} facturas/mes`}
              </Text>
              {plan.limits?.can_send_to_gestoria && (
                <Text style={{ color: "#6EE7B7", fontSize: 12, marginTop: 4 }}>
                  ✓ Envío a gestoría
                </Text>
              )}
              {plan.limits?.email_ingestion && (
                <Text style={{ color: "#6EE7B7", fontSize: 12, marginTop: 4 }}>
                  ✓ Ingesta por email
                </Text>
              )}
              {plan.features?.priority_support && (
                <Text style={{ color: "#6EE7B7", fontSize: 12, marginTop: 4 }}>
                  ✓ Soporte prioritario
                </Text>
              )}
            </View>

            {!isCurrentPlan && plan.price_monthly > 0 && (
              <TouchableOpacity
                onPress={() => handleSubscribe(plan)}
                disabled={isPurchasing}
                style={{
                  marginTop: 20,
                  backgroundColor: isPurchasing ? "#1F2937" : "#22CC88",
                  borderRadius: 999,
                  paddingVertical: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isPurchasing && <ActivityIndicator size="small" color="#9CA3AF" />}
                <Text style={{ color: isPurchasing ? "#9CA3AF" : "#022c22", fontWeight: "600" }}>
                  {isPurchasing ? "Procesando..." : "Suscribirse"}
                </Text>
              </TouchableOpacity>
            )}

            {plan.price_monthly === 0 && !isCurrentPlan && (
              <View style={{
                marginTop: 20,
                backgroundColor: "#1F2937",
                borderRadius: 999,
                paddingVertical: 12,
                alignItems: "center",
              }}>
                <Text style={{ color: "#9CA3AF", fontWeight: "600" }}>Plan por defecto</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

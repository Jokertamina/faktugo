import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";
import { API_BASE_URL } from "../config";

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
      let allPlans = [];
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        // Usar allPlans que incluye el plan free
        allPlans = plansData.allPlans || plansData.plans || [];
        setPlans(allPlans);
      }

      // Cargar suscripción actual del usuario
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("plan_name, status, current_period_end, plans(display_name)")
            .eq("user_id", user.id)
            .in("status", ["active", "trialing", "past_due"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (subscription) {
            let displayName = subscription.plans?.display_name ?? null;

            if (!displayName && subscription.plan_name && Array.isArray(allPlans)) {
              const match = allPlans.find((p) => p.id === subscription.plan_name);
              if (match) {
                displayName = match.name || match.display_name || match.id;
              }
            }

            if (displayName) {
              setCurrentPlan(displayName);
            } else {
              setCurrentPlan(null);
            }
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

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.warn("No se pudo obtener la sesion antes de suscribirse desde movil:", sessionError);
      Alert.alert("Error", "Debes iniciar sesión para suscribirte.");
      return;
    }

    setPurchasing(plan.id);

    try {
      const redirectUrl = Linking.createURL("stripe-return");

      // Llamar al endpoint de checkout
      const response = await fetch(`${API_BASE_URL}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          accessToken: session.access_token,
          returnUrl: redirectUrl,
        }),
      });

      if (response.status === 401) {
        console.warn("PlansScreen: 401 en checkout, cerrando sesión.");
        await supabase.auth.signOut({ scope: "local" });
        Alert.alert("Sesión caducada", "Vuelve a iniciar sesión para suscribirte.");
        return;
      }

      const data = await response.json();

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === "success") {
          // Volvemos desde Stripe a la app mediante deep link
          Alert.alert("Suscripción actualizada", "Tu suscripción se ha actualizado correctamente.");
          await loadData();
        } else if (result.type === "dismiss" || result.type === "cancel") {
          // El usuario cerró o canceló el flujo de pago
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
      const redirectUrl = Linking.createURL("stripe-portal-return");

      const response = await fetch(`${API_BASE_URL}/api/stripe/portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: redirectUrl,
        }),
      });

      if (response.status === 401) {
        console.warn("PlansScreen: 401 en portal, cerrando sesión.");
        await supabase.auth.signOut({ scope: "local" });
        Alert.alert("Sesión caducada", "Vuelve a iniciar sesión para gestionar la suscripción.");
        return;
      }

      const data = await response.json();

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === "success") {
          Alert.alert("Suscripción actualizada", "Se ha actualizado tu suscripción.");
          await loadData();
        }
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

      <View style={{ backgroundColor: "#0B1220", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#111827", marginBottom: 20 }}>
        <Text style={{ color: "#E5E7EB", fontSize: 13, fontWeight: "600" }}>
          Plan actual: {currentPlan ? currentPlan : "Gratuito"}
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>
          Puedes cambiar de plan en cualquier momento. Si ya tienes un plan de pago, el cambio se gestiona a través de Stripe.
        </Text>
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
        const isCurrent = currentPlan && currentPlan.toLowerCase() === plan.name?.toLowerCase();
        return (
          <View key={plan.id} style={{
            backgroundColor: "#0B1220",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#1E2937",
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#F9FAFB", fontSize: 18, fontWeight: "700" }}>
                {plan.name}
              </Text>
              {isCurrent && (
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
              {(plan.features || []).map((feature, index) => (
                <Text key={index} style={{ color: "#6EE7B7", fontSize: 12, marginTop: index > 0 ? 4 : 0 }}>
                  ✓ {feature}
                </Text>
              ))}
            </View>

            {!isCurrent && plan.price_monthly > 0 && (
              <TouchableOpacity
                onPress={() => handleSubscribe(plan)}
                disabled={purchasing === plan.id}
                style={[
                  {
                    marginTop: 20,
                    backgroundColor: "#22CC88",
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  },
                  (purchasing === plan.id) && { opacity: 0.6 },
                ]}
              >
                {purchasing === plan.id && <ActivityIndicator size="small" color="#022c22" />}
                <Text style={{ color: "#022c22", fontSize: 13, fontWeight: "600" }}>
                  {purchasing === plan.id
                    ? "Procesando..."
                    : "Elegir este plan"}
                </Text>
              </TouchableOpacity>
            )}

            {plan.price_monthly === 0 && !isCurrent && (
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

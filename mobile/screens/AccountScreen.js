import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";

export default function AccountScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clientType, setClientType] = useState("autonomo");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [gestoriaEmail, setGestoriaEmail] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [periodMode, setPeriodMode] = useState("month"); // "month" | "week"
  const [rootFolder, setRootFolder] = useState("/FaktuGo");
  const [signingOut, setSigningOut] = useState(false);
  const [canEditGestoriaEmail, setCanEditGestoriaEmail] = useState(true);
  const [gestoriaEmailReason, setGestoriaEmailReason] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    async function loadLocalSettings() {
      try {
        const storedMode = await AsyncStorage.getItem("faktugo_period_mode");
        const storedRoot = await AsyncStorage.getItem("faktugo_root_folder");

        if (!isMounted) return;

        if (storedMode === "month" || storedMode === "week") {
          setPeriodMode(storedMode);
        }

        if (typeof storedRoot === "string" && storedRoot.trim().length > 0) {
          setRootFolder(storedRoot);
        }
      } catch (e) {
        console.warn("No se pudieron cargar los ajustes locales de periodo/carpeta:", e);
      }
    }

    async function load() {
      if (!supabase) {
        setLoadingUser(false);
        setLoadingProfile(false);
        await loadLocalSettings();
        return;
      }

      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("No se pudo obtener el usuario en Cuenta:", error);
        }
        const user = data?.user ?? null;
        if (isMounted) {
          setEmail(user?.email ?? null);
          setUserId(user?.id ?? null);
          setLoadingUser(false);
        }
        if (!user) {
          if (isMounted) setLoadingProfile(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name,last_name,type,company_name,country,gestoria_email,is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("No se pudo obtener el perfil en Cuenta:", profileError);
        }

        if (isMounted) {
          setFirstName(profile?.first_name ?? "");
          setLastName(profile?.last_name ?? "");
          setClientType(profile?.type ?? "autonomo");
          setCompanyName(profile?.company_name ?? "");
          setCountry(profile?.country ?? "");
          setGestoriaEmail(profile?.gestoria_email ?? "");
        }

        // Calcular si puede editar el email de gestoria segun plan (o si es admin)
        try {
          const isAdmin = profile?.is_admin === true;
          let allowGestoriaEmail = true;
          let reason = null;

          if (!isAdmin) {
            const { data: subscription } = await supabase
              .from("subscriptions")
              .select("plan_name,status,created_at")
              .eq("user_id", user.id)
              .in("status", ["active", "trialing", "past_due"])
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (subscription?.plan_name) {
              const { data: planRow } = await supabase
                .from("plans")
                .select("can_send_gestoria")
                .eq("id", subscription.plan_name)
                .maybeSingle();

              allowGestoriaEmail = !!planRow?.can_send_gestoria;
            } else {
              allowGestoriaEmail = false;
            }

            if (!allowGestoriaEmail) {
              reason = "Solo los planes Básico o Pro permiten configurar el email de tu gestoría.";
            }
          }

          if (isMounted) {
            setCanEditGestoriaEmail(allowGestoriaEmail || isAdmin);
            setGestoriaEmailReason(reason);
          }
        } catch (planError) {
          console.warn("No se pudo determinar el permiso para email de gestoria:", planError);
          if (isMounted) {
            setCanEditGestoriaEmail(true);
          }
        }

        if (isMounted) {
          setLoadingProfile(false);
        }

        await loadLocalSettings();
      } catch (e) {
        console.warn("Error inesperado al cargar Cuenta:", e);
        if (isMounted) {
          setLoadingUser(false);
          setLoadingProfile(false);
        }
        await loadLocalSettings();
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedCompany = companyName.trim();
    const trimmedGestoria = gestoriaEmail.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const isBusiness = clientType === "empresa";

    if (!trimmedFirst || !trimmedLast) {
      Alert.alert("Nombre y apellidos", "Introduce nombre y apellidos para guardar la cuenta.");
      return;
    }

    if (isBusiness && !trimmedCompany) {
      Alert.alert(
        "Nombre de la empresa",
        "Para empresas, indica el nombre de la empresa para guardar la cuenta."
      );
      return;
    }

    setSavingProfile(true);
    try {
      const { data: existingProfile, error: selectError } = await supabase
        .from("profiles")
        .select("id, display_name, first_name, last_name, type, company_name, country")
        .eq("id", userId)
        .maybeSingle();

      if (selectError) {
        console.warn("No se pudo obtener el perfil antes de guardar en Cuenta:", selectError);
      }

      if (existingProfile) {
        const updatePayload = {
          display_name: fullName,
          first_name: trimmedFirst || null,
          last_name: trimmedLast || null,
          type: clientType,
          company_name: trimmedCompany || null,
          country: country.trim() || null,
        };

        if (canEditGestoriaEmail) {
          updatePayload.gestoria_email = trimmedGestoria || null;
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", userId);

        if (updateError) {
          console.warn("No se pudo actualizar el perfil en Cuenta:", updateError);
          Alert.alert("No se pudo guardar", "Intentalo de nuevo mas tarde.");
          return;
        }
      } else {
        const defaultDisplayName =
          email && typeof email === "string" ? email.split("@")[0] : "Usuario FaktuGo";
        const safeFullName = fullName || defaultDisplayName;
        const insertPayload = {
          id: userId,
          display_name: safeFullName,
          first_name: trimmedFirst || null,
          last_name: trimmedLast || null,
          type: clientType,
          company_name: trimmedCompany || null,
          country: country.trim() || null,
        };

        if (canEditGestoriaEmail) {
          insertPayload.gestoria_email = trimmedGestoria || null;
        }

        const { error: insertError } = await supabase.from("profiles").insert(insertPayload);

        if (insertError) {
          console.warn("No se pudo crear el perfil en Cuenta:", insertError);
          Alert.alert("No se pudo guardar", "Intentalo de nuevo mas tarde.");
          return;
        }
      }
      try {
        const normalizedRoot = (rootFolder || "").trim() || "/FaktuGo";
        const safeMode = periodMode === "week" ? "week" : "month";
        await AsyncStorage.setItem("faktugo_period_mode", safeMode);
        await AsyncStorage.setItem("faktugo_root_folder", normalizedRoot);
        setRootFolder(normalizedRoot);
      } catch (settingsError) {
        console.warn("No se pudieron guardar los ajustes locales de periodo/carpeta:", settingsError);
      }

      Alert.alert("Guardado", "Datos de cuenta actualizados.");
    } catch (e) {
      console.warn("Error inesperado al guardar Cuenta:", e);
      Alert.alert("No se pudo guardar", "Intentalo de nuevo mas tarde.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.warn("Error al cerrar sesion:", error);
        Alert.alert("No se pudo cerrar sesión", "Inténtalo de nuevo más tarde.");
      }
    } catch (e) {
      console.warn("Error inesperado al cerrar sesion:", e);
      Alert.alert("No se pudo cerrar sesión", "Inténtalo de nuevo más tarde.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#050816" }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ color: "#F9FAFB", fontSize: 24, fontWeight: "700" }}>Cuenta</Text>
        <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 2 }}>
          Tu perfil y configuración
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 8 }}>
          <Ionicons name="person-circle-outline" size={18} color="#6B7280" />
          <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginLeft: 8 }}>Tu cuenta</Text>
        </View>

        <View style={{
          backgroundColor: "#0F172A",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "#1E293B",
          marginBottom: 20,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name="mail-outline" size={16} color="#6B7280" />
            <Text style={{ color: "#6B7280", fontSize: 12, marginLeft: 8 }}>Email principal</Text>
          </View>
          {loadingUser ? (
            <Text style={{ color: "#9CA3AF", fontSize: 13 }}>Cargando...</Text>
          ) : (
            <Text style={{ color: "#F9FAFB", fontSize: 14 }}>
              {email ?? "No se pudo detectar el email del usuario."}
            </Text>
          )}

          <View
            style={{
              height: 1,
              backgroundColor: "#1E293B",
              marginVertical: 16,
            }}
          />

          <Text style={{ color: "#E5E7EB", fontSize: 13 }}>Nombre</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Nombre"
            placeholderTextColor="#6B7280"
            autoCapitalize="words"
            editable={!loadingProfile && !savingProfile}
            style={{
              backgroundColor: "#0F172A",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#1E293B",
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: "#F9FAFB",
              fontSize: 14,
              marginTop: 8,
            }}
          />

          <Text style={{ color: "#E5E7EB", fontSize: 13, marginTop: 16 }}>Apellidos</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Apellidos"
            placeholderTextColor="#6B7280"
            autoCapitalize="words"
            editable={!loadingProfile && !savingProfile}
            style={{
              backgroundColor: "#0F172A",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#1E293B",
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: "#F9FAFB",
              fontSize: 14,
              marginTop: 8,
            }}
          />

            <Text style={{ color: "#E5E7EB", fontSize: 13, marginTop: 8 }}>Tipo de cliente</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 4,
              }}
            >
              {[
                { value: "autonomo", label: "Autónomo" },
                { value: "empresa", label: "Empresa" },
              ].map((opt) => {
                const active = clientType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setClientType(opt.value)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: active ? "#22CC88" : "#020617",
                      borderWidth: 1,
                      borderColor: active ? "#22CC88" : "#1F2937",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#022c22" : "#E5E7EB",
                        fontSize: 12,
                        fontWeight: active ? "600" : "400",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ color: "#E5E7EB", fontSize: 13, marginTop: 8 }}>
              {clientType === "empresa"
                ? "Nombre de la empresa"
                : "Nombre comercial (opcional)"}
            </Text>
            <TextInput
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Nombre comercial"
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
              editable={!loadingProfile && !savingProfile}
              style={{
                backgroundColor: "#020617",
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#1F2937",
                paddingHorizontal: 14,
                paddingVertical: 8,
                color: "#F9FAFB",
                fontSize: 13,
                marginTop: 4,
              }}
            />

            <Text style={{ color: "#E5E7EB", fontSize: 13, marginTop: 8 }}>País (opcional)</Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="País"
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
              editable={!loadingProfile && !savingProfile}
              style={{
                backgroundColor: "#020617",
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#1F2937",
                paddingHorizontal: 14,
                paddingVertical: 8,
                color: "#F9FAFB",
                fontSize: 13,
                marginTop: 4,
              }}
            />

            <Text style={{ color: "#E5E7EB", fontSize: 13, marginTop: 16 }}>
              Email de tu gestoría (opcional)
            </Text>
            <TextInput
              value={gestoriaEmail}
              onChangeText={setGestoriaEmail}
              placeholder="gestoria@ejemplo.com"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={canEditGestoriaEmail && !loadingProfile && !savingProfile}
              style={{
                backgroundColor: "#020617",
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#1F2937",
                paddingHorizontal: 14,
                paddingVertical: 8,
                color: "#F9FAFB",
                fontSize: 13,
                marginTop: 4,
              }}
            />
            <Text style={{ color: "#9CA3AF", fontSize: 11, marginTop: 4 }}>
              {canEditGestoriaEmail
                ? "Usaremos este email para enviar tus facturas a tu gestor/asesor fiscal."
                : gestoriaEmailReason ||
                  "Solo los planes con envío a gestoría (Básico o Pro) permiten configurar el email de tu gestoría."}
            </Text>

            <View
              style={{
                height: 1,
                backgroundColor: "#111827",
                marginVertical: 10,
              }}
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={loadingProfile || savingProfile}
              style={{
                marginTop: 8,
                alignSelf: "flex-start",
                backgroundColor: "#22CC88",
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                opacity: loadingProfile || savingProfile ? 0.6 : 1,
              }}
            >
              {savingProfile && <ActivityIndicator size="small" color="#022c22" />}
              <Text
                style={{
                  color: "#022c22",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {savingProfile ? "Guardando..." : "Guardar cambios"}
              </Text>
            </TouchableOpacity>
          </View>

        {/* Planes y suscripción */}
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Plans")}
            style={{
              backgroundColor: "#1E3A5F",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: "#3B82F6",
            }}
          >
            <Ionicons name="card-outline" size={18} color="#93C5FD" />
            <Text style={{ color: "#93C5FD", fontSize: 14, fontWeight: "500" }}>
              Ver planes y suscripción
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cerrar sesión */}
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={signingOut}
            style={{
              backgroundColor: "#1F2937",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: "#374151",
            }}
          >
            {signingOut ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            )}
            <Text style={{ color: "#EF4444", fontSize: 14, fontWeight: "500" }}>
              {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "#6B7280", fontSize: 11, textAlign: "center", marginTop: 8 }}>
            Solo cierra sesión en este dispositivo
          </Text>
        </View>

        {/* Enlaces legales sutiles estilo footer */}
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={{ color: "#4B5563", fontSize: 10, textAlign: "center" }}>
            <Text
              style={{ textDecorationLine: "underline" }}
              onPress={() => Linking.openURL("https://faktugo.com/legal/terminos")}
            >
              Términos
            </Text>
            {"  ·  "}
            <Text
              style={{ textDecorationLine: "underline" }}
              onPress={() => Linking.openURL("https://faktugo.com/legal/privacidad")}
            >
              Privacidad
            </Text>
            {"  ·  "}
            <Text
              style={{ textDecorationLine: "underline" }}
              onPress={() => Linking.openURL("https://faktugo.com/legal/cookies")}
            >
              Cookies
            </Text>
          </Text>
        </View>

        {/* Eliminar cuenta */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
            Zona de peligro
          </Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Eliminar cuenta",
                "Para eliminar tu cuenta, accede desde la web en faktugo.com/dashboard. Debes cancelar tu suscripción primero si tienes una activa.",
                [{ text: "Entendido", style: "default" }]
              );
            }}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: "rgba(239, 68, 68, 0.3)",
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#FCA5A5" />
            <Text style={{ color: "#FCA5A5", fontSize: 14, fontWeight: "500" }}>
              Eliminar cuenta
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "#6B7280", fontSize: 11, textAlign: "center", marginTop: 8 }}>
            Esta acción es irreversible
          </Text>
        </View>
        </ScrollView>
      </View>
    );
  }

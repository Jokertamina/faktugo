import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";

export default function AccountScreen() {
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

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    async function load() {
      if (!supabase) {
        setLoadingUser(false);
        setLoadingProfile(false);
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
          .select("first_name,last_name,type,company_name,country,gestoria_email")
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
          setLoadingProfile(false);
        }
      } catch (e) {
        console.warn("Error inesperado al cargar Cuenta:", e);
        if (isMounted) {
          setLoadingUser(false);
          setLoadingProfile(false);
        }
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
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const isBusiness = clientType === "pyme" || clientType === "gestoria";

    if (!trimmedFirst || !trimmedLast) {
      Alert.alert("Nombre y apellidos", "Introduce nombre y apellidos para guardar la cuenta.");
      return;
    }

    if (isBusiness && !trimmedCompany) {
      Alert.alert(
        "Nombre de la empresa",
        "Para empresas o gestorias, indica el nombre de la empresa para guardar la cuenta."
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
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            display_name: fullName,
            first_name: trimmedFirst || null,
            last_name: trimmedLast || null,
            type: clientType,
            company_name: trimmedCompany || null,
            country: country.trim() || null,
            gestoria_email: gestoriaEmail.trim() || null,
          })
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
        const { error: insertError } = await supabase.from("profiles").insert({
          id: userId,
          display_name: safeFullName,
          first_name: trimmedFirst || null,
          last_name: trimmedLast || null,
          type: clientType,
          company_name: trimmedCompany || null,
          country: country.trim() || null,
          gestoria_email: gestoriaEmail.trim() || null,
        });

        if (insertError) {
          console.warn("No se pudo crear el perfil en Cuenta:", insertError);
          Alert.alert("No se pudo guardar", "Intentalo de nuevo mas tarde.");
          return;
        }
      }

      Alert.alert("Guardado", "Datos de cuenta actualizados.");
    } catch (e) {
      console.warn("Error inesperado al guardar Cuenta:", e);
      Alert.alert("No se pudo guardar", "Intentalo de nuevo mas tarde.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 24 }}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>FG</Text>
          </View>
          <View>
            <Text style={styles.title}>Cuenta</Text>
            <Text style={styles.subtitle}>
              Datos basicos de tu perfil en FaktuGo y el email de tu gestoria.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Tu cuenta</Text>
          <Text style={styles.sectionDescription}>
            Esta informacion se sincroniza con el panel web para que tu gestoria sepa quien eres.
          </Text>

          <View style={{ backgroundColor: "#0B1220", borderRadius: 16, padding: 14, gap: 8 }}>
            <Text style={{ color: "#E5E7EB", fontSize: 13 }}>Email principal</Text>
            {loadingUser ? (
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>Cargando...</Text>
            ) : (
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                {email ?? "No se pudo detectar el email del usuario."}
              </Text>
            )}

            <View
              style={{
                height: 1,
                backgroundColor: "#111827",
                marginVertical: 8,
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

            <Text style={{ color: "#E5E7EB", fontSize: 13, marginTop: 8 }}>Apellidos</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Apellidos"
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
                { value: "pyme", label: "Pyme" },
                { value: "gestoria", label: "Gestoría" },
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
              {clientType === "pyme" || clientType === "gestoria"
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

            <Text style={{ color: "#E5E7EB", fontSize: 13, marginTop: 8 }}>
              Email de la gestoria (opcional)
            </Text>
            <TextInput
              value={gestoriaEmail}
              onChangeText={setGestoriaEmail}
              placeholder="gestoria@ejemplo.com"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              keyboardType="email-address"
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

            <Text style={{ color: "#9CA3AF", fontSize: 11, marginTop: 4 }}>
              Usaremos estos datos para personalizar el envio de facturas a tu gestoria.
            </Text>

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
        </View>
      </ScrollView>
    </View>
  );
}

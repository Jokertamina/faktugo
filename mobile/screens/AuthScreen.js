import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState("autonomo"); // "autonomo" | "empresa"
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"

  const handleSignIn = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase no esta configurado en la app movil.");
      return;
    }

    if (!email || !password) {
      setError("Introduce email y contraseña.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.warn("Error al iniciar sesion en Supabase desde movil:", signInError);
        setError("No se pudo iniciar sesion. Revisa tus credenciales.");
      }
    } catch (e) {
      console.warn("Error inesperado en handleSignIn:", e);
      setError("Error inesperado al iniciar sesion.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase no esta configurado en la app movil.");
      return;
    }

    if (!email || !password) {
      setError("Introduce email y contraseña.");
      return;
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    if (!trimmedFirst || !trimmedLast) {
      setError("Nombre y apellidos son obligatorios para crear la cuenta.");
      return;
    }

    const trimmedCompany = companyName.trim();
    if (userType === "empresa" && !trimmedCompany) {
      setError("El nombre de la empresa es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      // Construir metadata sin valores null
      const metadata = {
        full_name: fullName,
        first_name: trimmedFirst,
        last_name: trimmedLast,
        type: userType,
      };
      if (trimmedCompany) {
        metadata.company_name = trimmedCompany;
      }
      if (country.trim()) {
        metadata.country = country.trim();
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
        },
      });

      if (signUpError) {
        console.warn("Error al registrar usuario en Supabase desde movil:", signUpError);
        setError("No se pudo crear la cuenta. Revisa los datos o prueba mas tarde.");
        return;
      }

      if (!data.session) {
        setInfo(
          "Cuenta creada. Revisa tu correo para confirmar el registro antes de iniciar sesion."
        );
      } else {
        setInfo("Cuenta creada e iniciada sesion.");
      }
    } catch (e) {
      console.warn("Error inesperado en handleSignUp:", e);
      setError("Error inesperado al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const isSignin = mode === "signin";
  const title = isSignin ? "Iniciar sesión" : "Crear cuenta";
  const description = isSignin
    ? "Usa las mismas credenciales que en la web para ver y subir tus facturas desde el movil."
    : "Crea tu cuenta para empezar a subir facturas desde el movil y la web.";

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>FG</Text>
        </View>
        <View>
          <Text style={styles.title}>FaktuGo</Text>
          <Text style={styles.subtitle}>Accede para sincronizar tus facturas</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>

      <View style={{ marginTop: 12, gap: 10 }}>
        {!isSignin && (
          <>
            <View>
              <Text style={{ color: "#E5E7EB", fontSize: 12, marginBottom: 4 }}>Nombre</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nombre"
                placeholderTextColor="#6B7280"
                autoCapitalize="words"
                style={{
                  backgroundColor: "#020617",
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#1F2937",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: "#F9FAFB",
                  fontSize: 13,
                  marginBottom: 8,
                }}
              />
            </View>

            <View>
              <Text style={{ color: "#E5E7EB", fontSize: 12, marginBottom: 4 }}>Apellidos</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Apellidos"
                placeholderTextColor="#6B7280"
                autoCapitalize="words"
                style={{
                  backgroundColor: "#020617",
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#1F2937",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: "#F9FAFB",
                  fontSize: 13,
                  marginBottom: 8,
                }}
              />
            </View>

            <View>
              <Text style={{ color: "#E5E7EB", fontSize: 12, marginBottom: 4 }}>Tipo de cuenta</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setUserType("autonomo")}
                  style={{
                    flex: 1,
                    backgroundColor: userType === "autonomo" ? "#1E3A5F" : "#020617",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: userType === "autonomo" ? "#3B82F6" : "#1F2937",
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: userType === "autonomo" ? "#93C5FD" : "#9CA3AF", fontSize: 13 }}>
                    Autónomo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setUserType("empresa")}
                  style={{
                    flex: 1,
                    backgroundColor: userType === "empresa" ? "#1E3A5F" : "#020617",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: userType === "empresa" ? "#3B82F6" : "#1F2937",
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: userType === "empresa" ? "#93C5FD" : "#9CA3AF", fontSize: 13 }}>
                    Empresa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text style={{ color: "#E5E7EB", fontSize: 12, marginBottom: 4 }}>
                {userType === "empresa" ? "Nombre de la empresa" : "Nombre comercial (opcional)"}
              </Text>
              <TextInput
                value={companyName}
                onChangeText={setCompanyName}
                placeholder={userType === "empresa" ? "Mi Empresa S.L." : "Opcional"}
                placeholderTextColor="#6B7280"
                autoCapitalize="words"
                style={{
                  backgroundColor: "#020617",
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#1F2937",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: "#F9FAFB",
                  fontSize: 13,
                }}
              />
            </View>

            <View>
              <Text style={{ color: "#E5E7EB", fontSize: 12, marginBottom: 4 }}>País (opcional)</Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="España"
                placeholderTextColor="#6B7280"
                autoCapitalize="words"
                style={{
                  backgroundColor: "#020617",
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#1F2937",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: "#F9FAFB",
                  fontSize: 13,
                }}
              />
            </View>
          </>
        )}
        <View>
          <Text style={{ color: "#E5E7EB", fontSize: 12, marginBottom: 4 }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: "#020617",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#1F2937",
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: "#F9FAFB",
              fontSize: 13,
            }}
          />
        </View>

        <View>
          <Text style={{ color: "#E5E7EB", fontSize: 12, marginBottom: 4 }}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#6B7280"
            secureTextEntry
            autoCapitalize="none"
            style={{
              backgroundColor: "#020617",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#1F2937",
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: "#F9FAFB",
              fontSize: 13,
            }}
          />
        </View>

        {error && (
          <Text style={{ color: "#FCA5A5", fontSize: 12, marginTop: 4 }}>{error}</Text>
        )}
        {info && !error && (
          <Text style={{ color: "#6EE7B7", fontSize: 12, marginTop: 4 }}>{info}</Text>
        )}

        <TouchableOpacity
          style={{
            marginTop: 8,
            backgroundColor: "#22CC88",
            borderRadius: 999,
            paddingVertical: 12,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
          onPress={isSignin ? handleSignIn : handleSignUp}
          disabled={loading}
        >
          {loading && <ActivityIndicator size="small" color="#022c22" />}
          <Text
            style={{
              color: "#022c22",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {loading
              ? isSignin
                ? "Iniciando sesión..."
                : "Creando cuenta..."
              : isSignin
              ? "Entrar"
              : "Crear cuenta"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 12, alignItems: "center" }}
          onPress={() => {
            setMode(isSignin ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
        >
          <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
            {isSignin
              ? "¿No tienes cuenta? Crea una cuenta"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

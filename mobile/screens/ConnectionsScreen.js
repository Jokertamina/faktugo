import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { styles } from "../styles";
import { getSupabaseClient } from "../supabaseClient";

export default function ConnectionsScreen() {
  const [email, setEmail] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    async function loadUser() {
      if (!supabase) {
        setLoadingUser(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("No se pudo obtener el usuario en Conexiones:", error);
        }

        const user = data?.user ?? null;

        if (isMounted) {
          setEmail(user?.email ?? null);
          setLoadingUser(false);
        }
      } catch (e) {
        console.warn("Error inesperado al cargar usuario/perfil en Conexiones:", e);
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Error al cerrar sesion desde Conexiones:", error);
        Alert.alert("No se pudo cerrar sesion", "Intentalo de nuevo mas tarde.");
      }
      // App escuchara el cambio de sesion y navegara a AuthScreen.
    } catch (e) {
      console.warn("Error inesperado al cerrar sesion:", e);
      Alert.alert("No se pudo cerrar sesion", "Intentalo de nuevo mas tarde.");
    } finally {
      setSigningOut(false);
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
            <Text style={styles.title}>Conexiones</Text>
            <Text style={styles.subtitle}>
              Configura aqui las integraciones con otras fuentes y atajos con tu gestoria.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Fuentes de documentos</Text>
          <Text style={styles.sectionDescription}>
            Aqui conectaras otras fuentes ademas de la camara del movil (Drive, correo,
            etc.).
          </Text>

          <View style={{ backgroundColor: "#0B1220", borderRadius: 16, padding: 14, gap: 12 }}>
            <TouchableOpacity disabled style={{ opacity: 0.7 }}>
              <Text style={{ color: "#E5E7EB", fontSize: 13 }}>
                Conectar Google Drive (proximamente)
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                Sube carpetas de facturas desde tu unidad de Drive para procesarlas en bloque.
              </Text>
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: "#111827",
                marginVertical: 8,
              }}
            />

            <TouchableOpacity disabled style={{ opacity: 0.7 }}>
              <Text style={{ color: "#E5E7EB", fontSize: 13 }}>
                Correo interno FaktuGo (proximamente)
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                Pronto tendras una direccion especial (tipo usuario@invoice.faktugo.com)
                para reenviar facturas y que se guarden automaticamente en tu cuenta.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Acciones rapidas</Text>
          <Text style={styles.sectionDescription}>
            Atajos que conectaran tu app con la gestoria.
          </Text>

          <TouchableOpacity
            disabled
            style={{
              backgroundColor: "#2A5FFF",
              borderRadius: 999,
              paddingVertical: 10,
              alignItems: "center",
              opacity: 0.7,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
              Enviar facturas del mes a la gestoria (proximamente)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            disabled={signingOut}
            style={{
              backgroundColor: "#111827",
              borderRadius: 999,
              paddingVertical: 10,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {signingOut && <ActivityIndicator size="small" color="#F9FAFB" />}
            <Text style={{ color: "#F9FAFB", fontSize: 13, fontWeight: "500" }}>
              {signingOut ? "Cerrando sesion..." : "Cerrar sesion"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

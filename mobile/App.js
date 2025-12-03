import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, BackHandler, Platform, ToastAndroid, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchInvoicesFromSupabase } from "./api";
import { getSupabaseClient } from "./supabaseClient";
import { styles } from "./styles";
import { buildInvoices } from "./domain/invoice";
import { loadInvoicesFromStorage, saveInvoicesToStorage } from "./storage/localInvoices";
import HomeScreen from "./screens/HomeScreen";
import InvoicesScreen from "./screens/InvoicesScreen";
import InvoiceDetailScreen from "./screens/InvoiceDetailScreen";
import AuthScreen from "./screens/AuthScreen";
import ConnectionsScreen from "./screens/ConnectionsScreen";
import AccountScreen from "./screens/AccountScreen";
import PlansScreen from "./screens/PlansScreen";

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync().catch(() => {});

const INITIAL_INVOICES_RAW = [
  {
    id: "1",
    date: "2025-02-14",
    supplier: "REPSOL",
    category: "Gasolina",
    amount: "45.60 EUR",
  },
  {
    id: "2",
    date: "2025-02-13",
    supplier: "MERCADONA",
    category: "Dietas",
    amount: "32.10 EUR",
  },
  {
    id: "3",
    date: "2025-02-11",
    supplier: "AMAZON",
    category: "Compras",
    amount: "89.99 EUR",
  },
];

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ invoices, setInvoices, refreshInvoices }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#22CC88",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#0B1220",
          borderTopColor: "#1F2937",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 0,
          marginBottom: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Invoices") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Connections") {
            iconName = focused ? "link" : "link-outline";
          } else if (route.name === "Account") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{ title: "Inicio" }}
      >
        {(props) => (
          <HomeScreen
            {...props}
            invoices={invoices}
            setInvoices={setInvoices}
            refreshInvoices={refreshInvoices}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Invoices"
        options={{ title: "Facturas" }}
      >
        {(props) => (
          <InvoicesScreen
            {...props}
            invoices={invoices}
            refreshInvoices={refreshInvoices}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Connections"
        options={{ title: "Conexiones" }}
      >
        {(props) => <ConnectionsScreen {...props} invoices={invoices} onRefresh={refreshInvoices} />}
      </Tab.Screen>
      <Tab.Screen
        name="Account"
        options={{ title: "Cuenta" }}
      >
        {(props) => <AccountScreen {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState(buildInvoices(INITIAL_INVOICES_RAW));
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const navigationRef = useNavigationContainerRef();
  const [lastBackPress, setLastBackPress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    if (!supabase) {
      setAuthChecking(false);
      return;
    }

    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Error al obtener sesion de Supabase en movil:", error);
        }
        if (isMounted) {
          setUser(data?.session?.user ?? null);
          setAuthChecking(false);
        }
      } catch (e) {
        console.warn("Error inesperado en initAuth:", e);
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    }

    initAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const local = await loadInvoicesFromStorage();
        if (isMounted && local && Array.isArray(local) && local.length > 0) {
          setInvoices(local);
        }
      } catch {}
      finally {
        setIsLoading(false);
      }

      try {
        const data = await fetchInvoicesFromSupabase();
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          const normalized = buildInvoices(data);
          setInvoices(normalized);
          await saveInvoicesToStorage(normalized);
        }
      } catch (error) {
        console.warn("No se pudo sincronizar con Supabase (facturas):", error);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    // Guardar en segundo plano siempre que cambien las facturas
    if (!invoices) return;
    saveInvoicesToStorage(invoices);
  }, [invoices]);

  const refreshInvoices = async () => {
    try {
      const data = await fetchInvoicesFromSupabase();
      if (data && Array.isArray(data) && data.length > 0) {
        const normalized = buildInvoices(data);
        setInvoices(normalized);
        await saveInvoicesToStorage(normalized);
      }
    } catch (error) {
      console.warn("No se pudo refrescar facturas:", error);
    }
  };

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      if (!navigationRef.isReady()) {
        return false;
      }

      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }

      const now = Date.now();
      if (now - lastBackPress < 2000) {
        BackHandler.exitApp();
        return true;
      }

      setLastBackPress(now);
      ToastAndroid.show("Pulsa de nuevo para salir", ToastAndroid.SHORT);
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      subscription.remove();
    };
  }, [navigationRef, lastBackPress]);

  const supabase = getSupabaseClient();
  const mustAuth = !!supabase && !user;
  const isBooting = isLoading || authChecking;

  useEffect(() => {
    if (!isBooting) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isBooting]);

  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        {mustAuth ? (
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Auth" component={AuthScreen} />
          </RootStack.Navigator>
        ) : (
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="MainTabs">
              {() => <MainTabs invoices={invoices} setInvoices={setInvoices} refreshInvoices={refreshInvoices} />}
            </RootStack.Screen>
            <RootStack.Screen name="InvoiceDetail">
              {(props) => (
                <InvoiceDetailScreen
                  {...props}
                  invoices={invoices}
                  onRefresh={refreshInvoices}
                />
              )}
            </RootStack.Screen>
            <RootStack.Screen name="Plans" component={PlansScreen} />
          </RootStack.Navigator>
        )}
      </SafeAreaView>
    </NavigationContainer>
  );
}

import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initializeDatabase } from "@/database/migrations/init";
import { configureDatabase } from "@/database/sqlite";
import { useTheme } from "@/shared/hooks/use-theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { navigationTheme } = useTheme();

  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapApp() {
      await configureDatabase();
      await initializeDatabase();

      if (isMounted) {
        setIsDatabaseReady(true);
        await SplashScreen.hideAsync();
      }
    }

    bootstrapApp().catch((error) => {
      console.error("Failed to initialize database", error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isDatabaseReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="products-form" options={{ headerShown: true }} />
          <Stack.Screen name="materials-form" options={{ headerShown: true }} />
          <Stack.Screen name="expenses-form" options={{ headerShown: true }} />
          <Stack.Screen name="sales-form" options={{ headerShown: true }} />
          <Stack.Screen name="settings" options={{ headerShown: true, title: "Configurações" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

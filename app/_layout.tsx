import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { initializeDatabase } from "@/database/migrations/init";
import { configureDatabase } from "@/database/sqlite";
import { useTheme } from "@/shared/hooks/use-theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const { navigationTheme } = useTheme();

  useEffect(() => {
    configureDatabase().then(() => {
      initializeDatabase();
    });
  }, []);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="products-form" options={{ headerShown: true }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}


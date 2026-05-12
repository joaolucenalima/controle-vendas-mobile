import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  type Theme as NavigationTheme,
} from "@react-navigation/native";
import { useMemo } from "react";
import { useColorScheme as useNativeColorScheme } from "react-native";

import {
  Colors,
  Fonts,
  type ThemeColors,
  type ThemeFonts,
  type ThemeName,
} from "@/shared/constants/theme";

export type AppTheme = {
  colorScheme: ThemeName;
  isDark: boolean;
  colors: ThemeColors;
  fonts: ThemeFonts;
  navigationTheme: NavigationTheme;
};

const navigationThemes: Record<ThemeName, NavigationTheme> = {
  light: {
    ...NavigationLightTheme,
    colors: {
      ...NavigationLightTheme.colors,
      primary: Colors.light.tint,
      background: Colors.light.background,
      card: Colors.light.surface,
      text: Colors.light.text,
      border: Colors.light.border,
      notification: Colors.light.error,
    },
  },
  dark: {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      primary: Colors.dark.tint,
      background: Colors.dark.background,
      card: Colors.dark.surface,
      text: Colors.dark.text,
      border: Colors.dark.border,
      notification: Colors.dark.error,
    },
  },
};

export function useTheme(): AppTheme {
  const systemScheme = useNativeColorScheme();
  const colorScheme: ThemeName = systemScheme === "dark" ? "dark" : "light";

  return useMemo(() => {
    const colors = Colors[colorScheme];

    return {
      colorScheme,
      isDark: colorScheme === "dark",
      colors,
      fonts: Fonts,
      navigationTheme: navigationThemes[colorScheme],
    };
  }, [colorScheme]);
}

import { useMemo } from "react";

import type { ThemeColors, ThemeFonts, ThemeName } from "@/shared/constants/theme";
import { useTheme } from "@/shared/hooks/use-theme";

export type StylesProps = {
  colors: ThemeColors;
  fonts: ThemeFonts;
  colorScheme: ThemeName;
  isDark: boolean;
};

export function useStyles<T>(stylesCallback: (props: StylesProps) => T): T {
  const { colors, fonts, colorScheme, isDark } = useTheme();

  return useMemo(
    () => stylesCallback({ colors, fonts, colorScheme, isDark }) as T,
    [colors, fonts, colorScheme, isDark, stylesCallback],
  );
}

import { StyleSheet, Text, type TextProps } from "react-native";

import { StylesProps, useStyles } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?: "default" | "title" | "secondary" | "defaultSemiBold" | "subtitle" | "error";
};

export default function ThemedText({ style, type = "default", ...rest }: ThemedTextProps) {
  const { colors } = useTheme();
  const styles = useStyles(createThemeTextStyles);

  return <Text style={[{ color: colors.text }, styles[type], style]} {...rest} />;
}

const createThemeTextStyles = ({ colors }: StylesProps) =>
  StyleSheet.create({
    default: {
      fontSize: 16,
      lineHeight: 24,
    },
    defaultSemiBold: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "600",
    },
    secondary: {
      fontSize: 16,
      color: colors.textMuted,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      lineHeight: 28,
    },
    subtitle: {
      fontSize: 20,
      fontWeight: "bold",
    },
    error: {
      color: colors.error,
      fontSize: 14,
    },
  });

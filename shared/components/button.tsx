import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import ThemedText from "./themed-text";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  flex?: boolean;
  fullWidth?: boolean;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  loading = false,
  loadingLabel,
  disabled = false,
  flex = false,
  fullWidth = true,
  bordered = true,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const isDisabled = disabled || loading;
  const displayLabel = loading && loadingLabel ? loadingLabel : label;

  const spinnerColor =
    variant === "secondary" ? theme.colors.tint : theme.colors.background;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        variant === "secondary" && !bordered && styles.secondaryFlat,
        fullWidth && styles.fullWidth,
        flex && styles.flex,
        (pressed || isDisabled) && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading && !loadingLabel ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <ThemedText
          style={[styles.label, styles[`${variant}Label` as const], styles[`${size}Label` as const]]}
        >
          {displayLabel}
        </ThemedText>
      )}
    </Pressable>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    base: {
      alignItems: "center",
      justifyContent: "center",
    },
    fullWidth: {
      width: "100%",
    },
    flex: {
      flex: 1,
    },
    pressed: {
      opacity: 0.86,
    },
    disabled: {
      opacity: 0.6,
    },
    sm: {
      borderRadius: 14,
      paddingVertical: 12,
    },
    md: {
      borderRadius: 14,
      paddingVertical: 12,
    },
    lg: {
      borderRadius: 16,
      paddingVertical: 14,
    },
    primary: {
      backgroundColor: colors.tint,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryFlat: {
      borderWidth: 0,
    },
    danger: {
      backgroundColor: colors.red,
    },
    label: {
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    smLabel: {
      fontSize: 14,
    },
    mdLabel: {
      fontSize: 15,
    },
    lgLabel: {
      fontSize: 16,
    },
    primaryLabel: {
      color: colors.background,
    },
    secondaryLabel: {
      color: colors.text,
    },
    dangerLabel: {
      color: colors.background,
    },
  });

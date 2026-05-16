import { useMemo } from "react";
import { StyleSheet, TextInput, type StyleProp, type TextStyle } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";

export type PriceInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: StyleProp<TextStyle>;
};

function formatFromValue(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const cents = Number(digits);
  if (!Number.isFinite(cents)) return "";

  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

  return `R$ ${formatted}`;
}

export function PriceInput({
  value,
  onChangeText,
  onBlur,
  placeholder = "R$ 0,00",
  placeholderTextColor,
  style,
}: PriceInputProps) {
  const { colors } = useTheme();

  const displayValue = useMemo(() => formatFromValue(value), [value]);

  return (
    <TextInput
      value={displayValue}
      onChangeText={(text) => {
        const nextValue = formatFromValue(text);
        onChangeText(nextValue);
      }}
      onBlur={onBlur}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor ?? colors.textMuted}
      keyboardType="numeric"
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 44,
  },
});


import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { IconSymbol } from "./ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";

type QuantityInputProps = {
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
};

function parseQuantity(text: string): number | null {
  const digits = text.replace(/\D/g, "");
  if (!digits) return null;

  const parsed = Number(digits);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return null;
  return parsed;
}

export function QuantityInput({ value, onChange, min = 1 }: QuantityInputProps) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [focused, value]);

  function commitDraft(text: string) {
    const parsed = parseQuantity(text);

    if (parsed === null || parsed < min) {
      onChange(min);
      setDraft(String(min));
      return;
    }

    onChange(parsed);
    setDraft(String(parsed));
  }

  function handleDecrease() {
    const next = value - 1;
    onChange(next);
    if (focused) setDraft(String(next < min ? min : next));
  }

  function handleIncrease() {
    const next = value + 1;
    onChange(next);
    if (focused) setDraft(String(next));
  }

  return (
    <View style={styles.root}>
      <Pressable
        onPress={handleDecrease}
        accessibilityRole="button"
        accessibilityLabel="Diminuir quantidade"
        style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperPressed]}
      >
        <IconSymbol name="minus" size={12} color={theme.colors.background} />
      </Pressable>

      <TextInput
        value={focused ? draft : String(value)}
        onChangeText={(text) => setDraft(text.replace(/\D/g, ""))}
        onFocus={() => {
          setFocused(true);
          setDraft(String(value));
        }}
        onBlur={() => {
          setFocused(false);
          commitDraft(draft);
        }}
        keyboardType="number-pad"
        selectTextOnFocus
        maxLength={6}
        accessibilityLabel="Quantidade"
        style={styles.input}
      />

      <Pressable
        onPress={handleIncrease}
        accessibilityRole="button"
        accessibilityLabel="Aumentar quantidade"
        style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperPressed]}
      >
        <IconSymbol name="plus" size={12} color={theme.colors.background} />
      </Pressable>
    </View>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    root: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    stepperButton: {
      width: 24,
      height: 24,
      borderRadius: 14,
      backgroundColor: colors.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperPressed: {
      opacity: 0.82,
    },
    input: {
      minWidth: 44,
      maxWidth: 72,
      height: 32,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      textAlign: "center",
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      fontSize: 15,
    },
  });

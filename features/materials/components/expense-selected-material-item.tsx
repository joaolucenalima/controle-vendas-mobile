import { Pressable, StyleSheet, View } from "react-native";

import type { Material } from "@/features/materials/material.types";
import { IconSymbol, PriceInput, QuantityInput, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { parsePriceDigitsToCents } from "@/shared/utils/parse-price-to-cents";

type ExpenseSelectedMaterialItemProps = {
  material: Material;
  quantity: number;
  unitPriceInCents: number;
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (unitPriceInCents: number) => void;
  onRemove: () => void;
};

export function ExpenseSelectedMaterialItem({
  material,
  quantity,
  unitPriceInCents,
  onQuantityChange,
  onUnitPriceChange,
  onRemove,
}: ExpenseSelectedMaterialItemProps) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const lineTotal = quantity * unitPriceInCents;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remover ${material.name}`}
        hitSlop={8}
        style={({ pressed }) => [styles.removeButton, pressed && styles.removePressed]}
      >
        <IconSymbol name="trash" size={18} color={theme.colors.error} />
      </Pressable>

      <View style={styles.materialInfo}>
        <ThemedText style={styles.materialName}>{material.name}</ThemedText>

        <PriceInput
          value={String(unitPriceInCents)}
          onChangeText={(text) => onUnitPriceChange(parsePriceDigitsToCents(text))}
          placeholder="R$ 0,00"
          style={styles.unitPriceInput}
        />
      </View>

      <View style={styles.rightArea}>
        <QuantityInput value={quantity} onChange={onQuantityChange} />

        <ThemedText style={styles.lineTotal}>{formatCentsToCurrency(lineTotal)}</ThemedText>
      </View>
    </View>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 10,
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    materialInfo: {
      flex: 1,
      gap: 8,
      justifyContent: "space-between",
    },
    materialName: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    materialBasePrice: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    materialBasePriceMuted: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      fontStyle: "italic",
    },
    removeButton: {
      padding: 4,
    },
    removePressed: {
      opacity: 0.7,
    },
    rightArea: {
      alignItems: "flex-end",
      gap: 8,
    },
    unitPriceInput: {
      width: 120,
      minHeight: 32,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      textAlign: "center",
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      fontSize: 12,
    },
    lineTotal: {
      fontSize: 14,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "700",
      minWidth: 88,
      textAlign: "right",
    },
  });


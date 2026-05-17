import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Product } from "@/features/products/product.types";
import { QuantityInput } from "@/shared/components/quantity-input";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";

type SaleSelectedProductItemProps = {
  product: Product;
  quantity: number;
  unitPriceInCents: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

export function SaleSelectedProductItem({
  product,
  quantity,
  unitPriceInCents,
  onQuantityChange,
  onRemove,
}: SaleSelectedProductItemProps) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const lineTotal = quantity * unitPriceInCents;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remover ${product.name}`}
        hitSlop={8}
        style={({ pressed }) => [styles.removeButton, pressed && styles.removePressed]}
      >
        <IconSymbol name="trash" size={18} color={theme.colors.error} />
      </Pressable>

      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.unitPrice}>{formatCentsToCurrency(unitPriceInCents)}</Text>
      </View>

      <View style={styles.rightArea}>
        <QuantityInput value={quantity} onChange={onQuantityChange} />

        <Text style={styles.lineTotal}>{formatCentsToCurrency(lineTotal)}</Text>
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
    productInfo: {
      flex: 1,
      gap: 6,
    },
    productName: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
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
    unitPrice: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
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


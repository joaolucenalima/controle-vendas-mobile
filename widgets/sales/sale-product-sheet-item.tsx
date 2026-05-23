import { Pressable, StyleSheet, View } from "react-native";

import type { Product } from "@/features/products/product.types";
import ThemedText from "@/shared/components/themed-text";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";

type SaleProductSheetItemProps = {
  product: Product;
  selected: boolean;
  onToggle: () => void;
};

export function SaleProductSheetItem({ product, selected, onToggle }: SaleProductSheetItemProps) {
  const styles = useStyles(createStyles);

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected ? <ThemedText style={styles.checkboxLabel}>✓</ThemedText> : null}
      </View>

      <View style={styles.productInfo}>
        <ThemedText style={styles.productName}>{product.name}</ThemedText>
        {product.description ? (
          <ThemedText style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </ThemedText>
        ) : (
          <ThemedText style={styles.productDescriptionMuted}>Sem descrição</ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    cardSelected: {
      borderColor: colors.tint,
    },
    pressed: {
      opacity: 0.88,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    checkboxSelected: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    checkboxLabel: {
      color: colors.background,
      fontSize: 13,
      fontWeight: "700",
    },
    productInfo: {
      flex: 1,
      gap: 4,
    },
    productName: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    productDescription: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    productDescriptionMuted: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      fontStyle: "italic",
    },
  });


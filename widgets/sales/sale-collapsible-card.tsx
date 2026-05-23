import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { SaleService } from "@/features/sales/sale-service";
import type { Sale, SaleWithItems } from "@/features/sales/sale.types";
import ThemedText from "@/shared/components/themed-text";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";

type SaleCollapsibleCardProps = {
  sale: Sale;
  productNamesById: Record<number, string>;
  onEdit: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function SaleItemRow({
  productName,
  quantity,
  unitPriceInCents,
  subtotalInCents,
}: {
  productName: string;
  quantity: number;
  unitPriceInCents: number;
  subtotalInCents: number;
}) {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemLeft}>
        <ThemedText style={styles.itemName}>{productName}</ThemedText>
        <ThemedText style={styles.itemMeta}>
          Qtd. {quantity} · {formatCentsToCurrency(unitPriceInCents)}
        </ThemedText>
      </View>
      <ThemedText style={styles.itemSubtotal}>{formatCentsToCurrency(subtotalInCents)}</ThemedText>
    </View>
  );
}

export function SaleCollapsibleCard({ sale, productNamesById, onEdit }: SaleCollapsibleCardProps) {
  const styles = useStyles(createStyles);
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<SaleWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (nextExpanded && !details && !isLoading) {
      setIsLoading(true);
      try {
        const loaded = await SaleService.getSaleById(sale.id);
        setDetails(loaded);
      } finally {
        setIsLoading(false);
      }
    }
  }

  const saleDetails = details ?? null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          onPress={handleToggle}
          style={({ pressed }) => [styles.toggleArea, pressed && styles.cardPressed]}
        >
          <View style={styles.headerLeft}>
            <ThemedText style={styles.dateText}>{formatDate(sale.sold_at)}</ThemedText>
            <ThemedText style={styles.totalText}>
              {formatCentsToCurrency(sale.total_in_cents)}
            </ThemedText>
          </View>
          <ThemedText style={styles.chevron}>{expanded ? "▴" : "▾"}</ThemedText>
        </Pressable>

        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [styles.editButton, pressed && styles.cardPressed]}
        >
          <ThemedText style={styles.editLabel}>Editar</ThemedText>
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.details}>
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={theme.colors.tint} />
              <ThemedText style={styles.loadingText}>Carregando itens...</ThemedText>
            </View>
          ) : saleDetails?.items.length ? (
            <>
              {saleDetails.items.map((item) => (
                <SaleItemRow
                  key={item.id}
                  productName={productNamesById[item.product_id] ?? `Produto #${item.product_id}`}
                  quantity={item.quantity}
                  unitPriceInCents={item.unit_price_in_cents}
                  subtotalInCents={item.subtotal_in_cents}
                />
              ))}

              <View style={styles.footer}>
                <ThemedText style={styles.footerLabel}>Desconto</ThemedText>
                <ThemedText style={styles.footerValue}>
                  {formatCentsToCurrency(sale.discount_in_cents)}
                </ThemedText>
              </View>

              {saleDetails.notes ? (
                <ThemedText style={styles.notes}>{saleDetails.notes}</ThemedText>
              ) : null}
            </>
          ) : (
            <ThemedText style={styles.emptyItems}>Sem itens para exibir.</ThemedText>
          )}
        </View>
      ) : null}
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
      overflow: "hidden",
    },
    headerRow: {
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    toggleArea: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    headerLeft: {
      flex: 1,
      gap: 4,
    },
    dateText: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    totalText: {
      fontSize: 18,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    editButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surface,
    },
    editLabel: {
      fontSize: 12,
      color: colors.text,
      fontFamily: fonts.sans,
    },
    chevron: {
      fontSize: 16,
      color: colors.textMuted,
    },
    cardPressed: {
      opacity: 0.82,
    },
    details: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
    },
    loadingWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    loadingText: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    itemLeft: {
      flex: 1,
      gap: 4,
    },
    itemName: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    itemMeta: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    itemSubtotal: {
      fontSize: 14,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "500",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    footerValue: {
      fontSize: 13,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    notes: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      lineHeight: 18,
    },
    emptyItems: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
  });


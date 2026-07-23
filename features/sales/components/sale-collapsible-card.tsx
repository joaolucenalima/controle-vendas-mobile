import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { SaleService } from "@/features/sales/sale-service";
import type { Sale, SaleWithItems } from "@/features/sales/sale.types";
import { IconSymbol, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { formatDateToDisplay } from "@/shared/utils/format-date";

type SaleCollapsibleCardProps = {
  sale: Sale;
  onEdit: () => void;
  onPrint: () => void;
};

export function SaleCollapsibleCard({ sale, onEdit, onPrint }: SaleCollapsibleCardProps) {
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Recolher" : "Expandir"} venda ${sale.id}`}
        accessibilityState={{ expanded }}
        onPress={handleToggle}
        style={({ pressed }) => [styles.headerRow, pressed && styles.cardPressed]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.saleIdentity}>
            <View style={styles.saleBadge}>
              <ThemedText style={styles.saleBadgeText}>#{sale.id}</ThemedText>
            </View>
            <ThemedText style={styles.dateText}>{formatDateToDisplay(sale.sold_at)}</ThemedText>
          </View>
          <ThemedText style={styles.totalLabel}>Total da venda</ThemedText>
          <ThemedText style={styles.totalText}>
            {formatCentsToCurrency(sale.total_in_cents)}
          </ThemedText>
        </View>
        <View style={styles.chevronButton}>
          <IconSymbol
            name="chevron.down"
            size={22}
            color={theme.colors.textMuted}
            style={expanded ? styles.chevronExpanded : undefined}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={theme.colors.tint} />
              <ThemedText style={styles.loadingText}>Carregando itens...</ThemedText>
            </View>
          ) : saleDetails?.items.length ? (
            <>
              <View style={styles.itemsSection}>
                <ThemedText style={styles.sectionLabel}>ITENS DA VENDA</ThemedText>
                {saleDetails.items.map((item, index) => (
                  <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemRowBorder]}>
                    <View style={styles.itemLeft}>
                      <ThemedText style={styles.itemName}>{item.product_name}</ThemedText>
                      <ThemedText style={styles.itemMeta}>
                        Qtd. {item.quantity} · {formatCentsToCurrency(item.unit_price_in_cents)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.itemSubtotal}>
                      {formatCentsToCurrency(item.subtotal_in_cents)}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {sale.discount_in_cents > 0 ? (
                <View style={styles.footer}>
                  <ThemedText style={styles.footerLabel}>Desconto</ThemedText>
                  <ThemedText style={styles.footerValue}>
                    {formatCentsToCurrency(sale.discount_in_cents)}
                  </ThemedText>
                </View>
              ) : null}

              {saleDetails.notes ? (
                <View style={styles.notesBox}>
                  <ThemedText style={styles.sectionLabel}>OBSERVAÇÕES</ThemedText>
                  <ThemedText style={styles.notes}>{saleDetails.notes}</ThemedText>
                </View>
              ) : null}
            </>
          ) : (
            <ThemedText style={styles.emptyItems}>Sem itens para exibir.</ThemedText>
          )}

          {!isLoading ? (
            <View style={styles.actions}>
              <Pressable
                onPress={onEdit}
                accessibilityRole="button"
                accessibilityLabel={`Editar venda ${sale.id}`}
                style={({ pressed }) => [styles.actionButton, pressed && styles.cardPressed]}
              >
                <IconSymbol name="pencil" size={18} color={theme.colors.text} />
                <ThemedText style={styles.editLabel}>Editar</ThemedText>
              </Pressable>
              <Pressable
                onPress={onPrint}
                accessibilityRole="button"
                accessibilityLabel={`Imprimir venda ${sale.id}`}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.printButton,
                  pressed && styles.cardPressed,
                ]}
              >
                <IconSymbol
                  name="printer.fill.and.paper.fill"
                  size={18}
                  color={theme.colors.background}
                />
                <ThemedText style={styles.printLabel}>Imprimir</ThemedText>
              </Pressable>
            </View>
          ) : null}
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
    headerLeft: {
      flex: 1,
    },
    saleIdentity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    saleBadge: {
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 4,
      backgroundColor: colors.tintSoft,
    },
    saleBadgeText: {
      fontSize: 12,
      color: colors.tint,
      fontFamily: fonts.rounded,
      fontWeight: "700",
    },
    dateText: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    totalText: {
      fontSize: 20,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    totalLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    editLabel: {
      fontSize: 14,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    chevronButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    chevronExpanded: {
      transform: [{ rotate: "180deg" }],
    },
    cardPressed: {
      opacity: 0.82,
    },
    details: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 0,
    },
    loadingWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 16,
    },
    loadingText: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    itemsSection: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sectionLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      fontWeight: "700",
      letterSpacing: 0.7,
      marginBottom: 2,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    itemRowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      marginHorizontal: 16,
      paddingVertical: 14,
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
    notesBox: {
      marginHorizontal: 16,
      marginBottom: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    printButton: {
      borderColor: colors.tint,
      backgroundColor: colors.tint,
    },
    printLabel: {
      fontSize: 14,
      color: colors.background,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    emptyItems: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      padding: 16,
    },
  });


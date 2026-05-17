import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useDashboardStore } from "@/features/dashboard/dashboard-store";
import { useProductStore } from "@/features/products/product-store";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { TabsScreenLayout } from "@/shared/layouts/tabs-screen-layout";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { getTodayDateFilterKey } from "@/shared/utils/format-date-filter";

function formatSaleDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function HomeScreen() {
  const router = useRouter();
  const styles = useStyles(getStyles);
  const theme = useTheme();

  const { metrics, lastSale, loadMetrics, loadLastSale } = useDashboardStore();
  const { products, loadProducts } = useProductStore();

  const [isLoading, setIsLoading] = useState(true);

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
  }, []);

  const productNamesById = useMemo(() => {
    return products.reduce<Record<number, string>>((accumulator, product) => {
      accumulator[product.id] = product.name;
      return accumulator;
    }, {});
  }, [products]);

  const profitInCents = metrics.salesAmount - metrics.expensesAmount;
  const marginPercent =
    metrics.salesAmount > 0 ? Math.round((profitInCents / metrics.salesAmount) * 100) : null;

  const metricCards = useMemo(
    () => [
      { label: "Gastos", value: metrics.expensesAmount, isCurrencyValue: true },
      { label: "Receita", value: metrics.salesAmount, isCurrencyValue: true },
      { label: "Produtos", value: metrics.totalItems, isCurrencyValue: false },
      { label: "Vendas", value: metrics.totalSales, isCurrencyValue: false },
    ],
    [metrics],
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const today = getTodayDateFilterKey();

      setIsLoading(true);

      Promise.all([
        loadProducts(),
        loadMetrics({ initialDate: today, finalDate: today }),
        loadLastSale(),
      ]).finally(() => {
        if (isMounted) setIsLoading(false);
      });

      return () => {
        isMounted = false;
      };
    }, [loadLastSale, loadMetrics, loadProducts]),
  );

  return (
    <TabsScreenLayout>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Painel Principal</Text>
          <Text style={styles.todayLabel}>{todayLabel}</Text>
        </View>

        <View style={[styles.card, styles.totalProfitContainer]}>
          <View style={styles.totalProfitLeft}>
            <Text style={styles.totalProfitLabel}>Lucro total</Text>
            <Text style={styles.totalProfitMargin}>
              {marginPercent !== null ? `Margem de ${marginPercent}%` : "Sem receita no período"}
            </Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              profitInCents >= 0 ? styles.profitPositive : styles.profitNegative,
            ]}
          >
            {formatCentsToCurrency(profitInCents)}
          </Text>
        </View>

        <View style={styles.grid}>
          {metricCards.map((metric) => (
            <View key={metric.label} style={[styles.card, styles.metricCard]}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {metric.isCurrencyValue ? formatCentsToCurrency(metric.value) : metric.value}
              </Text>
            </View>
          ))}
        </View>

        <View>
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <View style={[styles.card, styles.quickActionsContainer]}>
            <Pressable
              onPress={() => router.push("/sales-form" as never)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            >
              <IconSymbol name="plus" size={24} weight="medium" color={theme.colors.green} />
              <Text style={styles.actionTitle}>Nova venda</Text>
            </Pressable>

            <View style={styles.actionsSeparator} />

            <Pressable
              onPress={() => router.push("/expenses-form")}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            >
              <IconSymbol name="plus" size={24} weight="medium" color={theme.colors.red} />
              <Text style={styles.actionTitle}>Nova despesa</Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Última venda</Text>
          <View style={[styles.card, styles.lastSaleCard]}>
            {isLoading ? (
              <ActivityIndicator color={theme.colors.tint} />
            ) : lastSale === null ? (
              <Text style={styles.emptyText}>Nenhuma venda registrada</Text>
            ) : (
              <>
                <View style={[styles.saleItem, styles.lastSaleHeader]}>
                  <Text style={styles.saleDate}>Data: {formatSaleDate(lastSale.sold_at)}</Text>
                  <Text style={[styles.saleAmount, styles.lastSaleTotal]}>
                    Total: {formatCentsToCurrency(lastSale.total_in_cents)}
                  </Text>
                </View>

                {lastSale.items.map((item) => (
                  <View style={styles.saleItem} key={item.id}>
                    <View style={styles.saleLeft}>
                      <Text style={styles.saleTitle}>
                        {productNamesById[item.product_id] ?? `Produto #${item.product_id}`}
                      </Text>
                      <Text style={styles.saleQuantity}>x{item.quantity}</Text>
                    </View>
                    <View style={styles.saleRight}>
                      <Text style={styles.saleAmount}>
                        {formatCentsToCurrency(item.subtotal_in_cents)}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </TabsScreenLayout>
  );
}

const getStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 16,
    },
    hero: {
      gap: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      lineHeight: 32,
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    todayLabel: {
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    totalProfitContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 4,
      borderColor: colors.tintSoft,
    },
    totalProfitLeft: {
      justifyContent: "space-between",
      gap: 8,
    },
    totalProfitLabel: {
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: 1.1,
      color: colors.textMuted,
    },
    totalProfitMargin: {
      color: colors.text,
      fontWeight: "500",
    },
    profitPositive: {
      color: colors.green,
    },
    profitNegative: {
      color: colors.red,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "500",
      fontFamily: fonts.rounded,
      marginBottom: 12,
      color: colors.text,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 12,
      columnGap: 12,
    },
    card: {
      borderRadius: 18,
      borderWidth: 2,
      padding: 16,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
    },
    cardPressed: {
      opacity: 0.8,
    },
    metricCard: {
      flexBasis: "48%",
      flexGrow: 1,
      alignItems: "center",
      gap: 6,
    },
    metricLabel: {
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1.1,
      color: colors.textMuted,
    },
    metricValue: {
      fontSize: 24,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    quickActionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    actionsSeparator: {
      width: 2,
      backgroundColor: colors.border,
    },
    actionCard: {
      width: "45%",
      alignItems: "center",
      gap: 6,
    },
    actionTitle: {
      fontSize: 16,
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    lastSaleCard: {
      gap: 12,
      minHeight: 80,
      justifyContent: "center",
    },
    emptyText: {
      textAlign: "center",
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    saleDate: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    saleItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    lastSaleHeader: {
      marginVertical: 4,
    },
    lastSaleTotal: {
      fontSize: 18,
      color: colors.green,
    },
    saleLeft: {
      flex: 1,
      gap: 4,
    },
    saleRight: {
      alignItems: "flex-end",
    },
    saleTitle: {
      fontSize: 15,
      color: colors.text,
    },
    saleQuantity: {
      fontSize: 13,
      color: colors.textMuted,
    },
    saleAmount: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "500",
      fontFamily: fonts.rounded,
    },
  });

import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useDashboardStore } from "@/features/dashboard/dashboard-store";
import { useProductStore } from "@/features/products/product-store";
import { DatePickerField } from "@/shared/components/date-picker-field";
import ThemedText from "@/shared/components/themed-text";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { TabsScreenLayout } from "@/shared/layouts/tabs-screen-layout";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { formatDateFilterDisplay, parseDateFilterKey } from "@/shared/utils/format-date-filter";

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
  const [draftInitialDate, setDraftInitialDate] = useState("");
  const [draftFinalDate, setDraftFinalDate] = useState("");
  const [appliedInitialDate, setAppliedInitialDate] = useState<string | undefined>(undefined);
  const [appliedFinalDate, setAppliedFinalDate] = useState<string | undefined>(undefined);

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

  const initialDateLimit = useMemo(
    () => parseDateFilterKey(draftFinalDate) ?? undefined,
    [draftFinalDate],
  );

  const finalDateLimit = useMemo(
    () => parseDateFilterKey(draftInitialDate) ?? undefined,
    [draftInitialDate],
  );

  const periodLabel = useMemo(() => {
    if (!appliedInitialDate && !appliedFinalDate) return "Todo o período";

    if (appliedInitialDate && appliedFinalDate) {
      return `${formatDateFilterDisplay(appliedInitialDate)} — ${formatDateFilterDisplay(appliedFinalDate)}`;
    }

    if (appliedInitialDate) {
      return `A partir de ${formatDateFilterDisplay(appliedInitialDate)}`;
    }

    return `Até ${formatDateFilterDisplay(appliedFinalDate!)}`;
  }, [appliedFinalDate, appliedInitialDate]);

  const metricCards = useMemo(
    () => [
      { label: "Gastos", value: metrics.expensesAmount, isCurrencyValue: true },
      { label: "Receita", value: metrics.salesAmount, isCurrencyValue: true },
      { label: "Produtos", value: metrics.totalItems, isCurrencyValue: false },
      { label: "Vendas", value: metrics.totalSales, isCurrencyValue: false },
    ],
    [metrics],
  );

  const metricsParams = useMemo(() => {
    if (!appliedInitialDate && !appliedFinalDate) return undefined;
    return { initialDate: appliedInitialDate, finalDate: appliedFinalDate };
  }, [appliedFinalDate, appliedInitialDate]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      setIsLoading(true);

      Promise.all([loadProducts(), loadMetrics(metricsParams), loadLastSale()]).finally(() => {
        if (isMounted) setIsLoading(false);
      });

      return () => {
        isMounted = false;
      };
    }, [loadLastSale, loadMetrics, loadProducts, metricsParams]),
  );

  async function handleApplyFilters() {
    if (draftInitialDate && draftFinalDate && draftInitialDate > draftFinalDate) {
      Alert.alert("Erro", "A data inicial deve ser menor ou igual à data final");
      return;
    }

    const nextInitial = draftInitialDate || undefined;
    const nextFinal = draftFinalDate || undefined;

    setAppliedInitialDate(nextInitial);
    setAppliedFinalDate(nextFinal);

    setIsLoading(true);
    await loadMetrics(
      nextInitial || nextFinal ? { initialDate: nextInitial, finalDate: nextFinal } : undefined,
    );
    setIsLoading(false);
  }

  function handleClearFilters() {
    setDraftInitialDate("");
    setDraftFinalDate("");
    setAppliedInitialDate(undefined);
    setAppliedFinalDate(undefined);
    setIsLoading(true);
    loadMetrics().finally(() => setIsLoading(false));
  }

  return (
    <TabsScreenLayout>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <ThemedText style={styles.title}>Painel Principal</ThemedText>
            {__DEV__ ? (
              <Pressable
                onPress={() => router.push("/settings" as never)}
                accessibilityRole="button"
                accessibilityLabel="Abrir configurações de desenvolvimento"
                style={({ pressed }) => [styles.settingsButton, pressed && styles.cardPressed]}
              >
                <IconSymbol name="gearshape.fill" size={20} color={theme.colors.text} />
              </Pressable>
            ) : null}
          </View>
          <ThemedText style={styles.todayLabel}>{todayLabel}</ThemedText>
        </View>

        <View style={styles.filterCard}>
          <ThemedText style={styles.filterTitle}>Período</ThemedText>

          <View style={styles.filterInputs}>
            <DatePickerField
              label="Inicial"
              value={draftInitialDate}
              onChange={setDraftInitialDate}
              placeholder="Data inicial"
              maximumDate={initialDateLimit}
            />

            <DatePickerField
              label="Final"
              value={draftFinalDate}
              onChange={setDraftFinalDate}
              placeholder="Data final"
              minimumDate={finalDateLimit}
            />
          </View>

          <View style={styles.filterActions}>
            <Pressable
              onPress={handleApplyFilters}
              accessibilityRole="button"
              style={({ pressed }) => [styles.filterButton, pressed && styles.filterButtonPressed]}
            >
              <ThemedText style={styles.filterButtonText}>Filtrar</ThemedText>
            </Pressable>

            <Pressable
              onPress={handleClearFilters}
              accessibilityRole="button"
              style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
            >
              <ThemedText style={styles.clearButtonText}>Limpar</ThemedText>
            </Pressable>
          </View>
        </View>

        <ThemedText style={styles.periodLabel}>{periodLabel}</ThemedText>

        <View style={[styles.card, styles.totalProfitContainer]}>
          <View style={styles.totalProfitLeft}>
            <ThemedText style={styles.totalProfitLabel}>Lucro total</ThemedText>
            <ThemedText style={styles.totalProfitMargin}>
              {marginPercent !== null ? `Margem de ${marginPercent}%` : "Sem receita no período"}
            </ThemedText>
          </View>
          <ThemedText
            style={[
              styles.metricValue,
              profitInCents >= 0 ? styles.profitPositive : styles.profitNegative,
            ]}
          >
            {formatCentsToCurrency(profitInCents)}
          </ThemedText>
        </View>

        <View style={styles.grid}>
          {metricCards.map((metric) => (
            <View key={metric.label} style={[styles.card, styles.metricCard]}>
              <ThemedText style={styles.metricLabel}>{metric.label}</ThemedText>
              <ThemedText style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {metric.isCurrencyValue ? formatCentsToCurrency(metric.value) : metric.value}
              </ThemedText>
            </View>
          ))}
        </View>

        <View>
          <ThemedText style={styles.sectionTitle}>Ações rápidas</ThemedText>
          <View style={[styles.card, styles.quickActionsContainer]}>
            <Pressable
              onPress={() => router.push("/sales-form" as never)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            >
              <IconSymbol name="plus" size={24} weight="medium" color={theme.colors.green} />
              <ThemedText style={styles.actionTitle}>Nova venda</ThemedText>
            </Pressable>

            <View style={styles.actionsSeparator} />

            <Pressable
              onPress={() => router.push("/expenses-form")}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            >
              <IconSymbol name="plus" size={24} weight="medium" color={theme.colors.red} />
              <ThemedText style={styles.actionTitle}>Nova despesa</ThemedText>
            </Pressable>
          </View>
        </View>

        <View>
          <ThemedText style={styles.sectionTitle}>Última venda</ThemedText>
          <View style={[styles.card, styles.lastSaleCard]}>
            {isLoading ? (
              <ActivityIndicator color={theme.colors.tint} />
            ) : lastSale === null ? (
              <ThemedText style={styles.emptyText}>Nenhuma venda registrada</ThemedText>
            ) : (
              <>
                <View style={[styles.saleItem, styles.lastSaleHeader]}>
                  <ThemedText style={styles.saleDate}>
                    Data: {formatSaleDate(lastSale.sold_at)}
                  </ThemedText>
                  <ThemedText style={[styles.saleAmount, styles.lastSaleTotal]}>
                    Total: {formatCentsToCurrency(lastSale.total_in_cents)}
                  </ThemedText>
                </View>

                {lastSale.items.map((item) => (
                  <View style={styles.saleItem} key={item.id}>
                    <View style={styles.saleLeft}>
                      <ThemedText style={styles.saleTitle}>
                        {productNamesById[item.product_id] ?? `Produto #${item.product_id}`}
                      </ThemedText>
                      <ThemedText style={styles.saleQuantity}>x{item.quantity}</ThemedText>
                    </View>
                    <View style={styles.saleRight}>
                      <ThemedText style={styles.saleAmount}>
                        {formatCentsToCurrency(item.subtotal_in_cents)}
                      </ThemedText>
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
      gap: 12,
    },
    hero: {
      gap: 8,
    },
    heroHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      lineHeight: 32,
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    settingsButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    todayLabel: {
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    filterCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      gap: 12,
    },
    filterTitle: {
      fontSize: 16,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    filterInputs: {
      flexDirection: "row",
      gap: 12,
    },
    filterActions: {
      flexDirection: "row",
      gap: 10,
    },
    filterButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.tint,
    },
    filterButtonPressed: {
      opacity: 0.85,
    },
    filterButtonText: {
      color: colors.background,
      fontSize: 14,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    clearButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    clearButtonPressed: {
      opacity: 0.85,
    },
    clearButtonText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    periodLabel: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      paddingHorizontal: 4,
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


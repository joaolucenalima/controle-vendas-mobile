import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useDashboardStore } from "@/features/dashboard/dashboard-store";
import {
  DateRangeFilter,
  emptyDateRangeFilter,
  getDateRangeFilterParams,
  IconSymbol,
  ThemedText,
  type DateRangeFilterValue,
} from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { TabsScreenLayout } from "@/shared/layouts/tabs-screen-layout";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { formatDateFilterDisplay, formatDateToDisplay } from "@/shared/utils/format-date";

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(getStyles);

  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateRangeFilterValue>({
    initialDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    finalDate: "",
  });

  const { metrics, lastSale, loadMetrics, loadLastSale } = useDashboardStore();

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
  }, []);

  const profitInCents = metrics.salesAmount - metrics.expensesAmount;
  const marginPercent =
    metrics.salesAmount > 0 ? Math.round((profitInCents / metrics.salesAmount) * 100) : null;

  const periodLabel = useMemo(() => {
    if (!dateFilter.initialDate && !dateFilter.finalDate) return "Todo o período";

    if (dateFilter.initialDate && dateFilter.finalDate) {
      return `${formatDateFilterDisplay(dateFilter.initialDate)} - ${formatDateFilterDisplay(dateFilter.finalDate)}`;
    }

    if (dateFilter.initialDate) {
      return `A partir de ${formatDateFilterDisplay(dateFilter.initialDate)}`;
    }

    return `Até ${formatDateFilterDisplay(dateFilter.finalDate)}`;
  }, [dateFilter]);

  const metricCards = useMemo(
    () => [
      {
        label: "Receita",
        value: metrics.salesAmount,
        isCurrencyValue: true,
        icon: "banknote.fill" as const,
        color: theme.colors.green,
      },
      {
        label: "Gastos",
        value: metrics.expensesAmount,
        isCurrencyValue: true,
        icon: "wallet.pass.fill" as const,
        color: theme.colors.red,
      },
      {
        label: "Vendas",
        value: metrics.totalSales,
        isCurrencyValue: false,
        icon: "dollarsign" as const,
        color: theme.colors.tint,
      },
      {
        label: "Produtos",
        value: metrics.totalItems,
        isCurrencyValue: false,
        icon: "shippingbox.fill" as const,
        color: theme.colors.tint,
      },
    ],
    [metrics, theme.colors.green, theme.colors.red, theme.colors.tint],
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      setIsLoading(true);

      Promise.all([loadMetrics(getDateRangeFilterParams(dateFilter)), loadLastSale()]).finally(
        () => {
          if (isMounted) setIsLoading(false);
        },
      );

      return () => {
        isMounted = false;
      };
    }, [dateFilter, loadLastSale, loadMetrics]),
  );

  return (
    <TabsScreenLayout>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.title}>Painel Principal</ThemedText>
            <ThemedText style={styles.todayLabel}>{todayLabel}</ThemedText>
          </View>

          <Pressable
            onPress={() => router.push("/settings" as never)}
            accessibilityRole="button"
            accessibilityLabel="Abrir configuracoes"
            style={({ pressed }) => [styles.settingsButton, pressed && styles.cardPressed]}
          >
            <IconSymbol name="gearshape.fill" size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        <DateRangeFilter
          value={dateFilter}
          onApply={(value) => setDateFilter(value)}
          onClear={() => setDateFilter(emptyDateRangeFilter)}
        />

        <View style={styles.periodChip}>
          <IconSymbol name="chart.bar.fill" size={14} color={theme.colors.tint} />
          <ThemedText style={styles.periodLabel}>{periodLabel}</ThemedText>
        </View>

        <View style={styles.profitCard}>
          <View style={styles.profitHeader}>
            <View style={styles.profitIcon}>
              <IconSymbol name="chart.bar.fill" size={22} color={theme.colors.tint} />
            </View>
            <View style={styles.profitHeaderText}>
              <ThemedText style={styles.profitEyebrow}>RESULTADO DO PERÍODO</ThemedText>
              <ThemedText style={styles.profitTitle}>Lucro estimado</ThemedText>
            </View>
          </View>

          <ThemedText
            style={[
              styles.profitValue,
              profitInCents >= 0 ? styles.profitPositive : styles.profitNegative,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCentsToCurrency(profitInCents)}
          </ThemedText>

          {marginPercent !== null && (
            <View style={styles.marginRow}>
              <View
                style={[
                  styles.statusDot,
                  profitInCents >= 0 ? styles.statusDotPositive : styles.statusDotNegative,
                ]}
              />
              <ThemedText style={styles.profitMargin}>
                Margem de {marginPercent}% sobre a receita
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.grid}>
          {metricCards.map((metric) => (
            <View key={metric.label} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <View style={styles.metricIcon}>
                  <IconSymbol name={metric.icon} size={18} color={metric.color} />
                </View>
                <ThemedText style={styles.metricLabel}>{metric.label}</ThemedText>
              </View>
              <ThemedText style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {metric.isCurrencyValue ? formatCentsToCurrency(metric.value) : metric.value}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Ações rápidas</ThemedText>
          </View>
          <View style={styles.quickActionsContainer}>
            <Pressable
              onPress={() => router.push("/sales-form" as never)}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar nova venda"
              style={({ pressed }) => [
                styles.actionCard,
                styles.saleActionCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <IconSymbol name="plus" size={28} color={theme.colors.tintSoft} />
              </View>
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitlePrimary}>Nova venda</ThemedText>
                <ThemedText style={styles.actionSubtitlePrimary}>Registrar recebimento</ThemedText>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push("/expenses-form")}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar nova despesa"
              style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            >
              <View style={styles.actionIcon}>
                <IconSymbol name="plus" size={28} color={theme.colors.red} />
              </View>
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Nova despesa</ThemedText>
                <ThemedText style={styles.actionSubtitle}>Adicionar um gasto</ThemedText>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Última venda</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>Registro mais recente</ThemedText>
          </View>
          <View style={styles.lastSaleCard}>
            {isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={theme.colors.tint} />
                <ThemedText style={styles.loadingText}>Carregando venda...</ThemedText>
              </View>
            ) : lastSale === null ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <IconSymbol name="cart.fill" size={24} color={theme.colors.textMuted} />
                </View>
                <ThemedText style={styles.emptyTitle}>Nenhuma venda registrada</ThemedText>
                <ThemedText style={styles.emptyText}>
                  Sua venda mais recente aparecerá aqui.
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.lastSaleHeader}>
                  <View style={styles.saleIdentity}>
                    <View style={styles.saleBadge}>
                      <ThemedText style={styles.saleBadgeText}>#{lastSale.id}</ThemedText>
                    </View>
                    <ThemedText style={styles.saleDate}>
                      {formatDateToDisplay(lastSale.sold_at)}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.lastSaleTotal}>
                    {formatCentsToCurrency(lastSale.total_in_cents)}
                  </ThemedText>
                </View>

                <View style={styles.itemsList}>
                  {lastSale.items.map((item, index) => (
                    <View
                      style={[styles.saleItem, index > 0 && styles.saleItemBorder]}
                      key={item.id}
                    >
                      <View style={styles.saleLeft}>
                        <ThemedText style={styles.saleTitle}>{item.product_name}</ThemedText>
                        <ThemedText style={styles.saleQuantity}>
                          Quantidade: {item.quantity}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.saleAmount}>
                        {formatCentsToCurrency(item.subtotal_in_cents)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
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
      paddingBottom: 32,
      gap: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 12,
    },
    headerContent: {
      gap: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    settingsButton: {
      padding: 12,
      borderRadius: 16,
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
    periodLabel: {
      fontSize: 12,
      color: colors.tint,
      fontFamily: fonts.sans,
    },
    periodChip: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.tintSoft,
    },
    profitCard: {
      padding: 18,
      gap: 12,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.tintSoft,
      backgroundColor: colors.surfaceElevated,
    },
    profitHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    profitIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.tintSoft,
    },
    profitHeaderText: { flex: 1 },
    profitEyebrow: {
      fontSize: 10,
      letterSpacing: 0.9,
      fontWeight: "700",
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    profitTitle: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "600",
      fontFamily: fonts.rounded,
    },
    profitValue: { fontSize: 30, fontWeight: "700", fontFamily: fonts.rounded },
    marginRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusDotPositive: { backgroundColor: colors.green },
    statusDotNegative: { backgroundColor: colors.red },
    profitMargin: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    profitPositive: {
      color: colors.green,
    },
    profitNegative: {
      color: colors.red,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      fontFamily: fonts.rounded,
      color: colors.text,
    },
    section: { gap: 12 },
    sectionHeader: { gap: 3 },
    sectionSubtitle: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.sans },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 12,
      columnGap: 12,
    },
    cardPressed: {
      opacity: 0.8,
    },
    metricCard: {
      flexBasis: "48%",
      flexGrow: 1,
      minWidth: 0,
      padding: 14,
      gap: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    metricHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    metricIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    metricLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    metricValue: {
      fontSize: 21,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    quickActionsContainer: {
      gap: 10,
    },
    actionCard: {
      minHeight: 70,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    saleActionCard: { borderColor: colors.tint, backgroundColor: colors.tint },
    actionIcon: {
      alignItems: "center",
      justifyContent: "center",
    },
    actionContent: { flex: 1, gap: 3 },
    actionTitle: {
      fontSize: 16,
      color: colors.red,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    actionTitlePrimary: {
      fontSize: 16,
      color: colors.tintSoft,
      fontFamily: fonts.rounded,
      fontWeight: "700",
    },
    actionSubtitle: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.sans },
    actionSubtitlePrimary: {
      fontSize: 12,
      color: colors.background,
      fontFamily: fonts.sans,
      opacity: 0.8,
    },
    lastSaleCard: {
      minHeight: 80,
      justifyContent: "center",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      overflow: "hidden",
    },
    loadingState: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 24,
    },
    loadingText: { color: colors.textMuted, fontFamily: fonts.sans },
    emptyState: { alignItems: "center", gap: 8, padding: 24 },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    emptyText: {
      textAlign: "center",
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    saleDate: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    saleItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      paddingVertical: 11,
    },
    saleItemBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    itemsList: { paddingHorizontal: 16 },
    saleIdentity: { flexDirection: "row", alignItems: "center", gap: 8 },
    saleBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.tintSoft,
    },
    saleBadgeText: {
      fontSize: 12,
      color: colors.tint,
      fontFamily: fonts.rounded,
      fontWeight: "700",
    },
    lastSaleHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lastSaleTotal: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    saleLeft: {
      flex: 1,
    },
    saleTitle: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
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


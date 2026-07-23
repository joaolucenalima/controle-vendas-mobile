import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { SaleCollapsibleCard } from "@/features/sales/components/sale-collapsible-card";
import { useSaleStore } from "@/features/sales/sale-store";
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

export default function SalesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const [dateFilter, setDateFilter] = useState<DateRangeFilterValue>(emptyDateRangeFilter);

  const { sales, loadSales } = useSaleStore();

  const totalFiltered = sales.length;
  const totalValueFiltered = sales.reduce((total, sale) => total + sale.total_in_cents, 0);

  useFocusEffect(
    useCallback(() => {
      loadSales(getDateRangeFilterParams(dateFilter));
    }, [dateFilter, loadSales]),
  );

  const header = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.title}>Vendas</ThemedText>
          <ThemedText style={styles.subtitle}>Acompanhe e filtre por período</ThemedText>
        </View>
      </View>

      <DateRangeFilter
        value={dateFilter}
        onApply={(value) => setDateFilter(value)}
        onClear={() => setDateFilter(emptyDateRangeFilter)}
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Vendas no período</ThemedText>
          <ThemedText style={styles.summaryValue}>{totalFiltered}</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Valor total</ThemedText>
          <ThemedText style={styles.summaryTotal}>
            {formatCentsToCurrency(totalValueFiltered)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <TabsScreenLayout>
      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <SaleCollapsibleCard
            sale={item}
            onEdit={() => router.push({ pathname: "/sales-form", params: { id: String(item.id) } })}
            onPrint={() =>
              router.push({ pathname: "/sale-print", params: { id: String(item.id) } })
            }
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>Nenhuma venda encontrada</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Tente outro periodo ou cadastre uma nova venda.
            </ThemedText>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => router.push("/sales-form")}
        accessibilityRole="button"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <IconSymbol name="plus" size={24} color={theme.colors.background} />
      </Pressable>
    </TabsScreenLayout>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 112,
      gap: 12,
    },
    container: {
      gap: 12,
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
      fontSize: 26,
      fontWeight: "bold",
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    summaryCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      marginBottom: 4,
    },
    summaryItem: {
      flex: 1,
      gap: 6,
    },
    summaryDivider: {
      width: 1,
      height: 38,
      marginHorizontal: 16,
      backgroundColor: colors.border,
    },
    summaryLabel: {
      color: colors.textMuted,
      textAlign: "center",
      fontFamily: fonts.sans,
    },
    summaryValue: {
      color: colors.text,
      textAlign: "center",
      fontFamily: fonts.rounded,
      fontSize: 20,
      fontWeight: "700",
    },
    summaryTotal: {
      color: colors.tint,
      textAlign: "center",
      fontFamily: fonts.rounded,
      fontSize: 18,
      fontWeight: "700",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 32,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      fontFamily: fonts.rounded,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      fontFamily: fonts.sans,
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 24,
      width: 54,
      height: 54,
      borderRadius: 27,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.tint,
      shadowColor: colors.text,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    fabPressed: {
      transform: [{ scale: 0.97 }],
    },
  });


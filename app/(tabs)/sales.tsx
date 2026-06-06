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

export default function SalesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const [dateFilter, setDateFilter] = useState<DateRangeFilterValue>(emptyDateRangeFilter);

  const { sales, loadSales } = useSaleStore();

  const totalFiltered = sales.length;

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

        <Pressable
          onPress={() => router.push("/sale-print")}
          accessibilityRole="button"
          accessibilityLabel="Abrir tela de impressao"
          style={styles.printerButton}
        >
          <IconSymbol name="printer.fill.and.paper.fill" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <DateRangeFilter
        value={dateFilter}
        onApply={(value) => setDateFilter(value)}
        onClear={() => setDateFilter(emptyDateRangeFilter)}
      />

      <View style={styles.summaryRow}>
        <ThemedText style={styles.summaryLabel}>Resultados</ThemedText>
        <ThemedText style={styles.summaryValue}>{totalFiltered}</ThemedText>
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
    printerButton: {
      padding: 12,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    summaryValue: {
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
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


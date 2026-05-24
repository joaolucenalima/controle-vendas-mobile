import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";

import { useProductStore } from "@/features/products/product-store";
import { useSaleStore } from "@/features/sales/sale-store";
import type { Sale } from "@/features/sales/sale.types";
import { DatePickerField } from "@/shared/components/date-picker-field";
import ThemedText from "@/shared/components/themed-text";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { TabsScreenLayout } from "@/shared/layouts/tabs-screen-layout";
import { parseDateFilterKey } from "@/shared/utils/format-date-filter";
import { SaleCollapsibleCard } from "@/widgets/sales/sale-collapsible-card";

export default function SalesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const { sales, loadSales } = useSaleStore();
  const { products, loadProducts } = useProductStore();

  const [draftInitialDate, setDraftInitialDate] = useState("");
  const [draftFinalDate, setDraftFinalDate] = useState("");
  const [appliedInitialDate, setAppliedInitialDate] = useState<string | undefined>(undefined);
  const [appliedFinalDate, setAppliedFinalDate] = useState<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
      loadSales({ initialDate: appliedInitialDate, finalDate: appliedFinalDate });
    }, [appliedFinalDate, appliedInitialDate, loadProducts, loadSales]),
  );

  const productNamesById = useMemo(() => {
    return products.reduce<Record<number, string>>((accumulator, product) => {
      accumulator[product.id] = product.name;
      return accumulator;
    }, {});
  }, [products]);

  const totalFiltered = sales.length;

  const initialDateLimit = useMemo(
    () => parseDateFilterKey(draftFinalDate) ?? undefined,
    [draftFinalDate],
  );

  const finalDateLimit = useMemo(
    () => parseDateFilterKey(draftInitialDate) ?? undefined,
    [draftInitialDate],
  );

  function handleCreate() {
    router.push("/sales-form");
  }

  function handleEdit(saleId: number) {
    router.push({ pathname: "/sales-form", params: { id: String(saleId) } });
  }

  async function handleApplyFilters() {
    if (draftInitialDate && draftFinalDate && draftInitialDate > draftFinalDate) {
      Alert.alert("Erro", "A data inicial deve ser menor ou igual à data final");
      return;
    }

    const nextInitial = draftInitialDate || undefined;
    const nextFinal = draftFinalDate || undefined;

    setAppliedInitialDate(nextInitial);
    setAppliedFinalDate(nextFinal);
    await loadSales(
      nextInitial || nextFinal ? { initialDate: nextInitial, finalDate: nextFinal } : undefined,
    );
  }

  function handleClearFilters() {
    setDraftInitialDate("");
    setDraftFinalDate("");
    setAppliedInitialDate(undefined);
    setAppliedFinalDate(undefined);
    loadSales();
  }

  const renderSale = ({ item }: { item: Sale }) => (
    <SaleCollapsibleCard
      sale={item}
      productNamesById={productNamesById}
      onEdit={() => handleEdit(item.id)}
    />
  );

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Vendas</ThemedText>
        <ThemedText style={styles.subtitle}>Acompanhe e filtre por período</ThemedText>
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
        renderItem={renderSale}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>Nenhuma venda encontrada</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Tente outro período ou cadastre uma nova venda.
            </ThemedText>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={handleCreate}
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
    headerWrap: {
      gap: 12,
    },
    header: {
      gap: 8,
      marginBottom: 12,
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


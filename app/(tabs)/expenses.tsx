import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useExpenseStore } from "@/features/expenses/expense-store";
import type { Expense } from "@/features/expenses/expense.types";
import { TabsScreenLayout } from "@/shared/components/tabs-screen-layout";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";

export default function ExpensesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const { expenses, loadExpenses } = useExpenseStore();

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses]),
  );

  const hasExpenses = expenses.length > 0;

  const sorted = useMemo(() => {
    return [...expenses].sort((a, b) => a.title.localeCompare(b.title));
  }, [expenses]);

  function handleCreate() {
    router.push("/expenses-form");
  }

  function handleEdit(expenseId: number) {
    router.push({ pathname: "/expenses-form", params: { id: String(expenseId) } });
  }

  const renderItem = ({ item }: { item: Expense }) => (
    <Pressable
      onPress={() => handleEdit(item.id)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPrice}>{formatCentsToCurrency(item.amount_in_cents)}</Text>
      </View>
      {item.category ? <Text style={styles.cardDescription}>{item.category}</Text> : null}
    </Pressable>
  );

  return (
    <TabsScreenLayout>
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Despesas</Text>
          <Text style={styles.subtitle}>Registre suas despesas</Text>
        </View>

        {hasExpenses ? (
          <FlatList
            data={sorted}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma despesa cadastrada</Text>
            <Text style={styles.emptySubtitle}>Adicione sua primeira despesa.</Text>
            <Pressable
              onPress={handleCreate}
              accessibilityRole="button"
              style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
            >
              <Text style={styles.emptyButtonText}>Adicionar despesa</Text>
            </Pressable>
          </View>
        )}

        {!!hasExpenses && (
          <Pressable
            onPress={handleCreate}
            accessibilityRole="button"
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          >
            <IconSymbol name="plus" size={24} color={theme.colors.background} />
          </Pressable>
        )}
      </View>
    </TabsScreenLayout>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    safeAreaContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
    },
    header: {
      gap: 6,
      marginBottom: 16,
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
    listContent: {
      gap: 12,
      paddingBottom: 120,
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 16,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      gap: 8,
    },
    cardPressed: {
      opacity: 0.82,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    cardTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: 600,
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    cardPrice: {
      fontSize: 14,
      color: colors.error,
      fontFamily: fonts.rounded,
      fontWeight: 500,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
      gap: 10,
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
    emptyButton: {
      marginTop: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 16,
      backgroundColor: colors.tint,
    },
    emptyButtonPressed: {
      opacity: 0.85,
    },
    emptyButtonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: "600",
      fontFamily: fonts.rounded,
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 30,
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


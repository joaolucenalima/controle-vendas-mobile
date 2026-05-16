import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { TabsScreenLayout } from "@/shared/components/tabs-screen-layout";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { useRouter } from "expo-router";

const METRICS = [
  { label: "Gastos", value: 120000, isCurrencyValue: true },
  { label: "Receita", value: 400000, isCurrencyValue: true },
  { label: "Produtos", value: 350, isCurrencyValue: false },
  { label: "Vendas", value: 4, isCurrencyValue: false },
];

const SALE_PRODUCTS = [
  { id: "1", name: "Arandela", quantity: "20", amount: "R$ 280" },
  { id: "2", name: "Redondinha", quantity: "15", amount: "R$ 170" },
  { id: "3", name: "Quadrada", quantity: "12", amount: "R$ 120" },
];

export default function HomeScreen() {
  const router = useRouter();
  const styles = useStyles(getStyles);
  const theme = useTheme();

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
  }, []);

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
            <Text style={styles.totalProfitMargin}>Margem de 30%</Text>
          </View>
          <Text style={styles.metricValue}>R$ 2800</Text>
        </View>

        <View style={styles.grid}>
          {METRICS.map((metric) => (
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
              onPress={() => {}}
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
          <View
            style={[
              styles.card,
              {
                gap: 12,
              },
            ]}
          >
            <View style={[styles.saleItem, { marginVertical: 4 }]}>
              <Text style={styles.saleDate}>Data: 12/05/2026</Text>
              <Text style={[styles.saleAmount, { fontSize: 18, color: theme.colors.green }]}>
                Total: R$ 1000
              </Text>
            </View>

            {SALE_PRODUCTS.map((item) => (
              <View style={styles.saleItem} key={item.id}>
                <View style={styles.saleLeft}>
                  <Text style={styles.saleTitle}>{item.name}</Text>
                  <Text style={styles.saleQuantity}>x{item.quantity}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.saleAmount}>{item.amount}</Text>
                </View>
              </View>
            ))}
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
    saleLeft: {
      flex: 1,
      gap: 4,
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


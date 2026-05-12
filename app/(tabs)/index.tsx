import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/shared/hooks/use-theme";

const METRICS = [
  { label: "Vendas de hoje", value: "R$ 2.430", delta: "+12% vs ontem" },
  { label: "Pedidos", value: "18", delta: "+3 novos" },
  { label: "Ticket medio", value: "R$ 135", delta: "+8%" },
  { label: "Despesas", value: "R$ 420", delta: "-5%" },
];

const QUICK_ACTIONS = [
  { title: "Nova venda", subtitle: "Registrar pedido" },
  { title: "Nova despesa", subtitle: "Adicionar custo" },
  { title: "Produtos", subtitle: "Ver catalogo" },
];

const RECENT_SALES = [
  { id: "1", client: "Mercado Sao Lucas", time: "09:12", amount: "R$ 280" },
  { id: "2", client: "Loja Vila Norte", time: "10:05", amount: "R$ 540" },
  { id: "3", client: "Padaria Central", time: "11:22", amount: "R$ 160" },
];

const MONTH_GOAL = {
  label: "Meta do mes",
  value: "R$ 28.500",
  progress: 0.64,
  note: "R$ 10.200 restantes",
};

export default function HomeScreen() {
  const { colors, fonts } = useTheme();
  const heroAnim = useRef(new Animated.Value(0)).current;
  const metricAnims = useRef(METRICS.map(() => new Animated.Value(0))).current;
  const actionAnims = useRef(QUICK_ACTIONS.map(() => new Animated.Value(0))).current;
  const listAnims = useRef(RECENT_SALES.map(() => new Animated.Value(0))).current;

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
  }, []);

  useEffect(() => {
    const hero = Animated.timing(heroAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    });

    const metrics = Animated.stagger(
      80,
      metricAnims.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 360, useNativeDriver: true }),
      ),
    );

    const actions = Animated.stagger(
      80,
      actionAnims.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true }),
      ),
    );

    const list = Animated.stagger(
      70,
      listAnims.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true }),
      ),
    );

    Animated.sequence([hero, metrics, actions, list]).start();
  }, [actionAnims, heroAnim, listAnims, metricAnims]);

  const slideUp = (value: Animated.Value, offset = 14) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [offset, 0],
        }),
      },
    ],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={styles.backgroundArt}>
        <View style={[styles.orbLarge, { backgroundColor: colors.tintSoft }]} />
        <View style={[styles.orbSmall, { backgroundColor: colors.surface }]} />
        <View style={[styles.orbRing, { borderColor: colors.border }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.hero, slideUp(heroAnim, 18)]}>
            <Text style={[styles.eyebrow, { color: colors.textMuted, fontFamily: fonts.sans }]}>
              {todayLabel}
            </Text>
            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.rounded }]}>
              Painel de Vendas
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.serif }]}>
              Acompanhe resultados e foque nas proximas oportunidades.
            </Text>
          </Animated.View>

          <View style={styles.metricsGrid}>
            {METRICS.map((metric, index) => (
              <Animated.View
                key={metric.label}
                style={[
                  styles.metricCard,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  slideUp(metricAnims[index]),
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {metric.label}
                </Text>
                <Text
                  style={[styles.metricValue, { color: colors.text, fontFamily: fonts.rounded }]}
                >
                  {metric.value}
                </Text>
                <Text style={[styles.metricDelta, { color: colors.tint }]}>{metric.delta}</Text>
              </Animated.View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.rounded }]}>
              Meta do mes
            </Text>
            <View
              style={[
                styles.goalCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.goalHeader}>
                <Text style={[styles.goalLabel, { color: colors.textMuted }]}>
                  {MONTH_GOAL.label}
                </Text>
                <Text style={[styles.goalValue, { color: colors.text, fontFamily: fonts.rounded }]}>
                  {MONTH_GOAL.value}
                </Text>
              </View>
              <View style={[styles.goalTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.goalFill,
                    { backgroundColor: colors.tint, flex: MONTH_GOAL.progress },
                  ]}
                />
                <View style={{ flex: 1 - MONTH_GOAL.progress }} />
              </View>
              <Text style={[styles.goalNote, { color: colors.textMuted }]}>{MONTH_GOAL.note}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.rounded }]}>
              Acoes rapidas
            </Text>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map((action, index) => (
                <Animated.View key={action.title} style={slideUp(actionAnims[index])}>
                  <Pressable
                    onPress={() => {}}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.actionCard,
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionTitle,
                        { color: colors.text, fontFamily: fonts.rounded },
                      ]}
                    >
                      {action.title}
                    </Text>
                    <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                      {action.subtitle}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.rounded }]}>
              Ultimas vendas
            </Text>
            <View style={styles.salesList}>
              {RECENT_SALES.map((sale, index) => (
                <Animated.View
                  key={sale.id}
                  style={[
                    styles.saleCard,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    slideUp(listAnims[index]),
                  ]}
                >
                  <View style={styles.saleLeft}>
                    <Text style={[styles.saleClient, { color: colors.text }]}>{sale.client}</Text>
                    <Text style={[styles.saleTime, { color: colors.textMuted }]}>
                      Hoje, {sale.time}
                    </Text>
                  </View>
                  <View style={styles.saleRight}>
                    <Text
                      style={[styles.saleAmount, { color: colors.text, fontFamily: fonts.rounded }]}
                    >
                      {sale.amount}
                    </Text>
                    <View style={[styles.salePill, { backgroundColor: colors.tintSoft }]}>
                      <Text style={[styles.salePillText, { color: colors.tint }]}>Pago</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  backgroundArt: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orbLarge: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -140,
    right: -90,
    opacity: 0.65,
  },
  orbSmall: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: 80,
    left: -60,
    opacity: 0.45,
  },
  orbRing: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    top: 160,
    left: 30,
    opacity: 0.25,
  },
  hero: {
    gap: 8,
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
    columnGap: 12,
  },
  metricCard: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  metricValue: {
    fontSize: 20,
  },
  metricDelta: {
    fontSize: 12,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  goalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  goalValue: {
    fontSize: 18,
  },
  goalTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
  },
  goalFill: {
    height: "100%",
    borderRadius: 999,
  },
  goalNote: {
    fontSize: 13,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
    columnGap: 12,
  },
  actionCard: {
    flexBasis: "48%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  actionPressed: {
    opacity: 0.8,
  },
  actionTitle: {
    fontSize: 16,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  salesList: {
    gap: 12,
  },
  saleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleLeft: {
    flex: 1,
    gap: 4,
  },
  saleClient: {
    fontSize: 15,
  },
  saleTime: {
    fontSize: 12,
  },
  saleRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  saleAmount: {
    fontSize: 15,
  },
  salePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  salePillText: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});


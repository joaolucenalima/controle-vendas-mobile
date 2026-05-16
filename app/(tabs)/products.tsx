import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProductStore } from "@/features/products/product-store";
import type { Product } from "@/features/products/product.types";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";

export default function ProductsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const { products, loadProducts } = useProductStore();

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts]),
  );

  const hasProducts = products.length > 0;

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  function handleCreate() {
    router.push("/products-form");
  }

  function handleEdit(productId: number) {
    router.push({ pathname: "/products-form", params: { id: String(productId) } });
  }

  const renderItem = ({ item }: { item: Product }) => (
    <Pressable
      onPress={() => handleEdit(item.id)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardPrice}>{formatCentsToCurrency(item.price_in_cents)}</Text>
      </View>
      {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
      <Text style={styles.cardMeta}>
        Criado em {new Date(item.created_at).toLocaleDateString("pt-BR")}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.backgroundArt}>
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Produtos</Text>
          <Text style={styles.subtitle}>Gerencie seu catálogo</Text>
        </View>

        {hasProducts ? (
          <FlatList
            data={sortedProducts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
            <Text style={styles.emptySubtitle}>
              Cadastre seu primeiro produto e organize suas vendas.
            </Text>
            <Pressable
              onPress={handleCreate}
              accessibilityRole="button"
              style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
            >
              <Text style={styles.emptyButtonText}>Adicionar produto</Text>
            </Pressable>
          </View>
        )}

        {!!hasProducts && (
          <Pressable
            onPress={handleCreate}
            accessibilityRole="button"
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          >
            <IconSymbol name="plus" size={24} color={theme.colors.background} />
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
    },
    backgroundArt: {
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
    },
    orbLarge: {
      position: "absolute",
      width: 280,
      height: 280,
      borderRadius: 140,
      top: -120,
      right: -100,
      opacity: 0.55,
      backgroundColor: colors.tintSoft,
    },
    orbSmall: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      bottom: 40,
      left: -60,
      opacity: 0.35,
      backgroundColor: colors.surface,
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
      fontWeight: "600",
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    cardPrice: {
      fontSize: 14,
      color: colors.tint,
      fontFamily: fonts.rounded,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    cardMeta: {
      fontSize: 12,
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


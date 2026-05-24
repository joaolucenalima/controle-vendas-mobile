import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { useProductStore } from "@/features/products/product-store";
import type { Product } from "@/features/products/product.types";
import ThemedText from "@/shared/components/themed-text";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { TabsScreenLayout } from "@/shared/layouts/tabs-screen-layout";
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
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <ThemedText style={styles.cardImagePlaceholderText}>Sem imagem</ThemedText>
        </View>
      )}

      <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>

      <ThemedText style={styles.cardPrice}>{formatCentsToCurrency(item.price_in_cents)}</ThemedText>
    </Pressable>
  );

  return (
    <TabsScreenLayout>
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Produtos</ThemedText>
          <ThemedText style={styles.subtitle}>Gerencie seu catálogo</ThemedText>
        </View>

        {hasProducts ? (
          <FlatList
            data={products}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{ gap: 20, marginBottom: 16 }}
            numColumns={2}
          />
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>Nenhum produto cadastrado</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Cadastre seu primeiro produto e organize suas vendas.
            </ThemedText>
            <Pressable
              onPress={handleCreate}
              accessibilityRole="button"
              style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
            >
              <ThemedText style={styles.emptyButtonText}>Adicionar produto</ThemedText>
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
      paddingBottom: 24,
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
    card: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 1,
      padding: 12,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      gap: 8,
    },
    cardPressed: {
      opacity: 0.82,
    },
    cardImage: {
      width: "100%",
      aspectRatio: 1,
      alignSelf: "center",
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    cardImagePlaceholder: {
      width: "100%",
      aspectRatio: 1,
      alignSelf: "center",
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    cardImagePlaceholderText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: fonts.sans,
      textAlign: "center",
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: 600,
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    cardPrice: {
      fontSize: 14,
      color: colors.tint,
      fontFamily: fonts.rounded,
      alignSelf: "flex-end",
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
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
    emptyButton: {
      marginTop: 12,
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


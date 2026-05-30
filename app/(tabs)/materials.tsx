import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { useMaterialStore } from "@/features/materials/material-store";
import type { Material } from "@/features/materials/material.types";
import { IconSymbol, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { TabsScreenLayout } from "@/shared/layouts/tabs-screen-layout";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";

export default function MaterialsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const { materials, loadMaterials } = useMaterialStore();

  useFocusEffect(
    useCallback(() => {
      loadMaterials();
    }, [loadMaterials]),
  );

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => a.name.localeCompare(b.name));
  }, [materials]);

  function handleCreate() {
    router.push("/materials-form");
  }

  function handleEdit(materialId: number) {
    router.push({ pathname: "/materials-form", params: { id: String(materialId) } });
  }

  const renderItem = ({ item }: { item: Material }) => (
    <Pressable
      onPress={() => handleEdit(item.id)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
        <ThemedText style={styles.cardPrice}>
          {item.price_in_cents !== null ? formatCentsToCurrency(item.price_in_cents) : "Sem preço"}
        </ThemedText>
      </View>
    </Pressable>
  );

  const hasMaterials = sortedMaterials.length > 0;

  return (
    <TabsScreenLayout>
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Materiais</ThemedText>
          <ThemedText style={styles.subtitle}>Gerencie seu estoque de insumos</ThemedText>
        </View>

        {hasMaterials ? (
          <FlatList
            data={sortedMaterials}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>Nenhum material cadastrado</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Cadastre seu primeiro material para organizar seus custos.
            </ThemedText>
            <Pressable
              onPress={handleCreate}
              accessibilityRole="button"
              style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
            >
              <ThemedText style={styles.emptyButtonText}>Adicionar material</ThemedText>
            </Pressable>
          </View>
        )}

        {hasMaterials ? (
          <Pressable
            onPress={handleCreate}
            accessibilityRole="button"
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          >
            <IconSymbol name="plus" size={24} color={theme.colors.background} />
          </Pressable>
        ) : null}
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
    listContent: {
      gap: 12,
      paddingBottom: 112,
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
      color: colors.textMuted,
      fontFamily: fonts.rounded,
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


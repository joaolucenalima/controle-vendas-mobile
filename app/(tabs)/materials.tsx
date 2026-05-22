import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useMaterialStore } from "@/features/materials/material-store";
import type { Material } from "@/features/materials/material.types";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
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
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardPrice}>
          {item.price_in_cents !== null ? formatCentsToCurrency(item.price_in_cents) : "Sem preço"}
        </Text>
      </View>
    </Pressable>
  );

  const hasMaterials = sortedMaterials.length > 0;

  return (
    <TabsScreenLayout>
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Materiais</Text>
          <Text style={styles.subtitle}>Gerencie seu estoque de insumos</Text>
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
            <Text style={styles.emptyTitle}>Nenhum material cadastrado</Text>
            <Text style={styles.emptySubtitle}>
              Cadastre seu primeiro material para organizar seus custos.
            </Text>
            <Pressable
              onPress={handleCreate}
              accessibilityRole="button"
              style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
            >
              <Text style={styles.emptyButtonText}>Adicionar material</Text>
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


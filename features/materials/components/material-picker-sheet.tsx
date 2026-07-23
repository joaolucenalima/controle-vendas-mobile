import { useMemo } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Material } from "@/features/materials/material.types";
import { IconSymbol, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";

type MaterialPickerSheetProps = {
  visible: boolean;
  materials: Material[];
  pendingIds: number[];
  search: string;
  onSearchChange: (value: string) => void;
  onToggleMaterial: (materialId: number) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function MaterialPickerSheet({
  visible,
  materials,
  pendingIds,
  search,
  onSearchChange,
  onToggleMaterial,
  onClose,
  onConfirm,
}: MaterialPickerSheetProps) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const pendingSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return materials;

    return materials.filter((material) => material.name.toLowerCase().includes(query));
  }, [materials, search]);

  const canConfirm = pendingIds.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <ThemedText style={styles.title}>Adicionar materiais</ThemedText>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                hitSlop={8}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
              >
                <IconSymbol name="xmark" size={20} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <IconSymbol name="magnifyingglass" size={18} color={theme.colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={onSearchChange}
                placeholder="Buscar material"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filteredMaterials}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <ThemedText style={styles.emptyText}>
                  {search.trim() ? "Nenhum material encontrado" : "Nenhum material cadastrado"}
                </ThemedText>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onToggleMaterial(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: pendingSet.has(item.id) }}
                  style={({ pressed }) => [
                    styles.card,
                    pendingSet.has(item.id) && styles.cardSelected,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View
                    style={[styles.checkbox, pendingSet.has(item.id) && styles.checkboxSelected]}
                  >
                    {pendingSet.has(item.id) ? (
                      <ThemedText style={styles.checkboxLabel}>✓</ThemedText>
                    ) : null}
                  </View>

                  <View style={styles.materialInfo}>
                    <ThemedText style={styles.materialName}>{item.name}</ThemedText>
                    {item.price_in_cents !== null ? (
                      <ThemedText style={styles.materialPrice}>
                        {formatCentsToCurrency(item.price_in_cents)}
                      </ThemedText>
                    ) : (
                      <ThemedText style={styles.materialPriceMuted}>Sem preço</ThemedText>
                    )}
                  </View>
                </Pressable>
              )}
            />

            <Pressable
              onPress={onConfirm}
              disabled={!canConfirm}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.confirmButton,
                (!canConfirm || pressed) && styles.confirmButtonDisabled,
              ]}
            >
              <ThemedText style={styles.confirmButtonText}>Adicionar materiais</ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    keyboardAvoidingView: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: "82%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 10,
      gap: 14,
    },
    handle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    title: {
      fontSize: 18,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "700",
    },
    closeButton: {
      padding: 4,
    },
    closePressed: {
      opacity: 0.7,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 14,
      paddingHorizontal: 12,
      minHeight: 46,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontFamily: fonts.sans,
      fontSize: 14,
      paddingVertical: 10,
    },
    list: {
      flexGrow: 0,
      flexShrink: 1,
      maxHeight: 360,
    },
    listContent: {
      gap: 8,
      paddingBottom: 8,
    },
    emptyText: {
      textAlign: "center",
      color: colors.textMuted,
      fontFamily: fonts.sans,
      paddingVertical: 24,
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    cardSelected: {
      borderColor: colors.tint,
    },
    cardPressed: {
      opacity: 0.88,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    checkboxSelected: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    checkboxLabel: {
      color: colors.background,
      fontSize: 13,
      fontWeight: "700",
    },
    materialInfo: {
      flex: 1,
      gap: 4,
    },
    materialName: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    materialPrice: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    materialPriceMuted: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      fontStyle: "italic",
    },
    confirmButton: {
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: colors.tint,
    },
    confirmButtonDisabled: {
      opacity: 0.5,
    },
    confirmButtonText: {
      color: colors.background,
      fontFamily: fonts.rounded,
      fontSize: 16,
      fontWeight: "600",
    },
  });


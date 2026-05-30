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

import type { Product } from "@/features/products/product.types";
import { SaleProductSheetItem } from "@/features/sales/components/sale-product-sheet-item";
import { IconSymbol, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";

type SaleProductPickerSheetProps = {
  visible: boolean;
  products: Product[];
  pendingIds: number[];
  search: string;
  onSearchChange: (value: string) => void;
  onToggleProduct: (productId: number) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function SaleProductPickerSheet({
  visible,
  products,
  pendingIds,
  search,
  onSearchChange,
  onToggleProduct,
  onClose,
  onConfirm,
}: SaleProductPickerSheetProps) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const pendingSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const name = product.name.toLowerCase();
      const description = (product.description ?? "").toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [products, search]);

  const canConfirm = pendingIds.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <ThemedText style={styles.title}>Adicionar produtos</ThemedText>
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
                placeholder="Buscar por nome ou descrição"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <ThemedText style={styles.emptyText}>
                  {search.trim() ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                </ThemedText>
              }
              renderItem={({ item }) => (
                <SaleProductSheetItem
                  product={item}
                  selected={pendingSet.has(item.id)}
                  onToggle={() => onToggleProduct(item.id)}
                />
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
              <ThemedText style={styles.confirmButtonText}>Adicionar produtos</ThemedText>
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


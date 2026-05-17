import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

import { useProductStore } from "@/features/products/product-store";
import { SaleService } from "@/features/sales/sale-service";
import { useSaleStore } from "@/features/sales/sale-store";
import type { Sale } from "@/features/sales/sale.types";
import { PriceInput } from "@/shared/components/price-input";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { SaleProductPickerSheet } from "@/widgets/sales/sale-product-picker-sheet";
import { SaleSelectedProductItem } from "@/widgets/sales/sale-selected-product-item";

const saleFormSchema = z.object({
  notes: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

type SelectedProductState = {
  quantity: number;
  unitPriceInCents: number;
};

type ProductPickerSheetState = {
  search: string;
  pendingIds: number[];
};

function parsePriceDigitsToCents(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  const cents = Number(digits);
  return Number.isFinite(cents) ? cents : 0;
}

export default function SalesForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const { products, loadProducts } = useProductStore();
  const { createSale, updateSaleWithItems } = useSaleStore();

  const [isLoading, setIsLoading] = useState(false);
  const [existingSale, setExistingSale] = useState<Sale | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<number, SelectedProductState>>(
    {},
  );
  const [discountInCents, setDiscountInCents] = useState<number | null>(null);
  const [saleSoldAt, setSaleSoldAt] = useState("");
  const [pickerSheet, setPickerSheet] = useState<ProductPickerSheetState | null>(null);

  const isEditing = !!id;
  const title = isEditing ? "Editar venda" : "Nova venda";

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: { notes: "" },
    mode: "onSubmit",
  });

  const parsedId = useMemo(() => {
    if (!id) return null;
    const numeric = Number(id);
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) return null;
    return numeric;
  }, [id]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const productsSorted = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!isEditing) return;
    if (!parsedId) {
      Alert.alert("Erro", "ID inválido");
      router.back();
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    SaleService.getSaleById(parsedId)
      .then((loaded) => {
        if (!isMounted) return;
        setExistingSale(loaded);
        setDiscountInCents(loaded.discount_in_cents > 0 ? loaded.discount_in_cents : null);
        setSaleSoldAt(loaded.sold_at);
        form.reset({ notes: loaded.notes ?? "" });

        const nextSelected = loaded.items.reduce<Record<number, SelectedProductState>>(
          (accumulator, item) => {
            accumulator[item.product_id] = {
              quantity: item.quantity,
              unitPriceInCents: item.unit_price_in_cents,
            };
            return accumulator;
          },
          {},
        );
        setSelectedProducts(nextSelected);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "Falha ao carregar venda";
        Alert.alert("Erro", message);
        router.back();
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form, isEditing, parsedId, router]);

  const selectedEntries = useMemo(
    () =>
      Object.entries(selectedProducts).map(
        ([productId, data]) => [Number(productId), data] as const,
      ),
    [selectedProducts],
  );

  const subtotalInCents = useMemo(() => {
    return selectedEntries.reduce(
      (sum, [, data]) => sum + data.quantity * data.unitPriceInCents,
      0,
    );
  }, [selectedEntries]);

  const appliedDiscountInCents = discountInCents ?? 0;
  const totalInCents = Math.max(subtotalInCents - appliedDiscountInCents, 0);
  const selectedCount = selectedEntries.length;
  const isSubmitting = form.formState.isSubmitting;
  const hasDiscount = discountInCents !== null;

  function openProductPicker() {
    setPickerSheet({ search: "", pendingIds: [] });
  }

  function closeProductPicker() {
    setPickerSheet(null);
  }

  function togglePendingProduct(productId: number) {
    setPickerSheet((current) => {
      if (!current) return current;

      const isPending = current.pendingIds.includes(productId);
      return {
        ...current,
        pendingIds: isPending
          ? current.pendingIds.filter((id) => id !== productId)
          : [...current.pendingIds, productId],
      };
    });
  }

  function confirmProductPicker() {
    if (!pickerSheet || pickerSheet.pendingIds.length === 0) return;

    setSelectedProducts((current) => {
      const next = { ...current };

      for (const productId of pickerSheet.pendingIds) {
        if (next[productId]) continue;

        const product = productsById.get(productId);
        if (!product) continue;

        next[productId] = {
          quantity: 1,
          unitPriceInCents: product.price_in_cents,
        };
      }

      return next;
    });

    closeProductPicker();
  }

  function removeProduct(productId: number) {
    setSelectedProducts((current) => {
      if (!current[productId]) return current;
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function setProductQuantity(productId: number, quantity: number) {
    if (quantity < 1) {
      removeProduct(productId);
      return;
    }

    setSelectedProducts((current) => {
      const existing = current[productId];
      if (!existing) return current;

      return {
        ...current,
        [productId]: {
          ...existing,
          quantity,
        },
      };
    });
  }

  function handleDiscountToggle(enabled: boolean) {
    setDiscountInCents(enabled ? (discountInCents ?? 0) : null);
  }

  async function handleSubmit(values: SaleFormValues) {
    try {
      if (selectedEntries.length === 0) {
        Alert.alert("Erro", "Selecione ao menos um item");
        return;
      }

      const items = selectedEntries.map(([productId, data]) => ({
        product_id: productId,
        quantity: data.quantity,
        unit_price_in_cents: data.unitPriceInCents,
        subtotal_in_cents: data.quantity * data.unitPriceInCents,
      }));

      const notes = values.notes?.trim();

      if (!isEditing) {
        await createSale({
          total_in_cents: totalInCents,
          discount_in_cents: appliedDiscountInCents,
          notes: notes ? notes : undefined,
          items,
        });

        router.back();
        return;
      }

      if (!parsedId || !existingSale) {
        Alert.alert("Erro", "Venda inválida");
        return;
      }

      await updateSaleWithItems(parsedId, {
        sale: {
          total_in_cents: totalInCents,
          discount_in_cents: appliedDiscountInCents,
          notes: notes ? notes : null,
          sold_at: saleSoldAt || existingSale.sold_at,
        },
        items,
      });

      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao salvar venda";
      Alert.alert("Erro", message);
    }
  }

  return (
    <StackFormWrapper title={title}>
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.tint} />
          <Text style={styles.loadingText}>Carregando venda...</Text>
        </View>
      ) : (
        <>
          <View>
            <Text style={styles.sectionTitle}>Produtos selecionados</Text>

            {selectedCount === 0 ? (
              <Text style={styles.emptyProductsText}>Nenhum produto adicionado</Text>
            ) : (
              <View style={styles.selectedList}>
                {selectedEntries.map(([productId, data]) => {
                  const product = productsById.get(productId);
                  if (!product) return null;

                  return (
                    <SaleSelectedProductItem
                      key={productId}
                      product={product}
                      quantity={data.quantity}
                      unitPriceInCents={data.unitPriceInCents}
                      onQuantityChange={(quantity) => setProductQuantity(productId, quantity)}
                      onRemove={() => removeProduct(productId)}
                    />
                  );
                })}
              </View>
            )}

            <Pressable
              onPress={openProductPicker}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.addProductsButton,
                pressed && styles.addProductsPressed,
              ]}
            >
              <IconSymbol name="plus" size={18} color={theme.colors.tint} />
              <Text style={styles.addProductsText}>Adicionar produtos</Text>
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Itens selecionados</Text>
              <Text style={styles.summaryValue}>{selectedCount}</Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCentsToCurrency(subtotalInCents)}</Text>
            </View>

            <View style={styles.discountRow}>
              <Text style={styles.summaryLabel}>Desconto</Text>
              <Switch
                value={hasDiscount}
                onValueChange={handleDiscountToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.tint }}
                thumbColor={theme.colors.background}
              />
            </View>

            {hasDiscount ? (
              <PriceInput
                value={String(discountInCents ?? 0)}
                onChangeText={(text) => setDiscountInCents(parsePriceDigitsToCents(text))}
                placeholder="R$ 0,00"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.discountInput}
              />
            ) : null}

            {hasDiscount ? (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Valor do desconto</Text>
                <Text style={styles.summaryValue}>
                  {formatCentsToCurrency(appliedDiscountInCents)}
                </Text>
              </View>
            ) : null}

            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCentsToCurrency(totalInCents)}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Controller
              control={form.control}
              name="notes"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <>
                  <TextInput
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Opcional"
                    placeholderTextColor={theme.colors.textMuted}
                    style={[styles.notesInput, fieldState.error && styles.inputError]}
                    multiline
                    textAlignVertical="top"
                  />
                  {fieldState.error?.message ? (
                    <Text style={styles.errorText}>{fieldState.error.message}</Text>
                  ) : null}
                </>
              )}
            />
          </View>

          <Pressable
            onPress={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting || selectedCount === 0}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.submitButton,
              (pressed || isSubmitting || selectedCount === 0) && styles.submitButtonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? "Salvar venda" : "Criar venda"}
              </Text>
            )}
          </Pressable>
        </>
      )}

      <SaleProductPickerSheet
        visible={pickerSheet !== null}
        products={productsSorted}
        pendingIds={pickerSheet?.pendingIds ?? []}
        search={pickerSheet?.search ?? ""}
        onSearchChange={(search) =>
          setPickerSheet((current) => (current ? { ...current, search } : current))
        }
        onToggleProduct={togglePendingProduct}
        onClose={closeProductPicker}
        onConfirm={confirmProductPicker}
      />
    </StackFormWrapper>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    loadingWrap: {
      alignItems: "center",
      paddingVertical: 40,
      gap: 12,
    },
    loadingText: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    summaryCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      gap: 10,
    },
    summaryLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    discountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryLabel: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
      fontSize: 13,
    },
    summaryValue: {
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    discountInput: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 14,
      color: colors.text,
      fontFamily: fonts.sans,
      fontSize: 14,
    },
    totalLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: {
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      fontSize: 15,
    },
    totalValue: {
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "700",
      fontSize: 16,
    },
    sectionTitle: {
      fontSize: 18,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      marginBottom: 12,
    },
    selectedList: {
      gap: 8,
      marginBottom: 12,
    },
    emptyProductsText: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
      fontSize: 14,
      marginBottom: 12,
    },
    addProductsButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.tint,
      paddingVertical: 12,
    },
    addProductsPressed: {
      opacity: 0.85,
    },
    addProductsText: {
      color: colors.tint,
      fontFamily: fonts.rounded,
      fontSize: 15,
      fontWeight: "600",
    },
    notesInput: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 16,
      minHeight: 64,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontFamily: fonts.sans,
      fontSize: 14,
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontFamily: fonts.sans,
      fontSize: 12,
    },
    submitButton: {
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: colors.tint,
    },
    submitButtonPressed: {
      opacity: 0.85,
    },
    submitButtonText: {
      color: colors.background,
      fontFamily: fonts.rounded,
      fontSize: 16,
      fontWeight: "600",
    },
  });


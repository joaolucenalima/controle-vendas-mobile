import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { z } from "zod";

import { ExpenseService } from "@/features/expenses/expense-service";
import { useExpenseStore } from "@/features/expenses/expense-store";
import { useMaterialStore } from "@/features/materials/material-store";
import type { Material } from "@/features/materials/material.types";
import { DatePickerField } from "@/shared/components/date-picker-field";
import ThemedText from "@/shared/components/themed-text";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { dateFilterKeyToSoldAtIso, getTodayDateFilterKey } from "@/shared/utils/format-date-filter";
import { ExpenseSelectedMaterialItem } from "@/widgets/materials/expense-selected-material-item";
import { MaterialPickerSheet } from "@/widgets/materials/material-picker-sheet";

const formSchema = z.object({
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type SelectedMaterialState = {
  quantity: number;
  unitPriceInCents: number;
};

type MaterialPickerSheetState = {
  search: string;
  pendingIds: number[];
};

function buildFallbackMaterial(materialId: number): Material {
  return {
    id: materialId,
    name: `Material #${materialId}`,
    price_in_cents: null,
    created_at: "",
  };
}

export default function ExpensesForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const { createExpense, updateExpense } = useExpenseStore();
  const { materials, loadMaterials } = useMaterialStore();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<number, SelectedMaterialState>>(
    {},
  );
  const [pickerSheet, setPickerSheet] = useState<MaterialPickerSheetState | null>(null);
  const [expenseDate, setExpenseDate] = useState(getTodayDateFilterKey);

  const title = isEditing ? "Editar despesa" : "Nova despesa";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { notes: "" },
    mode: "onSubmit",
  });

  useFocusEffect(
    useCallback(() => {
      loadMaterials();
    }, [loadMaterials]),
  );

  const parsedId = useMemo(() => {
    if (!id) return null;
    const numeric = Number(id);
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) return null;
    return numeric;
  }, [id]);

  const materialsById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );

  const materialsSorted = useMemo(() => {
    return [...materials].sort((a, b) => a.name.localeCompare(b.name));
  }, [materials]);

  useEffect(() => {
    if (!isEditing) return;
    if (!parsedId) {
      Alert.alert("Erro", "ID inválido");
      router.back();
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    ExpenseService.getExpenseById(parsedId)
      .then((loaded) => {
        if (!isMounted) return;

        form.reset({
          notes: loaded.notes ?? "",
        });

        const nextSelected = loaded.materials.reduce<Record<number, SelectedMaterialState>>(
          (accumulator, item) => {
            accumulator[item.material_id] = {
              quantity: item.quantity,
              unitPriceInCents: item.material_price_in_cents,
            };
            return accumulator;
          },
          {},
        );

        setSelectedMaterials(nextSelected);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "Falha ao carregar despesa";
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
      Object.entries(selectedMaterials).map(
        ([materialId, data]) => [Number(materialId), data] as const,
      ),
    [selectedMaterials],
  );

  const totalInCents = useMemo(() => {
    return selectedEntries.reduce(
      (sum, [, data]) => sum + data.quantity * data.unitPriceInCents,
      0,
    );
  }, [selectedEntries]);

  const selectedCount = selectedEntries.length;
  const isSubmitting = form.formState.isSubmitting;

  function openMaterialPicker() {
    setPickerSheet({ search: "", pendingIds: [] });
  }

  function closeMaterialPicker() {
    setPickerSheet(null);
  }

  function togglePendingMaterial(materialId: number) {
    setPickerSheet((current) => {
      if (!current) return current;

      const isPending = current.pendingIds.includes(materialId);
      return {
        ...current,
        pendingIds: isPending
          ? current.pendingIds.filter((id) => id !== materialId)
          : [...current.pendingIds, materialId],
      };
    });
  }

  function confirmMaterialPicker() {
    if (!pickerSheet || pickerSheet.pendingIds.length === 0) return;

    setSelectedMaterials((current) => {
      const next = { ...current };

      for (const materialId of pickerSheet.pendingIds) {
        if (next[materialId]) continue;

        const material = materialsById.get(materialId);
        if (!material) continue;

        next[materialId] = {
          quantity: 1,
          unitPriceInCents: material.price_in_cents ?? 0,
        };
      }

      return next;
    });

    closeMaterialPicker();
  }

  function removeMaterial(materialId: number) {
    setSelectedMaterials((current) => {
      if (!current[materialId]) return current;
      const next = { ...current };
      delete next[materialId];
      return next;
    });
  }

  function setMaterialQuantity(materialId: number, quantity: number) {
    if (quantity < 1) {
      return;
    }

    setSelectedMaterials((current) => {
      const existing = current[materialId];
      if (!existing) return current;

      return {
        ...current,
        [materialId]: {
          ...existing,
          quantity,
        },
      };
    });
  }

  function setMaterialUnitPrice(materialId: number, unitPriceInCents: number) {
    setSelectedMaterials((current) => {
      const existing = current[materialId];
      if (!existing) return current;

      return {
        ...current,
        [materialId]: {
          ...existing,
          unitPriceInCents,
        },
      };
    });
  }

  async function onSubmit(values: FormValues) {
    try {
      if (selectedCount === 0) {
        Alert.alert("Erro", "Selecione ao menos um material");
        return;
      }

      if (totalInCents <= 0) {
        Alert.alert("Erro", "Defina um valor válido para os materiais");
        return;
      }

      const materialsPayload = selectedEntries.map(([materialId, data]) => ({
        material_id: materialId,
        quantity: data.quantity,
        material_price_in_cents: data.unitPriceInCents,
        subtotal_in_cents: data.quantity * data.unitPriceInCents,
      }));

      const notes = values.notes?.trim();

      const createdAt = dateFilterKeyToSoldAtIso(expenseDate);

      if (!isEditing) {
        await createExpense({
          amount_in_cents: totalInCents,
          notes: notes ? notes : undefined,
          materials: materialsPayload,
          created_at: createdAt,
        });

        router.back();
        return;
      }

      if (!parsedId) {
        Alert.alert("Erro", "ID inválido");
        return;
      }

      await updateExpense(parsedId, {
        amount_in_cents: totalInCents,
        notes: notes ? notes : null,
        materials: materialsPayload,
      });

      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao salvar despesa";
      Alert.alert("Erro", message);
    }
  }

  const submitLabel = isEditing ? "Salvar" : "Criar";

  const materialsList = selectedEntries.map(([materialId, data]) => {
    const material = materialsById.get(materialId) ?? buildFallbackMaterial(materialId);

    return (
      <ExpenseSelectedMaterialItem
        key={materialId}
        material={material}
        quantity={data.quantity}
        unitPriceInCents={data.unitPriceInCents}
        onQuantityChange={(quantity) => setMaterialQuantity(materialId, quantity)}
        onUnitPriceChange={(unitPriceInCents) => setMaterialUnitPrice(materialId, unitPriceInCents)}
        onRemove={() => removeMaterial(materialId)}
      />
    );
  });

  const availableMaterials = materialsSorted.filter((material) => !selectedMaterials[material.id]);

  return (
    <StackFormWrapper title={title}>
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.tint} />
          <ThemedText style={styles.loadingText}>Carregando despesa...</ThemedText>
        </View>
      ) : (
        <>
          <View>
            <ThemedText style={styles.label}>Data</ThemedText>
            <DatePickerField
              value={expenseDate}
              onChange={setExpenseDate}
              placeholder="Selecionar data"
            />
          </View>

          <View>
            <ThemedText style={styles.label}>Materiais</ThemedText>

            {selectedCount === 0 ? (
              <View style={styles.emptyMaterialsState}>
                <ThemedText style={styles.emptyMaterialsTitle}>
                  Nenhum material adicionado
                </ThemedText>
                <ThemedText style={styles.emptyMaterialsSubtitle}>
                  Selecione um ou mais materiais para compor esta despesa.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.selectedList}>{materialsList}</View>
            )}

            <Pressable
              onPress={openMaterialPicker}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.addMaterialsButton,
                pressed && styles.addMaterialsPressed,
              ]}
            >
              <IconSymbol name="plus" size={18} color={theme.colors.tint} />
              <ThemedText style={styles.addMaterialsText}>Adicionar materiais</ThemedText>
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryLine}>
              <ThemedText style={styles.summaryLabel}>Materiais selecionados</ThemedText>
              <ThemedText style={styles.summaryValue}>{selectedCount}</ThemedText>
            </View>

            <View style={styles.summaryLine}>
              <ThemedText style={styles.summaryLabel}>Total</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatCentsToCurrency(totalInCents)}
              </ThemedText>
            </View>
          </View>

          <View>
            <ThemedText style={styles.label}>Notas</ThemedText>
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
                    style={[styles.input, styles.textArea, fieldState.error && styles.inputError]}
                    multiline
                    textAlignVertical="top"
                  />
                  {fieldState.error?.message ? (
                    <ThemedText style={styles.errorText}>{fieldState.error.message}</ThemedText>
                  ) : null}
                </>
              )}
            />
          </View>

          <Pressable
            onPress={form.handleSubmit(onSubmit)}
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
              <ThemedText style={styles.submitButtonText}>{submitLabel}</ThemedText>
            )}
          </Pressable>
        </>
      )}

      <MaterialPickerSheet
        visible={pickerSheet !== null}
        materials={availableMaterials}
        pendingIds={pickerSheet?.pendingIds ?? []}
        search={pickerSheet?.search ?? ""}
        onSearchChange={(search) =>
          setPickerSheet((current) => (current ? { ...current, search } : current))
        }
        onToggleMaterial={togglePendingMaterial}
        onClose={closeMaterialPicker}
        onConfirm={confirmMaterialPicker}
      />
    </StackFormWrapper>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    label: {
      fontSize: 18,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      marginBottom: 12,
    },
    addMaterialsButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.tint,
      paddingVertical: 12,
      marginTop: 12,
    },
    addMaterialsPressed: {
      opacity: 0.85,
    },
    addMaterialsText: {
      color: colors.tint,
      fontFamily: fonts.rounded,
      fontSize: 15,
      fontWeight: "600",
    },
    selectedList: {
      gap: 10,
    },
    emptyMaterialsState: {
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      gap: 6,
    },
    emptyMaterialsTitle: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      textAlign: "center",
    },
    emptyMaterialsSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      textAlign: "center",
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
    input: {
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
    textArea: {
      minHeight: 96,
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      fontSize: 13,
      color: colors.error,
      fontFamily: fonts.sans,
    },
    submitButton: {
      marginTop: 10,
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
      fontSize: 16,
      fontWeight: "600",
      fontFamily: fonts.rounded,
    },
    loadingWrap: {
      paddingVertical: 40,
      gap: 12,
      alignItems: "center",
    },
    loadingText: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
  });


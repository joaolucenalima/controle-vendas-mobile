import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";

import { ExpenseService } from "@/features/expenses/expense-service";
import { useExpenseStore } from "@/features/expenses/expense-store";
import { expenseFormSchema, type ExpenseFormValues } from "@/features/expenses/schema";
import { ExpenseSelectedMaterialItem } from "@/features/materials/components/expense-selected-material-item";
import { MaterialPickerSheet } from "@/features/materials/components/material-picker-sheet";
import { useMaterialStore } from "@/features/materials/material-store";
import type { Material } from "@/features/materials/material.types";
import {
  Button,
  ConfirmationModal,
  DatePickerField,
  DeleteButton,
  IconSymbol,
  ThemedText,
} from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";
import { calculateSubtotalInCents } from "@/shared/utils/calculate-line-items-total";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { dateFilterKeyToSoldAtIso, getTodayDateFilterKey } from "@/shared/utils/format-date-filter";
import { parseRouteId } from "@/shared/utils/parse-route-id";

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
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const { createExpense, updateExpense, deleteExpense } = useExpenseStore();
  const { materials, loadMaterials } = useMaterialStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<number, SelectedMaterialState>>(
    {},
  );
  const [pickerSheet, setPickerSheet] = useState<MaterialPickerSheetState | null>(null);
  const [expenseDate, setExpenseDate] = useState(getTodayDateFilterKey);

  const parsedId = parseRouteId(id);
  const isEditing = parsedId !== null;
  const title = isEditing ? "Editar despesa" : "Nova despesa";

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { notes: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  useEffect(() => {
    if (!isEditing || !parsedId) {
      if (id && !parsedId) {
        Alert.alert("Erro", "ID inválido");
        router.back();
      }
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
  }, [form, id, isEditing, parsedId, router]);

  const materialsById = new Map(materials.map((material) => [material.id, material]));
  const selectedEntries = Object.entries(selectedMaterials).map(
    ([materialId, data]) => [Number(materialId), data] as const,
  );
  const totalInCents = calculateSubtotalInCents(selectedEntries.map(([, data]) => data));
  const selectedCount = selectedEntries.length;
  const isSubmitting = form.formState.isSubmitting;
  const availableMaterials = [...materials]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((material) => !selectedMaterials[material.id]);

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
          ? current.pendingIds.filter((pendingId) => pendingId !== materialId)
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

  async function onSubmit(values: ExpenseFormValues) {
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

  async function handleDeleteExpense() {
    if (!parsedId) {
      Alert.alert("Erro", "ID inválido");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteExpense(parsedId);
      setIsDeleteModalVisible(false);
      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao excluir despesa";
      Alert.alert("Erro", message);
    } finally {
      setIsDeleting(false);
    }
  }

  const submitLabel = isEditing ? "Salvar" : "Criar";

  return (
    <StackFormWrapper
      title={title}
      headerRight={
        isEditing ? <DeleteButton onPress={() => setIsDeleteModalVisible(true)} /> : null
      }
    >
      <ConfirmationModal
        visible={isDeleteModalVisible}
        title="Excluir despesa?"
        message="Essa ação é permanente e vai remover a despesa do cadastro."
        confirmLabel="Excluir"
        confirmTone="danger"
        isConfirming={isDeleting}
        onConfirm={handleDeleteExpense}
        onCancel={() => setIsDeleteModalVisible(false)}
      />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.tint} />
          <ThemedText style={styles.loadingText}>Carregando despesa...</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <ThemedText style={styles.label}>Data</ThemedText>
            <DatePickerField
              value={expenseDate}
              onChange={setExpenseDate}
              placeholder="Selecionar data"
            />
          </View>

          <View style={styles.section}>
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
              <View style={styles.selectedList}>
                {selectedEntries.map(([materialId, data]) => {
                  const material =
                    materialsById.get(materialId) ?? buildFallbackMaterial(materialId);

                  return (
                    <ExpenseSelectedMaterialItem
                      key={materialId}
                      material={material}
                      quantity={data.quantity}
                      unitPriceInCents={data.unitPriceInCents}
                      onQuantityChange={(quantity) => setMaterialQuantity(materialId, quantity)}
                      onUnitPriceChange={(unitPriceInCents) =>
                        setMaterialUnitPrice(materialId, unitPriceInCents)
                      }
                      onRemove={() => removeMaterial(materialId)}
                    />
                  );
                })}
              </View>
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

          <View style={styles.section}>
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

          <Button
            label={submitLabel}
            onPress={form.handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting || selectedCount === 0}
            style={styles.submitButton}
          />
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
    section: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
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
      gap: 8,
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
      fontSize: 16,
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


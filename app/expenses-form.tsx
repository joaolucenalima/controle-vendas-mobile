import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { ExpenseService } from "@/features/expenses/expense-service";
import { useExpenseStore } from "@/features/expenses/expense-store";
import { useMaterialStore } from "@/features/materials/material-store";
import type { Material } from "@/features/materials/material.types";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { ExpenseSelectedMaterialItem } from "@/widgets/materials/expense-selected-material-item";
import { MaterialPickerSheet } from "@/widgets/materials/material-picker-sheet";

const formSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório"),
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

  const title = isEditing ? "Editar despesa" : "Nova despesa";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", notes: "" },
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
          title: loaded.title,
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
      removeMaterial(materialId);
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
      const titleTrimmed = values.title.trim();

      if (!isEditing) {
        await createExpense({
          title: titleTrimmed,
          amount_in_cents: totalInCents,
          notes: notes ? notes : undefined,
          materials: materialsPayload,
        });

        router.back();
        return;
      }

      if (!parsedId) {
        Alert.alert("Erro", "ID inválido");
        return;
      }

      await updateExpense(parsedId, {
        title: titleTrimmed,
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title,
          headerShown: true,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={12}
              style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
            >
              <IconSymbol name="chevron.left" size={22} color={theme.colors.text} />
            </Pressable>
          ),
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.select({ ios: "padding", android: undefined })}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={theme.colors.tint} />
                <Text style={styles.loadingText}>Carregando despesa...</Text>
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.label}>Materiais</Text>
                    <Pressable
                      onPress={openMaterialPicker}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.linkButton,
                        pressed && styles.linkButtonPressed,
                      ]}
                    >
                      <Text style={styles.linkButtonText}>Adicionar materiais</Text>
                    </Pressable>
                  </View>

                  {selectedCount === 0 ? (
                    <View style={styles.emptyMaterialsState}>
                      <Text style={styles.emptyMaterialsTitle}>Nenhum material adicionado</Text>
                      <Text style={styles.emptyMaterialsSubtitle}>
                        Selecione um ou mais materiais para compor esta despesa.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.selectedList}>{materialsList}</View>
                  )}
                </View>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Materiais selecionados</Text>
                    <Text style={styles.summaryValue}>{selectedCount}</Text>
                  </View>

                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Total</Text>
                    <Text style={styles.summaryValue}>{formatCentsToCurrency(totalInCents)}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Título</Text>
                  <Controller
                    control={form.control}
                    name="title"
                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                      <>
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Ex: Compra de material"
                          placeholderTextColor={theme.colors.textMuted}
                          style={[styles.input, fieldState.error && styles.inputError]}
                          autoCapitalize="sentences"
                          returnKeyType="next"
                        />
                        {fieldState.error?.message ? (
                          <Text style={styles.errorText}>{fieldState.error.message}</Text>
                        ) : null}
                      </>
                    )}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Notas</Text>
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
                          style={[
                            styles.input,
                            styles.textArea,
                            fieldState.error && styles.inputError,
                          ]}
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
                    <Text style={styles.submitButtonText}>{submitLabel}</Text>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
    },
    keyboard: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 28,
      gap: 16,
    },
    headerButton: {
      borderRadius: 999,
      padding: 8,
    },
    headerButtonPressed: {
      opacity: 0.7,
    },
    section: {
      gap: 8,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    label: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    linkButton: {
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    linkButtonPressed: {
      opacity: 0.7,
    },
    linkButtonText: {
      color: colors.tint,
      fontSize: 13,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    selectedList: {
      gap: 10,
    },
    emptyMaterialsState: {
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
    },
    emptyMaterialsSubtitle: {
      fontSize: 13,
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
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      color: colors.text,
      fontSize: 16,
      fontFamily: fonts.sans,
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

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import type { Expense } from "@/features/expenses/expense.types";
import { PriceInput } from "@/shared/components/price-input";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";

const priceStringSchema = z
  .string()
  .trim()
  .min(1, "Valor obrigatório")
  .refine((value) => {
    const cents = parsePriceToCents(value);
    return cents !== null && cents > 0;
  }, "Valor inválido");

const formSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório"),
  category: z.string().optional(),
  notes: z.string().optional(),
  amount: priceStringSchema,
});

type FormValues = z.infer<typeof formSchema>;

function parsePriceToCents(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(/[^0-9.,]/g, "");
  if (!cleaned) return null;

  const normalized = cleaned.replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;

  const [whole, fractionRaw] = normalized.split(".");
  const wholeNumber = Number(whole);
  if (!Number.isFinite(wholeNumber)) return null;

  const fraction = (fractionRaw ?? "").padEnd(2, "0").slice(0, 2);
  const fractionNumber = fraction ? Number(fraction) : 0;
  if (!Number.isFinite(fractionNumber)) return null;

  return wholeNumber * 100 + fractionNumber;
}

function formatCentsToPriceString(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ExpensesForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const { createExpense, updateExpense } = useExpenseStore();

  const [isLoading, setIsLoading] = useState(false);
  const [expense, setExpense] = useState<Expense | null>(null);

  const title = isEditing ? "Editar despesa" : "Nova despesa";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", category: "", notes: "", amount: "" },
    mode: "onSubmit",
  });

  const parsedId = useMemo(() => {
    if (!id) return null;
    const numeric = Number(id);
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) return null;
    return numeric;
  }, [id]);

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
        setExpense(loaded);
        form.reset({
          title: loaded.title,
          category: loaded.category ?? "",
          notes: loaded.notes ?? "",
          amount: formatCentsToPriceString(loaded.amount_in_cents),
        });
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

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    try {
      const amountInCents = parsePriceToCents(values.amount);
      if (amountInCents === null || amountInCents <= 0) {
        form.setError("amount", { message: "Valor inválido" });
        return;
      }

      const titleTrimmed = values.title.trim();
      const categoryTrimmed = values.category?.trim() ?? "";
      const notesTrimmed = values.notes?.trim() ?? "";

      if (!isEditing) {
        await createExpense({
          title: titleTrimmed,
          category: categoryTrimmed ? categoryTrimmed : undefined,
          notes: notesTrimmed ? notesTrimmed : undefined,
          amount_in_cents: amountInCents,
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
        category: categoryTrimmed ? categoryTrimmed : null,
        notes: notesTrimmed ? notesTrimmed : null,
        amount_in_cents: amountInCents,
      });

      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao salvar despesa";
      Alert.alert("Erro", message);
    }
  }

  const submitLabel = isEditing ? "Salvar" : "Criar";

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
                  <Text style={styles.label}>Valor</Text>
                  <Controller
                    control={form.control}
                    name="amount"
                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                      <>
                        <PriceInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="R$ 0,00"
                          style={[styles.input, fieldState.error && styles.inputError]}
                        />
                        {fieldState.error?.message ? (
                          <Text style={styles.errorText}>{fieldState.error.message}</Text>
                        ) : null}
                      </>
                    )}
                  />
                  {expense ? (
                    <Text style={styles.helperText}>
                      Atual: {formatCentsToPriceString(expense.amount_in_cents)}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Categoria</Text>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                      <>
                        <TextInput
                          value={value ?? ""}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Opcional"
                          placeholderTextColor={theme.colors.textMuted}
                          style={[styles.input, fieldState.error && styles.inputError]}
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
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.submitButton,
                    (pressed || isSubmitting) && styles.submitButtonPressed,
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
    label: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
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
    helperText: {
      fontSize: 12,
      color: colors.textMuted,
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


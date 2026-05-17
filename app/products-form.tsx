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

import { ProductService } from "@/features/products/product-service";
import { useProductStore } from "@/features/products/product-store";
import type { Product } from "@/features/products/product.types";
import { PriceInput } from "@/shared/components/price-input";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";

const priceStringSchema = z
  .string()
  .trim()
  .min(1, "Preço obrigatório")
  .refine((value) => {
    const cents = parsePriceToCents(value);
    return cents !== null && cents > 0;
  }, "Preço inválido");

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  price: priceStringSchema,
});

type ProductFormValues = z.infer<typeof productFormSchema>;

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

export default function ProductsForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const { createProduct, updateProduct } = useProductStore();

  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const isEditing = !!id;
  const title = isEditing ? "Editar produto" : "Novo produto";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: "", description: "", price: "" },
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
    setIsLoadingProduct(true);

    ProductService.getProductById(parsedId)
      .then((loaded) => {
        if (!isMounted) return;
        setProduct(loaded);
        form.reset({
          name: loaded.name,
          description: loaded.description ?? "",
          price: formatCentsToPriceString(loaded.price_in_cents),
        });
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "Falha ao carregar produto";
        Alert.alert("Erro", message);
        router.back();
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingProduct(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form, isEditing, parsedId, router]);

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ProductFormValues) {
    try {
      const priceInCents = parsePriceToCents(values.price);
      if (priceInCents === null || priceInCents <= 0) {
        form.setError("price", { message: "Preço inválido" });
        return;
      }

      const name = values.name.trim();
      const descriptionTrimmed = values.description?.trim() ?? "";

      if (!isEditing) {
        await createProduct({
          name,
          description: descriptionTrimmed ? descriptionTrimmed : undefined,
          price_in_cents: priceInCents,
        });

        router.back();
        return;
      }

      if (!parsedId) {
        Alert.alert("Erro", "ID inválido");
        return;
      }

      await updateProduct(parsedId, {
        name,
        description: descriptionTrimmed ? descriptionTrimmed : null,
        price_in_cents: priceInCents,
      });

      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao salvar produto";
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
            {isLoadingProduct ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={theme.colors.tint} />
                <Text style={styles.loadingText}>Carregando produto...</Text>
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>Nome</Text>
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                      <>
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Ex: Café especial"
                          placeholderTextColor={theme.colors.textMuted}
                          style={[styles.input, fieldState.error && styles.inputError]}
                          autoCapitalize="words"
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
                  <Text style={styles.label}>Preço</Text>
                  <Controller
                    control={form.control}
                    name="price"
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
                  {product ? (
                    <Text style={styles.helperText}>
                      Atual: {formatCentsToPriceString(product.price_in_cents)}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Descrição</Text>
                  <Controller
                    control={form.control}
                    name="description"
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


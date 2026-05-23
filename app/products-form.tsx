import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { z } from "zod";

import { ProductService } from "@/features/products/product-service";
import { useProductStore } from "@/features/products/product-store";
import type { Product } from "@/features/products/product.types";
import { PriceInput } from "@/shared/components/price-input";
import ThemedText from "@/shared/components/themed-text";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Permita acesso às fotos para selecionar uma imagem.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setImageUrl(result.assets[0].uri);
  }

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
          image_url: imageUrl?.trim() ?? null,
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
        image_url: imageUrl?.trim() ?? null,
      });

      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao salvar produto";
      Alert.alert("Erro", message);
    }
  }

  const submitLabel = isEditing ? "Salvar" : "Criar";

  return (
    <StackFormWrapper title={title}>
      {isLoadingProduct ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.tint} />
          <ThemedText style={styles.loadingText}>Carregando produto...</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <ThemedText style={styles.label}>Nome</ThemedText>
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
                    <ThemedText style={styles.errorText}>{fieldState.error.message}</ThemedText>
                  ) : null}
                </>
              )}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.label}>Preço</ThemedText>
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
                    <ThemedText style={styles.errorText}>{fieldState.error.message}</ThemedText>
                  ) : null}
                </>
              )}
            />
            {product ? (
              <ThemedText style={styles.helperText}>
                Atual: {formatCentsToPriceString(product.price_in_cents)}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.label}>Imagem do produto</ThemedText>

            {imageUrl ? (
              <>
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} contentFit="cover" />

                <View style={styles.imageActions}>
                  <Pressable
                    onPress={handlePickImage}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.imageButton,
                      pressed && styles.imageButtonPressed,
                    ]}
                  >
                    <ThemedText style={styles.imageButtonText}>Selecionar outra imagem</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setImageUrl(null)}
                    accessibilityRole="button"
                    disabled={!imageUrl}
                    style={({ pressed }) => [
                      styles.imageButtonSecondary,
                      (!imageUrl || pressed) && styles.imageButtonSecondaryPressed,
                    ]}
                  >
                    <ThemedText style={styles.imageButtonSecondaryText}>Remover</ThemedText>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable
                onPress={handlePickImage}
                accessibilityRole="button"
                style={styles.imagePlaceholderButton}
              >
                <IconSymbol name="camera.fill" size={36} color={theme.colors.textMuted} />
                <ThemedText style={styles.imagePlaceholderText}>
                  Nenhuma imagem selecionada
                </ThemedText>
                <ThemedText style={styles.addImageText}>
                  Clique para adicionar uma imagem
                </ThemedText>
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.label}>Descrição</ThemedText>
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
              <ThemedText style={styles.submitButtonText}>{submitLabel}</ThemedText>
            )}
          </Pressable>
        </>
      )}
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
    imagePreview: {
      height: 240,
      aspectRatio: 1,
      alignSelf: "center",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    imagePlaceholderButton: {
      width: "100%",
      paddingVertical: 20,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    imagePlaceholderText: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: fonts.sans,
    },
    addImageText: {
      color: colors.tint,
      fontSize: 14,
      fontWeight: 500,
      marginTop: 4,
    },
    imageActions: {
      flexDirection: "row",
      gap: 10,
    },
    imageButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.tint,
    },
    imageButtonPressed: {
      opacity: 0.85,
    },
    imageButtonText: {
      color: colors.background,
      fontSize: 14,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    imageButtonSecondary: {
      paddingHorizontal: 16,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    imageButtonSecondaryPressed: {
      opacity: 0.85,
    },
    imageButtonSecondaryText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    imageUrlInput: {
      marginTop: 2,
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


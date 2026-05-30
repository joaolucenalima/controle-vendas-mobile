import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";

import { ProductService } from "@/features/products/product-service";
import { productFormSchema, type ProductFormValues } from "@/features/products/schema";
import { useProductStore } from "@/features/products/product-store";
import type { Product } from "@/features/products/product.types";
import {
  Button,
  ConfirmationModal,
  DeleteButton,
  IconSymbol,
  PriceInput,
  ThemedText,
} from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { parsePriceToCents } from "@/shared/utils/parse-price-to-cents";
import { parseRouteId } from "@/shared/utils/parse-route-id";

export default function ProductsForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const { createProduct, updateProduct, deleteProduct } = useProductStore();

  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const parsedId = parseRouteId(id);
  const isEditing = parsedId !== null;
  const title = isEditing ? "Editar produto" : "Novo produto";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: "", description: "", price: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!isEditing || !parsedId) {
      if (id && !parsedId) {
        Alert.alert("Erro", "ID inválido");
        router.back();
      }
      return;
    }

    let isMounted = true;
    setIsLoadingProduct(true);

    ProductService.getProductById(parsedId)
      .then((loaded) => {
        if (!isMounted) return;
        setProduct(loaded);
        setImageUrl(loaded.image_url);
        form.reset({
          name: loaded.name,
          description: loaded.description ?? "",
          price: formatCentsToCurrency(loaded.price_in_cents),
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
  }, [form, id, isEditing, parsedId, router]);

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

  async function handleDeleteProduct() {
    if (!parsedId) {
      Alert.alert("Erro", "ID inválido");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProduct(parsedId);
      setIsDeleteModalVisible(false);
      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao excluir produto";
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
        title="Excluir produto?"
        message="Essa ação é permanente e vai remover o produto do cadastro."
        confirmLabel="Excluir"
        confirmTone="danger"
        isConfirming={isDeleting}
        onConfirm={handleDeleteProduct}
        onCancel={() => setIsDeleteModalVisible(false)}
      />

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
                Atual: {formatCentsToCurrency(product.price_in_cents)}
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

          <Button
            label={submitLabel}
            onPress={form.handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submitButton}
          />
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
      borderColor: colors.textMuted,
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
      fontWeight: 600,
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

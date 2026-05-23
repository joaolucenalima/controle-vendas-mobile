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
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { MaterialService } from "@/features/materials/material-service";
import { useMaterialStore } from "@/features/materials/material-store";
import type { Material } from "@/features/materials/material.types";
import { ConfirmationModal } from "@/shared/components/confirmation-modal";
import { DeleteButton } from "@/shared/components/delete-button";
import { PriceInput } from "@/shared/components/price-input";
import ThemedText from "@/shared/components/themed-text";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";

const materialFormSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  price: z.string().optional(),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

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

export default function MaterialsForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);

  const { createMaterial, updateMaterial, deleteMaterial } = useMaterialStore();

  const [isLoadingMaterial, setIsLoadingMaterial] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [material, setMaterial] = useState<Material | null>(null);

  const isEditing = !!id;
  const title = isEditing ? "Editar material" : "Novo material";

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: { name: "", price: "" },
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
    setIsLoadingMaterial(true);

    MaterialService.getMaterialById(parsedId)
      .then((loaded) => {
        if (!isMounted) return;
        setMaterial(loaded);
        form.reset({
          name: loaded.name,
          price:
            loaded.price_in_cents !== null ? formatCentsToPriceString(loaded.price_in_cents) : "",
        });
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "Falha ao carregar material";
        Alert.alert("Erro", message);
        router.back();
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingMaterial(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form, isEditing, parsedId, router]);

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: MaterialFormValues) {
    try {
      const priceInCents = parsePriceToCents(values.price ?? "");
      const name = values.name.trim();

      if (!isEditing) {
        await createMaterial({
          name,
          price_in_cents: priceInCents,
        });

        router.back();
        return;
      }

      if (!parsedId) {
        Alert.alert("Erro", "ID inválido");
        return;
      }

      await updateMaterial(parsedId, {
        name,
        price_in_cents: priceInCents,
      });

      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao salvar material";
      Alert.alert("Erro", message);
    }
  }

  async function handleDeleteMaterial() {
    if (!parsedId) {
      Alert.alert("Erro", "ID inválido");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteMaterial(parsedId);
      setIsDeleteModalVisible(false);
      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao excluir material";
      Alert.alert("Erro", message);
    } finally {
      setIsDeleting(false);
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
          headerRight: () =>
            isEditing ? <DeleteButton onPress={() => setIsDeleteModalVisible(true)} /> : null,
        }}
      />

      <ConfirmationModal
        visible={isDeleteModalVisible}
        title="Excluir material?"
        message="Essa ação é permanente e vai remover o material do cadastro."
        confirmLabel="Excluir"
        confirmTone="danger"
        isConfirming={isDeleting}
        onConfirm={handleDeleteMaterial}
        onCancel={() => setIsDeleteModalVisible(false)}
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
            {isLoadingMaterial ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={theme.colors.tint} />
                <ThemedText style={styles.loadingText}>Carregando material...</ThemedText>
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
                          placeholder="Ex: Madeira tratada"
                          placeholderTextColor={theme.colors.textMuted}
                          style={[styles.input, fieldState.error && styles.inputError]}
                          autoCapitalize="words"
                          returnKeyType="next"
                        />
                        {fieldState.error?.message ? (
                          <ThemedText style={styles.errorText}>
                            {fieldState.error.message}
                          </ThemedText>
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
                          value={value ?? ""}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Opcional"
                          style={[styles.input, fieldState.error && styles.inputError]}
                        />
                        {fieldState.error?.message ? (
                          <ThemedText style={styles.errorText}>
                            {fieldState.error.message}
                          </ThemedText>
                        ) : null}
                      </>
                    )}
                  />
                  {material && material.price_in_cents !== null ? (
                    <ThemedText style={styles.helperText}>
                      Atual: {formatCentsToPriceString(material.price_in_cents)}
                    </ThemedText>
                  ) : (
                    <ThemedText style={styles.helperText}>
                      Preço opcional para este material
                    </ThemedText>
                  )}
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
      fontSize: 16,
      color: colors.text,
      fontFamily: fonts.sans,
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      fontFamily: fonts.sans,
    },
    helperText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    loadingWrap: {
      flex: 1,
      minHeight: 260,
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    submitButton: {
      marginTop: 8,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: colors.tint,
    },
    submitButtonPressed: {
      opacity: 0.88,
    },
    submitButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "600",
      fontFamily: fonts.rounded,
    },
  });


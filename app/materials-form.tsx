import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from "react-native";

import { MaterialService } from "@/features/materials/material-service";
import { materialFormSchema, type MaterialFormValues } from "@/features/materials/schema";
import { useMaterialStore } from "@/features/materials/material-store";
import type { Material } from "@/features/materials/material.types";
import {
  Button,
  ConfirmationModal,
  DeleteButton,
  PriceInput,
  ThemedText,
} from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";
import { formatCentsToCurrency } from "@/shared/utils/format-cents-to-currency";
import { parsePriceToCents } from "@/shared/utils/parse-price-to-cents";
import { parseRouteId } from "@/shared/utils/parse-route-id";

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

  const parsedId = parseRouteId(id);
  const isEditing = parsedId !== null;
  const title = isEditing ? "Editar material" : "Novo material";

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: { name: "", price: "" },
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
    setIsLoadingMaterial(true);

    MaterialService.getMaterialById(parsedId)
      .then((loaded) => {
        if (!isMounted) return;
        setMaterial(loaded);
        form.reset({
          name: loaded.name,
          price:
            loaded.price_in_cents !== null ? formatCentsToCurrency(loaded.price_in_cents) : "",
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
  }, [form, id, isEditing, parsedId, router]);

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
    <StackFormWrapper
      title={title}
      headerRight={
        isEditing ? <DeleteButton onPress={() => setIsDeleteModalVisible(true)} /> : null
      }
    >
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
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Opcional"
                    style={[styles.input, fieldState.error && styles.inputError]}
                  />
                  {fieldState.error?.message ? (
                    <ThemedText style={styles.errorText}>{fieldState.error.message}</ThemedText>
                  ) : null}
                </>
              )}
            />
            {material && material.price_in_cents !== null ? (
              <ThemedText style={styles.helperText}>
                Atual: {formatCentsToCurrency(material.price_in_cents)}
              </ThemedText>
            ) : (
              <ThemedText style={styles.helperText}>Preço opcional para este material</ThemedText>
            )}
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
      fontSize: 16,
      color: colors.text,
      fontFamily: fonts.sans,
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
    loadingWrap: {
      paddingVertical: 40,
      gap: 12,
      alignItems: "center",
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    submitButton: {
      marginTop: 10,
    },
  });

import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, DevSettings, Pressable, StyleSheet, View } from "react-native";

import { resetDatabase } from "@/database/reset-database";
import ThemedText from "@/shared/components/themed-text";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const [isResetting, setIsResetting] = useState(false);

  function handleResetPress() {
    Alert.alert(
      "Limpar banco de dados?",
      "Esta ação remove todos os dados locais e recarrega o app.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar banco",
          style: "destructive",
          onPress: async () => {
            try {
              setIsResetting(true);
              await resetDatabase();
              DevSettings.reload();
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : "Falha ao limpar banco";
              Alert.alert("Erro", message);
              setIsResetting(false);
            }
          },
        },
      ],
    );
  }

  if (!__DEV__) {
    return (
      <StackFormWrapper title="Configurações">
        <View style={styles.unavailableCard}>
          <ThemedText style={styles.unavailableTitle}>Não disponível</ThemedText>
          <ThemedText style={styles.unavailableText}>
            Esta página é exclusiva para ambiente de desenvolvimento.
          </ThemedText>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <ThemedText style={styles.secondaryButtonText}>Voltar</ThemedText>
          </Pressable>
        </View>
      </StackFormWrapper>
    );
  }

  return (
    <StackFormWrapper title="Configurações">
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Ferramentas de desenvolvimento</ThemedText>
        <ThemedText style={styles.cardDescription}>
          Use este atalho para resetar o SQLite local durante testes.
        </ThemedText>

        <Pressable
          onPress={handleResetPress}
          disabled={isResetting}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.dangerButton,
            (pressed || isResetting) && styles.buttonPressed,
          ]}
        >
          {isResetting ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <ThemedText style={styles.dangerButtonText}>Limpar banco de dados</ThemedText>
          )}
        </Pressable>
      </View>
    </StackFormWrapper>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      gap: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      color: colors.text,
    },
    cardDescription: {
      fontSize: 14,
      fontFamily: fonts.sans,
      color: colors.textMuted,
    },
    dangerButton: {
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.error,
      marginTop: 4,
    },
    dangerButtonText: {
      color: colors.background,
      fontSize: 14,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    unavailableCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      gap: 12,
      alignItems: "flex-start",
    },
    unavailableTitle: {
      fontSize: 16,
      fontFamily: fonts.rounded,
      fontWeight: "600",
      color: colors.text,
    },
    unavailableText: {
      fontSize: 14,
      fontFamily: fonts.sans,
      color: colors.textMuted,
    },
    secondaryButton: {
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });

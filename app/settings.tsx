import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, DevSettings, StyleSheet, View } from "react-native";

import { resetDatabase } from "@/database/reset-database";
import { Button, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";

export default function SettingsScreen() {
  const router = useRouter();
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
          <Button
            label="Voltar"
            onPress={() => router.back()}
            variant="secondary"
            size="md"
            fullWidth={false}
          />
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

        <Button
          label="Limpar banco de dados"
          onPress={handleResetPress}
          variant="danger"
          size="md"
          loading={isResetting}
          disabled={isResetting}
          style={styles.dangerButton}
        />
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
      marginTop: 4,
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
  });

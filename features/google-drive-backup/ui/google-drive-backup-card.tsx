import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";

import { Button, IconSymbol, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { useState } from "react";
import { useBackupStore } from "../backup-store";
import type { DriveBackupFile } from "../backup.types";
import { GoogleDriveError } from "../google-drive-client";
import { BackupPickerModal } from "./backup-picker-modal";
import { GoogleLoginCancelledError, useGoogleDriveLogin } from "./make-login";

function getErrorMessage(error: unknown) {
  if (error instanceof GoogleLoginCancelledError) return null;
  if (error instanceof GoogleDriveError && error.status === 403) {
    return "A conta não autorizou o acesso aos backups do aplicativo.";
  }
  if (error instanceof TypeError) {
    return "Não foi possível acessar a internet. Verifique sua conexão.";
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

export function GoogleDriveBackupCard() {
  const router = useRouter();
  const styles = useStyles(createStyles);
  const theme = useTheme();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const { backups, status, listBackups, createBackup, restoreBackup, reset } = useBackupStore();
  const { isConfigured, isConnected, user, getAccessToken, disconnect } = useGoogleDriveLogin();

  const isBusy = status !== "idle";

  async function runAuthorized<T>(operation: (accessToken: string) => Promise<T>): Promise<T> {
    const accessToken = await getAccessToken();
    try {
      return await operation(accessToken);
    } catch (error) {
      if (!(error instanceof GoogleDriveError) || error.status !== 401) throw error;

      disconnect();
      const renewedToken = await getAccessToken(true);
      return await operation(renewedToken);
    }
  }

  function showError(error: unknown) {
    const message = getErrorMessage(error);
    if (message) Alert.alert("Erro", message);
  }

  async function handleCreateBackup() {
    try {
      const result = await runAuthorized(createBackup);
      Alert.alert(
        "Backup concluído",
        result.cleanupWarning
          ? "O backup foi criado, mas não foi possível remover todos os snapshots antigos."
          : "Seus dados comerciais foram salvos no Google Drive.",
      );
    } catch (error) {
      showError(error);
    }
  }

  async function handleOpenPicker() {
    try {
      setIsPickerVisible(true);
      await runAuthorized(listBackups);
    } catch (error) {
      setIsPickerVisible(false);
      showError(error);
    }
  }

  async function handleRefresh() {
    try {
      await runAuthorized(listBackups);
    } catch (error) {
      showError(error);
    }
  }

  function handleSelectBackup(backup: DriveBackupFile) {
    setIsPickerVisible(false);
    const date = new Date(backup.createdTime).toLocaleString("pt-BR");

    Alert.alert(
      "Substituir dados atuais?",
      `O backup de ${date} substituirá produtos, vendas, despesas e materiais deste aparelho. Essa ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            try {
              await runAuthorized((accessToken) => restoreBackup(accessToken, backup.id));
              Alert.alert("Backup restaurado", "Os dados comerciais foram restaurados.", [
                { text: "Continuar", onPress: () => router.replace("/") },
              ]);
            } catch (error) {
              showError(error);
            }
          },
        },
      ],
    );
  }

  async function handleSwitchAccount() {
    try {
      disconnect();
      reset();
      await getAccessToken(true);
      Alert.alert("Conta conectada", "A nova conta Google está pronta para usar.");
    } catch (error) {
      showError(error);
    }
  }

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <IconSymbol color={theme.colors.tint} name="icloud.and.arrow.up.fill" />
          </View>
          <View style={styles.headerContent}>
            <ThemedText style={styles.cardTitle}>Backup</ThemedText>
            <ThemedText style={styles.cardSubtitle}>Google Drive</ThemedText>
          </View>
          {isConnected ? (
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <ThemedText style={styles.connectedText}>Conectado</ThemedText>
            </View>
          ) : null}
        </View>

        {!isConfigured ? (
          <View style={styles.configurationWarning}>
            <ThemedText style={styles.warningTitle}>Google Drive não configurado</ThemedText>
            <ThemedText style={styles.description}>
              Adicione o client ID OAuth desta plataforma às variáveis de ambiente.
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.descriptionBlock}>
              <ThemedText style={styles.description}>
                Salve produtos, vendas, despesas e materiais. São mantidos até cinco snapshots, sem
                imagens ou configurações da impressora.
              </ThemedText>
              {user ? (
                <ThemedText style={styles.accountText} numberOfLines={1}>
                  {user.email || user.name}
                </ThemedText>
              ) : (
                <ThemedText style={styles.accountText}>
                  A conta Google será solicitada ao continuar.
                </ThemedText>
              )}
            </View>

            {status === "restoring" ? (
              <View style={styles.operationStatus}>
                <ActivityIndicator size="small" color={theme.colors.tint} />
                <ThemedText style={styles.operationStatusText}>
                  Baixando e restaurando os dados...
                </ThemedText>
              </View>
            ) : null}

            <Button
              label={status === "creating" ? "Criando backup..." : "Fazer backup agora"}
              onPress={handleCreateBackup}
              loading={status === "creating"}
              disabled={isBusy}
              size="md"
            />
            <Button
              label={status === "listing" ? "Buscando backups..." : "Procurar backup"}
              onPress={handleOpenPicker}
              loading={status === "listing" && !isPickerVisible}
              disabled={isBusy}
              variant="secondary"
              size="md"
            />

            {isConnected ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleSwitchAccount}
                disabled={isBusy}
                style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}
              >
                <ThemedText style={styles.switchButtonText}>Trocar conta Google</ThemedText>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      <BackupPickerModal
        visible={isPickerVisible}
        backups={backups}
        isLoading={status === "listing" || status === "restoring"}
        onRefresh={handleRefresh}
        onSelect={handleSelectBackup}
        onClose={() => !isBusy && setIsPickerVisible(false)}
      />
    </>
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
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconContainer: {
      padding: 8,
      borderRadius: 10,
      backgroundColor: colors.tintSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    headerContent: { flex: 1, gap: 2 },
    cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, fontFamily: fonts.rounded },
    cardSubtitle: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.sans },
    connectedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: colors.surface,
    },
    connectedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
    connectedText: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.sans },
    descriptionBlock: { gap: 8 },
    description: { fontSize: 13, lineHeight: 19, color: colors.textMuted, fontFamily: fonts.sans },
    accountText: { fontSize: 12, color: colors.tint, fontFamily: fonts.sans },
    configurationWarning: {
      gap: 6,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    warningTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: fonts.rounded,
    },
    operationStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      padding: 10,
      borderRadius: 12,
      backgroundColor: colors.tintSoft,
    },
    operationStatusText: { flex: 1, fontSize: 12, color: colors.text, fontFamily: fonts.sans },
    switchButton: { alignItems: "center", paddingVertical: 6 },
    switchButtonText: {
      fontSize: 13,
      color: colors.tint,
      fontFamily: fonts.sans,
      fontWeight: "600",
    },
    pressed: { opacity: 0.72 },
  });


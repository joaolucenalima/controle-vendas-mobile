import { useEffect, useState } from "react";
import { Alert, DevSettings, StyleSheet, TextInput, View } from "react-native";

import { resetDatabase } from "@/database/reset-database";
import { usePrinterStore } from "@/features/printer/printer-store";
import { Button, IconSymbol, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";

export default function SettingsScreen() {
  const styles = useStyles(createStyles);
  const theme = useTheme();

  const [isResetting, setIsResetting] = useState(false);
  const [printerMacAddress, setPrinterMacAddress] = useState("");
  const [isLoadingPrinter, setIsLoadingPrinter] = useState(true);
  const [isSavingPrinter, setIsSavingPrinter] = useState(false);

  const { loadMacAddress, saveMacAddress } = usePrinterStore();

  useEffect(() => {
    let isMounted = true;

    async function loadPrinterSettings() {
      try {
        const macAddress = await loadMacAddress();
        if (isMounted) {
          setPrinterMacAddress(macAddress ?? "");
        }
      } catch (error: unknown) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Falha ao carregar a impressora";
          Alert.alert("Erro", message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPrinter(false);
        }
      }
    }

    loadPrinterSettings();

    return () => {
      isMounted = false;
    };
  }, [loadMacAddress]);

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

  async function handleSavePrinter() {
    try {
      setIsSavingPrinter(true);
      const savedMacAddress = await saveMacAddress(printerMacAddress);
      setPrinterMacAddress(savedMacAddress ?? "");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao salvar a impressora";
      Alert.alert("Erro", message);
    } finally {
      setIsSavingPrinter(false);
    }
  }

  return (
    <StackFormWrapper title="Configurações">
      {__DEV__ ? (
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
      ) : null}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <IconSymbol color={theme.colors.text} name="printer" />
          </View>
          <ThemedText style={styles.cardTitle}>Impressora Térmica</ThemedText>
        </View>

        <ThemedText style={styles.cardDescription}>
          Adicione o endereço MAC da sua impressora para imprimir recibos diretamente do app.
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Endereço MAC</ThemedText>
          <TextInput
            value={printerMacAddress}
            onChangeText={setPrinterMacAddress}
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isLoadingPrinter && !isSavingPrinter}
            style={styles.input}
          />
        </View>

        <Button
          label="Salvar impressora"
          onPress={handleSavePrinter}
          loading={isSavingPrinter}
          disabled={isLoadingPrinter || isSavingPrinter}
          size="md"
          style={styles.saveButton}
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
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconContainer: {
      padding: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
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
    helperText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: fonts.sans,
    },
    dangerButton: {
      marginTop: 4,
    },
    saveButton: {
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

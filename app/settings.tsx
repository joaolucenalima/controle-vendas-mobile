import { useEffect, useState } from "react";
import { Alert, DevSettings, Pressable, StyleSheet, TextInput, View } from "react-native";

import { resetDatabase } from "@/database/reset-database";
import { usePrinterStore } from "@/features/printer/printer-store";
import { ConnectToPrinterView } from "@/features/settings/components/connect-to-printer";
import { Button, IconSymbol, ThemedText } from "@/shared/components";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { StackFormWrapper } from "@/shared/layouts/stack-form-wrapper";

export default function SettingsScreen() {
  const styles = useStyles(createStyles);
  const theme = useTheme();

  const [printerMacAddress, setPrinterMacAddress] = useState("");
  const [printerReceiptTitle, setPrinterReceiptTitle] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isSavingPrinter, setIsSavingPrinter] = useState(false);
  const [isBluetoothModalVisible, setIsBluetoothModalVisible] = useState(false);

  const { loadPrinterSettings, saveMacAddress, saveReceiptTitle } = usePrinterStore();

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const { macAddress, receiptTitle } = await loadPrinterSettings();
        if (isMounted) {
          setPrinterMacAddress(macAddress ?? "");
          setPrinterReceiptTitle(receiptTitle ?? "");
        }
      } catch (error: unknown) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Falha ao carregar a impressora";
          Alert.alert("Erro", message);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [loadPrinterSettings]);

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

      if (printerMacAddress.length > 0) {
        const savedMacAddress = await saveMacAddress(printerMacAddress);
        setPrinterMacAddress(savedMacAddress ?? "");
      }

      if (printerReceiptTitle.length > 0) {
        const savedReceiptTitle = await saveReceiptTitle(printerReceiptTitle);
        setPrinterReceiptTitle(savedReceiptTitle ?? "");
      }

      Alert.alert("Sucesso", "Configurações salvas com sucesso.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Falha ao salvar a configurações da impressora";
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
          <ThemedText style={styles.sectionDescription}>
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

        <View style={styles.section}>
          <View style={styles.section}>
            <ThemedText style={styles.label}>Endereço MAC</ThemedText>

            <ThemedText style={styles.sectionDescription}>
              Adicione o endereço MAC da sua impressora.
            </ThemedText>

            <TextInput
              value={printerMacAddress}
              onChangeText={setPrinterMacAddress}
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isSavingPrinter}
              style={styles.input}
            />

            <ThemedText style={styles.sectionDescription}>
              Ou obtenha o MAC se conectando à impressora.
            </ThemedText>

            <Pressable
              style={({ pressed }) => [styles.bluetoothButton, pressed && { opacity: 0.7 }]}
              disabled={isSavingPrinter}
              onPress={() => setIsBluetoothModalVisible(true)}
            >
              <ThemedText style={styles.bluetoothButtonLabel}>Selecionar via Bluetooth</ThemedText>
            </Pressable>
          </View>

          <ThemedText style={styles.label}>Título do recibo</ThemedText>

          <ThemedText style={styles.sectionDescription}>
            Digite um título personalizado para os recibos. Este título aparecerá no topo de cada
            recibo impresso.
          </ThemedText>

          <TextInput
            value={printerReceiptTitle}
            onChangeText={setPrinterReceiptTitle}
            placeholderTextColor={theme.colors.textMuted}
            autoCorrect={false}
            editable={!isSavingPrinter}
            style={styles.input}
          />
        </View>

        <Button
          label="Salvar configurações"
          onPress={handleSavePrinter}
          loading={isSavingPrinter}
          disabled={isSavingPrinter}
          size="md"
          style={styles.saveButton}
        />
      </View>

      <ConnectToPrinterView
        visible={isBluetoothModalVisible}
        onClose={() => setIsBluetoothModalVisible(false)}
        selectDevice={(macAddress: string) => {
          setPrinterMacAddress(macAddress);
          setIsBluetoothModalVisible(false);
        }}
      />
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
      fontWeight: "700",
      color: colors.text,
    },
    sectionDescription: {
      fontSize: 12,
      fontFamily: fonts.sans,
      color: colors.textMuted,
    },
    section: {
      gap: 4,
    },
    label: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: fonts.sans,
      fontWeight: "700",
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
    bluetoothButton: {
      backgroundColor: "#0082FC",
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    bluetoothButtonLabel: {
      color: "white",
      fontFamily: fonts.rounded,
      fontWeight: "600",
      fontSize: 14,
    },
    unavailableCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      gap: 12,
      alignItems: "flex-start",
      marginTop: 4,
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

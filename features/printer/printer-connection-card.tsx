import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import { Button, IconSymbol, ThemedText } from "@/shared/components";
import { useTheme } from "@/shared/hooks/use-theme";
import { usePrinterStore } from "./printer-store";
import type { ConnectionStatus } from "./printer-bluetooth";

const labels: Record<ConnectionStatus, string> = {
  unknown: "Verificando conexão…", unconfigured: "Impressora não configurada",
  unavailable: "Impressão Bluetooth indisponível", permissionDenied: "Permissão Bluetooth necessária",
  bluetoothOff: "Bluetooth desligado", disconnected: "Impressora desconectada",
  connecting: "Conectando à impressora…", connected: "Impressora conectada",
  disconnecting: "Desconectando…", error: "Não foi possível confirmar a conexão",
};

export function PrinterConnectionCard({ settings = false, disabled = false }: { settings?: boolean; disabled?: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { connectionStatus, connectedPrinter, macAddress, connectionError, isBusy, connect, disconnect, refreshConnection } = usePrinterStore();
  useFocusEffect(useCallback(() => { void refreshConnection(); }, [refreshConnection]));
  const working = ["unknown", "connecting", "disconnecting"].includes(connectionStatus);
  const color = connectionStatus === "connected" ? colors.green : connectionStatus === "error" ? colors.red : colors.textMuted;
  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.row} accessibilityLiveRegion="polite">
        {working ? <ActivityIndicator color={color} /> : <IconSymbol name="printer" size={20} color={color} />}
        <ThemedText style={[styles.label, { color }]}>{labels[connectionStatus]}</ThemedText>
      </View>
      {macAddress ? <ThemedText style={styles.detail}>{connectedPrinter?.name ? `${connectedPrinter.name} · ` : ""}{macAddress}</ThemedText> : null}
      {connectionError ? <ThemedText style={styles.detail}>{connectionError}</ThemedText> : null}
      {connectionStatus === "unconfigured" ? (
        settings ? <ThemedText style={styles.detail}>Selecione uma impressora e salve as configurações para conectar.</ThemedText>
          : <Button label="Configurar impressora" onPress={() => router.push("/settings")} size="md" />
      ) : connectionStatus === "unavailable" ? null : (
        <>
          <Button
            label={connectionStatus === "connected" ? "Desconectar" : connectionStatus === "error" ? "Tentar novamente" : "Conectar"}
            onPress={() => { void (connectionStatus === "connected" ? disconnect() : connect()); }}
            disabled={isBusy || working || disabled}
            variant="secondary" size="md"
          />
          {["permissionDenied", "bluetoothOff"].includes(connectionStatus) ? (
            <Button label="Abrir ajustes do sistema" onPress={() => { void Linking.openSettings(); }} variant="secondary" size="md" />
          ) : null}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 12, gap: 10, borderWidth: 1, borderRadius: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  detail: { fontSize: 13, lineHeight: 20 },
});

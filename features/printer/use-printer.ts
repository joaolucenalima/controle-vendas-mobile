import { useState } from "react";
import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";
import BluetoothClassic from "react-native-bluetooth-classic";
import { usePrinterStore } from "./printer-store";

type PrintStatus = "idle" | "connecting" | "printing" | "success" | "error";

export function usePrinter() {
  const [status, setStatus] = useState<PrintStatus>("idle");
  const { loadMacAddress } = usePrinterStore();

  async function requestPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;

    const apiLevel = Platform.Version as number;

    if (apiLevel >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        result["android.permission.BLUETOOTH_SCAN"] === "granted" &&
        result["android.permission.BLUETOOTH_CONNECT"] === "granted"
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return result === "granted";
    }
  }

  async function print(payload: string) {
    setStatus("connecting");

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setStatus("error");
      Alert.alert(
        "Permissão negada",
        "Autorize o acesso ao Bluetooth nas configurações do sistema.",
        [{ text: "Abrir configurações", onPress: () => Linking.openSettings() }],
      );
      return;
    }

    const macAddress = await loadMacAddress();
    if (!macAddress) {
      setStatus("error");
      Alert.alert("Impressora não configurada", "Configure a impressora antes de imprimir.");
      return;
    }

    let device = null;
    try {
      const normalizedMac = macAddress.replace(/-/g, ":").toUpperCase();
      device = await BluetoothClassic.connectToDevice(normalizedMac);

      setStatus("printing");
      await device.write(payload);
      await new Promise((res) => setTimeout(res, 500));

      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Erro ao imprimir:", error);
      setStatus("error");
      Alert.alert("Erro ao imprimir", "Verifique se a impressora está ligada e próxima.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Tentar novamente", onPress: () => print(payload) },
      ]);
      setTimeout(() => setStatus("idle"), 2000);
    } finally {
      if (device) {
        try {
          await device.disconnect();
        } catch (error) {
          console.warn("Erro ao desconectar da impressora:", error);
        }
      }
    }
  }

  return { print, status };
}

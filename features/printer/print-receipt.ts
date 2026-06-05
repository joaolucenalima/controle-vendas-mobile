import { PermissionsAndroid, Platform } from "react-native";
import ThermalPrinterModule from "react-native-thermal-printer";

async function requestBluetoothPermissions() {
  if (Platform.OS !== "android") return;

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
export async function printReceipt(macAddress: string) {
  await requestBluetoothPermissions();
  console.log("Solicitando impressão para o endereço MAC:", macAddress);

  try {
    await ThermalPrinterModule.printBluetooth({
      macAddress,
      payload: `
[C]<b>MINHA LOJA</b>
[C]--------------------------------
[L]Produto A[R]R$ 10,00
[L]Produto B[R]R$ 20,00
[C]--------------------------------
[C]TOTAL: R$ 30,00
[C]Obrigado!
      `,
      printerWidthMM: 58,
      autoCut: true,
    });
    console.log("Impresso com sucesso!");
  } catch (err) {
    console.error("Erro ao imprimir:", err);
  }
}

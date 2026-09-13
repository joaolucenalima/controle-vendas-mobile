import { NativeModules, PermissionsAndroid, Platform } from "react-native";
import type { BluetoothDevice, BluetoothEventSubscription } from "react-native-bluetooth-classic";

export type ConnectionStatus = "unknown" | "unconfigured" | "unavailable" | "permissionDenied" | "bluetoothOff" | "disconnected" | "connecting" | "connected" | "disconnecting" | "error";
export class PrinterConnectionError extends Error {
  constructor(public status: ConnectionStatus, message: string) { super(message); }
}
function native() {
  if (!NativeModules.RNBluetoothClassic || !["android", "ios"].includes(Platform.OS)) {
    throw new PrinterConnectionError("unavailable", "Impressão Bluetooth indisponível nesta versão do aplicativo.");
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Check availability before evaluating the native package.
  return (require("react-native-bluetooth-classic") as typeof import("react-native-bluetooth-classic")).default;
}
async function ready(interactive = false, discovery = false) {
  const bluetooth = native();
  if (!(await bluetooth.isBluetoothAvailable())) throw new PrinterConnectionError("unavailable", "Bluetooth indisponível neste aparelho.");
  if (Platform.OS === "android") {
    const permissions = Number(Platform.Version) >= 31
      ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, ...(discovery ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] : [])]
      : discovery ? [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] : [];
    for (const permission of permissions) {
      if (!(await PermissionsAndroid.check(permission)) && (!interactive || await PermissionsAndroid.request(permission) !== PermissionsAndroid.RESULTS.GRANTED)) {
        throw new PrinterConnectionError("permissionDenied", "Autorize o acesso ao Bluetooth nos ajustes do sistema.");
      }
    }
  }
  if (!(await bluetooth.isBluetoothEnabled())) {
    if (!interactive || Platform.OS !== "android" || !(await bluetooth.requestBluetoothEnabled())) {
      throw new PrinterConnectionError("bluetoothOff", "Ative o Bluetooth nos ajustes do sistema.");
    }
  }
  return bluetooth;
}
export const PrinterBluetooth = {
  ready,
  async connected(address: string): Promise<BluetoothDevice | null> {
    const bluetooth = await ready();
    if (!(await bluetooth.isDeviceConnected(address))) return null;
    return (await bluetooth.getConnectedDevices()).find(device => device.address === address) ?? null;
  },
  async connect(address: string) {
    const bluetooth = await ready(true);
    const device = await bluetooth.connectToDevice(address);
    if (!(await device.isConnected())) throw new Error("Não foi possível confirmar a conexão com a impressora.");
    return device;
  },
  async disconnect(address: string) {
    if (!NativeModules.RNBluetoothClassic) return;
    const bluetooth = native();
    if (!(await bluetooth.isBluetoothEnabled())) return;
    if (await bluetooth.isDeviceConnected(address)) {
      await bluetooth.disconnectFromDevice(address);
      if (await bluetooth.isDeviceConnected(address)) throw new Error("Não foi possível desconectar a impressora.");
    }
  },
  subscribe(onDevice: (address: string, connected: boolean) => void, onState: (enabled: boolean) => void) {
    const bluetooth = native();
    const subscriptions: BluetoothEventSubscription[] = [];
    try {
      subscriptions.push(bluetooth.onDeviceConnected(event => onDevice(event.device.address, true)));
      subscriptions.push(bluetooth.onDeviceDisconnected(event => onDevice(event.device.address, false)));
      subscriptions.push(bluetooth.onBluetoothEnabled(() => onState(true)));
      subscriptions.push(bluetooth.onBluetoothDisabled(() => onState(false)));
    } catch (error) {
      subscriptions.forEach(subscription => subscription.remove());
      throw error;
    }
    return () => subscriptions.forEach(subscription => subscription.remove());
  },
  async discover(isCancelled: () => boolean = () => false) {
    const bluetooth = await ready(true, true);
    if (isCancelled()) return [];
    return Platform.OS === "android" ? bluetooth.startDiscovery() : bluetooth.getBondedDevices();
  },
  async cancelDiscovery() {
    if (Platform.OS === "android" && NativeModules.RNBluetoothClassic) await native().cancelDiscovery();
  },
};

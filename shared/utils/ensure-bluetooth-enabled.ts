import BluetoothClassic from "react-native-bluetooth-classic";

export async function ensureBluetoothEnabled(): Promise<boolean> {
  try {
    const isEnabled = await BluetoothClassic.isBluetoothEnabled();

    if (!isEnabled) {
      const enabled = await BluetoothClassic.requestBluetoothEnabled();
      return enabled;
    }

    return true;
  } catch (error) {
    return false;
  }
}

import { IconSymbol, ThemedText } from "@/shared/components";
import { StylesProps, useStyles } from "@/shared/hooks/use-styles";
import { useTheme } from "@/shared/hooks/use-theme";
import { ensureBluetoothEnabled } from "@/shared/utils/ensure-bluetooth-enabled";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import BluetoothClassic, { BluetoothDevice } from "react-native-bluetooth-classic";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ConnectToPrinterViewProps {
  visible: boolean;
  onClose: () => void;
  selectDevice: (macAddress: string) => void;
}

export function ConnectToPrinterView({
  visible,
  onClose,
  selectDevice,
}: ConnectToPrinterViewProps) {
  const theme = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();

  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  async function getAvailableDevices() {
    setIsLoadingDevices(true);

    try {
      const availableDevices = await BluetoothClassic.startDiscovery();
      setDevices(availableDevices);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Falha ao obter dispositivos Bluetooth";
      Alert.alert("Erro", message);
    } finally {
      setIsLoadingDevices(false);
    }
  }

  useEffect(() => {
    if (!visible) return;

    ensureBluetoothEnabled().then((isBluetoothEnabled) => {
      while (!isBluetoothEnabled) {
        Alert.alert("Bluetooth desativado", "Ative o Bluetooth para conectar a impressora.", [
          { text: "Ligar", onPress: () => ensureBluetoothEnabled() },
          { text: "Cancelar", style: "cancel", onPress: onClose },
        ]);
      }

      getAvailableDevices();
    });
  }, [visible, onClose]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;

    if (isLoadingDevices) {
      rotateAnim.setValue(0);

      animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      );

      animation.start();
    } else {
      rotateAnim.stopAnimation();
    }

    return () => {
      animation?.stop();
    };
  }, [isLoadingDevices, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <ThemedText style={styles.title}>Dispositivos disponíveis</ThemedText>

              <Pressable
                onPress={getAvailableDevices}
                accessibilityRole="button"
                disabled={isLoadingDevices}
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.refreshButtonPressed,
                ]}
              >
                <Animated.View
                  style={{
                    transform: [{ rotate: spin }],
                  }}
                >
                  <IconSymbol
                    name="arrow.triangle.2.circlepath"
                    size={24}
                    color={theme.colors.text}
                  />
                </Animated.View>
              </Pressable>
            </View>

            {isLoadingDevices && (
              <ThemedText style={[styles.description, { textAlign: "center" }]}>
                Buscando dispositivos...
              </ThemedText>
            )}

            {devices.length > 0 && (
              <ThemedText style={styles.description}>
                Clique no dispositivo para salvar suas informações de conexão.
              </ThemedText>
            )}

            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.deviceItem}
                  onPress={() => selectDevice(item.address)}
                  accessibilityRole="button"
                >
                  <View>
                    <ThemedText style={styles.deviceName}>{item.name}</ThemedText>
                    <ThemedText style={styles.deviceAddress}>{item.address}</ThemedText>
                  </View>

                  {item.bonded && <ThemedText style={styles.bonded}>Pareado</ThemedText>}
                </Pressable>
              )}
              ListEmptyComponent={() => (
                <ThemedText style={styles.description}>Nenhum dispositivo encontrado.</ThemedText>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    keyboardAvoidingView: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: "82%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 10,
      gap: 8,
    },
    handle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.border,
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    title: {
      fontSize: 20,
      fontFamily: fonts.rounded,
      fontWeight: "700",
      color: colors.text,
    },
    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },

    refreshButtonPressed: {
      opacity: 0.6,
      transform: [{ scale: 0.92 }],
    },
    description: {
      fontSize: 14,
      fontFamily: fonts.sans,
      color: colors.textMuted,
    },
    deviceItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    deviceName: {
      fontSize: 16,
      fontFamily: fonts.rounded,
      fontWeight: "600",
    },
    deviceAddress: {
      fontSize: 12,
      fontFamily: fonts.sans,
      color: colors.textMuted,
    },
    bonded: {
      fontSize: 14,
      fontFamily: fonts.sans,
      color: colors.tint,
      fontWeight: "700",
    },
  });

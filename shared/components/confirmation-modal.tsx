import { Modal, Pressable, StyleSheet, View } from "react-native";

import ThemedText from "@/shared/components/themed-text";
import { useStyles, type StylesProps } from "@/shared/hooks/use-styles";

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "default" | "danger";
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmTone = "default",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const styles = useStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel} accessibilityRole="button" />

      <View style={styles.container}>
        <View style={styles.card}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              disabled={isConfirming}
              style={({ pressed }) => [
                styles.secondaryButton,
                (pressed || isConfirming) && styles.secondaryButtonPressed,
              ]}
            >
              <ThemedText style={styles.secondaryButtonText}>{cancelLabel}</ThemedText>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              disabled={isConfirming}
              style={({ pressed }) => [
                styles.primaryButton,
                confirmTone === "danger" && styles.dangerButton,
                (pressed || isConfirming) && styles.primaryButtonPressed,
              ]}
            >
              <ThemedText
                style={[
                  styles.primaryButtonText,
                  confirmTone === "danger" && styles.dangerButtonText,
                ]}
              >
                {isConfirming ? "Confirmando..." : confirmLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = ({ colors, fonts }: StylesProps) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },
    card: {
      borderRadius: 22,
      backgroundColor: colors.background,
      padding: 20,
      gap: 12,
    },
    title: {
      color: colors.text,
      fontFamily: fonts.rounded,
      fontSize: 18,
      fontWeight: "700",
    },
    message: {
      color: colors.textMuted,
      fontFamily: fonts.sans,
      fontSize: 14,
      lineHeight: 20,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 6,
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonPressed: {
      opacity: 0.86,
    },
    secondaryButtonText: {
      color: colors.text,
      fontFamily: fonts.rounded,
      fontSize: 15,
      fontWeight: "600",
    },
    primaryButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: colors.tint,
    },
    dangerButton: {
      backgroundColor: colors.red,
    },
    primaryButtonPressed: {
      opacity: 0.86,
    },
    primaryButtonText: {
      color: colors.background,
      fontFamily: fonts.rounded,
      fontSize: 15,
      fontWeight: "600",
    },
    dangerButtonText: {
      color: colors.background,
    },
  });

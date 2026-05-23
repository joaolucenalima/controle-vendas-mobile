import { useTheme } from "@/shared/hooks/use-theme";
import { Pressable, StyleSheet } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";

export function DeleteButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Excluir"
      hitSlop={12}
      style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
    >
      <IconSymbol name="trash" size={22} color={theme.colors.red} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    borderRadius: 999,
    padding: 8,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
});


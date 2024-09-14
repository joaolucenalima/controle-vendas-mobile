import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button, StyleSheet, View } from "react-native";

export default function TransactionsScreen() {
  return (
    <ThemedView style={styles.page}>
      <View style={styles.header}>
        <ThemedText type="title">Transações</ThemedText>
        <Button title="Nova"></Button>
      </View>

      <View>
        <ThemedText>Em breve...</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    padding: 16,
    flex: 1,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }
});
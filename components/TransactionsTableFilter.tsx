import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";

export function TransactionTableFilter() {
  const [typeFilter, setTypeFilter] = useState<"all" | "sale" | "shopping">("all");

  function changeTypeFilter(type: "all" | "sale" | "shopping") {
    setTypeFilter(prev => prev === type ? "all" : type);
  }

  const styles = StyleSheet.create({
    filterButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    saleSelected: {
      backgroundColor: 'rgba(34, 197, 94, 0.5)',
    },
    shoppingSelected: {
      backgroundColor: 'rgba(248, 113, 113, 0.5)'
    },
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <ThemedText type="defaultSemiBold" style={{ marginRight: 10 }}>Filtros:</ThemedText>
      <ThemedText
        onPress={() => changeTypeFilter('sale')}
        style={[styles.filterButton, typeFilter === 'sale' && styles.saleSelected]}
      >
        Vendas
      </ThemedText>
      <ThemedText
        onPress={() => changeTypeFilter('shopping')}
        style={[styles.filterButton, typeFilter === 'shopping' && styles.shoppingSelected]}
      >
        Compras
      </ThemedText>
    </View>
  );
}
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { TransactionTableFilter } from "@/components/TransactionsTableFilter";
import { Colors } from "@/constants/Colors";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    page: {
      paddingTop: 60,
      padding: 16,
      flex: 1,
      gap: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    newButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      padding: 8,
      width: 90,
      borderRadius: 10,
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
      borderBottomWidth: 1,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomColor: Colors[colorScheme ?? 'light'].border,
      borderBottomWidth: 1
    }
  });

  return (
    <ThemedView style={styles.page}>
      <View style={styles.header}>
        <ThemedText type="title">Transações</ThemedText>

        <Pressable style={styles.newButton}>
          <MaterialIcons name="add" size={24} color={"#ECEDEE"} />
          <Text style={{ color: "#ECEDEE" }}>
            Nova
          </Text>
        </Pressable>
      </View>

      <TransactionTableFilter />

      <View style={{ flex: 1 }}>
        <View style={styles.tableHeader}>
          <ThemedText type="defaultSemiBold" style={{ width: 100 }}>Data</ThemedText>
          <ThemedText type="defaultSemiBold" style={{ width: 80 }}>Tipo</ThemedText>
          <ThemedText type="defaultSemiBold" style={{ width: 120 }}>N° produtos</ThemedText>
          <ThemedText type="defaultSemiBold" style={{ width: 90 }}>Valor</ThemedText>
        </View>

        <FlatList
          data={[...Array(20)]}
          renderItem={({ item, index }) => (
            <View style={styles.tableRow} key={index}>
              <ThemedText style={{ width: 100, fontSize: 14 }}>14/09/2024</ThemedText>
              <ThemedText style={{ width: 80, fontSize: 14 }}>{Math.random() > 0.5 ? 'Compra' : 'Venda'}</ThemedText>
              <ThemedText style={{ width: 120, fontSize: 14 }}>{120 + index}</ThemedText>
              <ThemedText style={{ width: 90, fontSize: 14 }}>R$1300</ThemedText>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={true}
        />
      </View>
    </ThemedView>
  );
}
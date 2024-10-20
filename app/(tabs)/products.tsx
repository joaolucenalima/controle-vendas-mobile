import { ThemedMainButton } from "@/components/ThemedMainButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { FlatList, StyleSheet, useColorScheme, View } from "react-native";

export default function ProductsScreen() {
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
    productContainer: {
      width: '47%',
      aspectRatio: 0.95,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
    },
    productSubtitle: {
      fontSize: 14,
      textAlign: 'center',
      margin: 8,
      lineHeight: 16,
    }
  });

  return (
    <ThemedView style={styles.page}>
      <View style={styles.header}>
        <ThemedText type="title">Produtos</ThemedText>

        <ThemedMainButton text="Novo" icon="add" onPress={() => { }} />
      </View>

      <FlatList
        data={[...Array(6)]}
        renderItem={({ item, index }) => (
          <View style={styles.productContainer} key={index}>
            <View style={{ flex: 1, borderColor: 'gray', borderWidth: 1, width: '100%' }}></View>
            <ThemedText style={styles.productSubtitle}>Arandela redonda com pe lala</ThemedText>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={true}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ gap: 20 }}
      />
    </ThemedView>
  );
}
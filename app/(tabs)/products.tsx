import { ThemedMainButton } from "@/components/ThemedMainButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
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
      width: '48%',
      aspectRatio: 0.95,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].border,
      flexDirection: 'column',
      overflow: 'hidden',
    },
    productSubtitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 8,
    },
    productName: {
      fontSize: 12,
      lineHeight: 16,
      flexBasis: '65%',
    },
    productPrice: {
      fontSize: 12,
      fontWeight: 'bold',
      color: 'rgba(34, 197, 94, 0.75)',
      flexBasis: '35%',
    }
  });

  return (
    <ThemedView style={styles.page}>
      <View style={styles.header}>
        <ThemedText type="title">Produtos</ThemedText>

        <ThemedMainButton
          text="Novo"
          icon="add"
          onPress={() => router.push(`/product-form?action=edit`)}
        />
      </View>

      <FlatList
        data={[...Array(6)]}
        renderItem={({ item, index }) => (
          <View style={styles.productContainer} key={index}>
            <View style={{ flex: 1, borderColor: 'gray', borderWidth: 1, width: '100%' }}></View>
            <View style={styles.productSubtitle}>
              <ThemedText style={styles.productName}>Arandela redonda com pe lala</ThemedText>
              <ThemedText style={styles.productPrice}>R$ 12,00</ThemedText>
            </View>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={true}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ gap: 15 }}
      />
    </ThemedView>
  );
}
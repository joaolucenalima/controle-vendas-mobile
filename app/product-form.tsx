import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, StyleSheet, View, Platform, ScrollView, useColorScheme } from "react-native";

import MaskedNumberInput from "@/components/MaskedNumberInput";
import ThemedInput from "@/components/ThemedInput";
import { ThemedMainButton } from "@/components/ThemedMainButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";

export default function ProductForm() {
  const colorScheme = useColorScheme() ?? 'light';
  const { action } = useLocalSearchParams<{ action: string }>();
  const [formData, setFormData] = useState<{ name: string, price: number }>();

  useEffect(() => {
    if (action === 'edit') {
      // fetch product
    }
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: action === 'edit' ? 'Editar produto' : 'Novo produto' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemedView style={styles.container}>
            <View style={styles.formField}>
              <ThemedText type="subtitle">Imagem</ThemedText>
              <View style={[styles.imageUploadContainer, { borderColor: Colors[colorScheme].icon }]}>
                <MaterialIcons name="add-a-photo" size={40} color={Colors[colorScheme].icon} />
                <ThemedText style={{ color: Colors[colorScheme].icon }}>Fazer upload</ThemedText>
              </View>
            </View>

            <View style={styles.formField}>
              <ThemedText type="subtitle">Nome</ThemedText>
              <ThemedInput defaultValue={formData?.name} />
            </View>

            <View style={styles.formField}>
              <ThemedText type="subtitle">Preço</ThemedText>
              <MaskedNumberInput defaultValue={String(formData?.price)} />
            </View>

            <View style={{ alignSelf: 'flex-end', marginTop: 20 }}>
              <ThemedMainButton text="Salvar" fontSize={18} bold />
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    gap: 24,
    alignItems: 'center',
  },
  imageUploadContainer: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    width: '70%',
    aspectRatio: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  formField: {
    width: '100%',
    flexDirection: 'column',
    gap: 10,
  },
});
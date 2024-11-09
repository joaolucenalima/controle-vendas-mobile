import { useState } from "react";
import { NativeSyntheticEvent, TextInputChangeEventData, type TextInputProps } from "react-native";
import ThemedInput from "./ThemedInput";

export default function MaskedNumberInput(props: TextInputProps) {
  const [value, setValue] = useState<number>(Number(props.defaultValue) || 0);

  const handleChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const inputValue = e.nativeEvent.text.replace(/[^\d]/g, "");

    setValue(Number(inputValue) / 100);
  };

  return (
    <ThemedInput
      {...props}
      value={value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      onChange={handleChange}
      keyboardType="numeric"
    />
  );
}
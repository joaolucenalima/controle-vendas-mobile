import { Colors } from "@/constants/Colors";
import { type ComponentProps } from 'react';
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";
import { IconProps } from "@expo/vector-icons/build/createIconSet";

type ButtonProps = {
  onPress?: () => void;
  text: string;
  icon?: IconProps<ComponentProps<typeof MaterialIcons>['name']>['name'];
  fontSize?: number,
  bold?: boolean,
}

export function ThemedMainButton({ onPress, text, icon, fontSize, bold }: ButtonProps) {
  const colorScheme = useColorScheme()

  const buttonStyles = StyleSheet.create({
    newButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      padding: fontSize ? fontSize / 1.75 : 8,
      width: fontSize ? fontSize * 6.5 : 90,
      borderRadius: 10,
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
    },
  })

  return (
    <Pressable style={buttonStyles.newButton} onPress={onPress}>
      {icon && <MaterialIcons name={icon} size={24} color={"#ECEDEE"} />}
      <Text style={{ color: "#ECEDEE", fontSize, fontWeight: bold ? 600 : 400 }}>
        {text}
      </Text>
    </Pressable>
  )
}
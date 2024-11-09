import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export default function ThemedInput({ style, lightColor, darkColor, ...rest }: ThemedInputProps) {
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  const defaultStyles = StyleSheet.create({
    input: {
      width: '100%',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 5,
      color: textColor
    }
  })

  return <TextInput style={[defaultStyles.input, style]} {...rest} />
}
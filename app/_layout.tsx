import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#0891b2',
      background: '#151718',
      card: 'rgb(18, 18, 18)',
      text: '#ECEDEE',
      border: '#3d3d3d',
      notification: 'rgb(255, 69, 58)',
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#0891b2',
      background: '#fff',
      card: 'rgb(18, 18, 18)',
      text: '#11181C',
      border: '#d9d9d9',
      notification: 'rgb(255, 69, 58)',
    },
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
          headerTintColor: Colors[colorScheme ?? 'light'].text
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product-form" />
        {/* <Stack.Screen name="material-form" /> */}
      </Stack>
    </ThemeProvider>
  );
}

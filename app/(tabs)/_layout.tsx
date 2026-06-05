import { Tabs } from "expo-router";

import { HapticTab, IconSymbol } from "@/shared/components";
import { useTheme } from "@/shared/hooks/use-theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          width: "100%",
          height: 64 + insets.bottom,
          paddingHorizontal: 8,
          paddingTop: 4,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="circle.grid.2x2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Vendas",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="dollarsign" color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Produtos",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="shippingbox.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Despesas",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="wallet.pass.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: "Materiais",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="archivebox.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

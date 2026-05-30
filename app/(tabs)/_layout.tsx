import { Tabs } from "expo-router";

import { HapticTab, IconSymbol } from "@/shared/components";
import { useTheme } from "@/shared/hooks/use-theme";

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingTop: 10,
          height: 84,
          width: "96%",
          marginHorizontal: "auto",
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


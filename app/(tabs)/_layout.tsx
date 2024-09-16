import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: {
          borderRadius: 20,
          margin: 10,
          height: 55,
          shadowColor: 'transparent',
          backgroundColor: Colors[colorScheme ?? 'light'].secondary,
          borderWidth: 1,
          borderTopWidth: 1,
          borderColor: Colors[colorScheme ?? 'light'].border,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 5,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name={"dashboard"} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transações',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name={"swap-vert"} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name={'inventory'} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="materials"
        options={{
          title: 'Materiais',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name={'category'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

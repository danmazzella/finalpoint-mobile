import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.buttonPrimary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: Colors.light.backgroundPrimary,
          borderTopWidth: 1,
          borderTopColor: Colors.light.borderLight,
          height: Platform.OS === 'android' ? 70 + insets.bottom : 88,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: Platform.OS === 'android' ? 8 : 0,
          shadowColor: Colors.light.cardShadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
          shadowRadius: Platform.OS === 'ios' ? 4 : 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: 'Leagues',
          tabBarIcon: ({ color }) => <Ionicons name="trophy" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="picks"
        options={{
          title: 'Picks',
          tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '../../components/HapticTab';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { useTheme } from '../../src/context/ThemeContext';
import { lightColors, darkColors } from '../../src/constants/Colors';
import { useAuth } from '../../src/context/AuthContext';

export default function TabLayout() {
  const { resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Get current theme colors
  const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

  // Debug logging to see what's happening with user state
  console.log('🔍 TabLayout render:', { user: !!user, userType: typeof user, userValue: user });

  // Define tab screens - always show these three
  const tabScreens = useMemo(() => [
    {
      name: "index",
      options: {
        title: 'Home',
        tabBarIcon: ({ color }: { color: string }) => <Ionicons name="home" size={24} color={color} />,
      }
    },
    {
      name: "leagues",
      options: {
        title: 'Leagues',
        tabBarIcon: ({ color }: { color: string }) => <Ionicons name="trophy" size={24} color={color} />,
      }
    },
    {
      name: "picks",
      options: {
        title: 'Picks',
        tabBarIcon: ({ color }: { color: string }) => <Ionicons name="checkmark-circle" size={24} color={color} />,
      }
    },
    {
      name: "profile",
      options: {
        title: 'Profile',
        tabBarIcon: ({ color }: { color: string }) => <Ionicons name="person" size={24} color={color} />,
        // Hide the profile tab for unauthenticated users
        href: user ? undefined : null,
      }
    }
  ], [user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentColors.primary,
        tabBarInactiveTintColor: currentColors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            borderTopWidth: 2,
            borderColor: currentColors.textTertiary,
            height: 88,
            paddingBottom: 20,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: currentColors.backgroundTertiary,
          },
          android: {
            backgroundColor: currentColors.backgroundTertiary,
            borderTopWidth: 2,
            borderColor: currentColors.textTertiary,
            height: 70 + insets.bottom,
            paddingBottom: 8,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 20,
          },
          default: {
            backgroundColor: currentColors.backgroundTertiary,
            borderTopWidth: 2,
            borderColor: currentColors.textTertiary,
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
        }),
      }}>
      {tabScreens.map((screen) => (
        <Tabs.Screen key={screen.name} {...screen} />
      ))}
    </Tabs>
  );
}

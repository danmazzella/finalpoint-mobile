import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '../../components/HapticTab';
import { IconSymbol } from '../../components/ui/IconSymbol';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useAuth } from '../../src/context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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
        tabBarActiveTintColor: Colors.light.buttonPrimary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            borderTopWidth: 0,
            height: 88,
            paddingBottom: 20,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.light.backgroundSecondary, // Use white background for iOS
            shadowColor: Colors.light.cardShadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          android: {
            backgroundColor: Colors.light.backgroundSecondary, // White background for Android
            borderTopWidth: 1,
            borderTopColor: Colors.light.borderLight,
            height: 70 + insets.bottom,
            paddingBottom: 8,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 8,
          },
          default: {
            backgroundColor: Colors.light.backgroundSecondary,
            borderTopWidth: 1,
            borderTopColor: Colors.light.borderLight,
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

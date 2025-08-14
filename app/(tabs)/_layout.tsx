import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '../../components/HapticTab';
import { IconSymbol } from '../../components/ui/IconSymbol';
import TabBarBackground from '../../components/ui/TabBarBackground';
import TabletNavigation from '../../components/TabletNavigation';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useScreenSize } from '../../hooks/useScreenSize';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const screenSize = useScreenSize();

  // Show tablet navigation for tablets
  if (screenSize === 'tablet') {
    return (
      <View style={styles.tabletContainer}>
        <TabletNavigation />
        <View style={styles.tabletContent}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' }, // Hide tabs on tablet
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
        </View>
      </View>
    );
  }

  // Show mobile tabs for phones
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.buttonPrimary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
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
            backgroundColor: 'transparent',
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

const styles = StyleSheet.create({
  tabletContainer: {
    flex: 1,
  },
  tabletContent: {
    flex: 1,
  },
});

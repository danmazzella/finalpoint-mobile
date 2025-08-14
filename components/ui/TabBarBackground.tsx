import React from 'react';
import { View, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// This component provides a proper background for the tab bar
const TabBarBackground: React.FC = () => {
  const colorScheme = useColorScheme();

  // Use white background for iOS to match the tab bar style
  const backgroundColor = Platform.OS === 'ios'
    ? Colors.light.backgroundSecondary
    : 'transparent';

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor,
      }}
    />
  );
};

export default TabBarBackground;

export function useBottomTabOverflow() {
  return 0;
}

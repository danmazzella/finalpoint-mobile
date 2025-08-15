import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { useColorScheme } from '../hooks/useColorScheme';
import StatusBarBackground from './StatusBarBackground';

interface StatusBarWrapperProps {
    children: React.ReactNode;
    style?: 'light' | 'dark' | 'auto';
    backgroundColor?: string;
    showBackground?: boolean;
}

/**
 * StatusBarWrapper component that handles status bar configuration and provides the StatusBarBackground when needed.
 * 
 * This wrapper ensures consistent status bar behavior across the app and automatically
 * handles edge-to-edge displays on Android by providing a colored background.
 */
const StatusBarWrapper: React.FC<StatusBarWrapperProps> = ({
    children,
    style = 'light',
    backgroundColor,
    showBackground = true,
}) => {
    const colorScheme = useColorScheme();

    // Determine the status bar style based on theme and platform
    const statusBarStyle = Platform.OS === 'android'
        ? 'dark' // Always use dark text (black) on Android for better contrast with light background
        : (style === 'auto' ? (colorScheme === 'dark' ? 'light' : 'dark') : style);

    // Use provided background color or theme-based color
    const statusBarColor = backgroundColor || '#f8fafc'; // light gray-50 for better contrast

    // Don't show status bar background in Expo Go
    const shouldShowBackground = showBackground && Constants.appOwnership !== 'expo';

    return (
        <View style={styles.container}>
            <StatusBar
                style={statusBarStyle}
                translucent={true}
                backgroundColor={statusBarColor}
            />
            {shouldShowBackground && <StatusBarBackground color={statusBarColor} />}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default StatusBarWrapper;

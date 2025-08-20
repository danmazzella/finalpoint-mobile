import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';
import Constants from 'expo-constants';
import { useColorScheme } from '../hooks/useColorScheme';
import { useTheme } from '../src/context/ThemeContext';
import StatusBarBackground from './StatusBarBackground';
import { lightColors, darkColors } from '../src/constants/Colors';

interface StatusBarWrapperProps {
    children: React.ReactNode;
    style?: StatusBarStyle;
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
    const { resolvedTheme } = useTheme();

    // Determine the status bar style based on theme
    let statusBarStyle: 'light' | 'dark' | 'auto';

    if (resolvedTheme === 'dark') {
        // Dark theme: use light icons (white) for visibility against dark background
        statusBarStyle = 'light';
    } else {
        // Light theme: use dark icons (black) for visibility against light background
        statusBarStyle = 'dark';
    }

    // Use provided background color or theme-based color
    const statusBarColor = backgroundColor || (resolvedTheme === 'dark' ? darkColors.backgroundPrimary : lightColors.backgroundPrimary);

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

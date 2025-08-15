import React from 'react';
import { View, Platform } from 'react-native';
import Constants from 'expo-constants';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { useStatusBar } from '../hooks/useStatusBar';

interface StatusBarBackgroundProps {
    color?: string;
    height?: number;
}

/**
 * StatusBarBackground component for Android edge-to-edge displays
 * 
 * This component adds a colored background under the status bar area
 * when the app is running in edge-to-edge mode on Android. It helps
 * ensure status bar text remains visible against the app's background.
 * 
 * The component automatically detects edge-to-edge mode and only renders
 * when needed. It uses the FinalPoint blue color by default.
 */
const StatusBarBackground: React.FC<StatusBarBackgroundProps> = ({
    color,
    height
}) => {
    const colorScheme = useColorScheme();
    const { statusBarHeight, isEdgeToEdge } = useStatusBar();

    // Only show on Android (since iOS handles this differently)
    if (Platform.OS !== 'android') {
        return null;
    }

    // Don't show in Expo Go (may not work properly)
    if (Constants.appOwnership === 'expo') {
        return null;
    }



    // Use provided color, light blue background, or fallback to a neutral color
    const backgroundColor = color || '#f8fafc'; // light gray-50 background for better contrast

    // Use provided height or calculated status bar height
    const finalHeight = height || statusBarHeight;

    return (
        <View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: finalHeight,
                backgroundColor,
                zIndex: 1000,
            }}
        />
    );
};

export default StatusBarBackground;

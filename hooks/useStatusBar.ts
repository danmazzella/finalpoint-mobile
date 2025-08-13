import { useEffect, useState } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

interface UseStatusBarReturn {
    statusBarHeight: number;
    isEdgeToEdge: boolean;
    topInset: number;
}

/**
 * Custom hook for status bar information and edge-to-edge detection
 * 
 * Provides real-time information about the status bar height and whether
 * the app is running in edge-to-edge mode on Android.
 */
export const useStatusBar = (): UseStatusBarReturn => {
    const [statusBarHeight, setStatusBarHeight] = useState(0);
    const [isEdgeToEdge, setIsEdgeToEdge] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (Platform.OS === 'android') {
            // Get the actual status bar height
            const height = RNStatusBar.currentHeight || 0;
            setStatusBarHeight(height);

            // Since the app has edgeToEdgeEnabled: true, always treat Android as edge-to-edge
            // This ensures the status bar background is always shown
            // But disable in Expo Go since it may not work properly
            setIsEdgeToEdge(Constants.appOwnership !== 'expo');
        } else {
            // On iOS, use the safe area top inset
            setStatusBarHeight(insets.top);
            setIsEdgeToEdge(false);
        }
    }, [insets.top]);

    return {
        statusBarHeight,
        isEdgeToEdge,
        topInset: insets.top,
    };
};

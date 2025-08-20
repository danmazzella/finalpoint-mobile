import { useTheme } from '../context/ThemeContext';

// Universal theme color palettes for the entire mobile app
export const lightColors = {
    // Background colors
    backgroundPrimary: '#f9fafb',
    backgroundSecondary: '#ffffff',
    cardBackground: '#ffffff',
    backgroundTertiary: '#f3f4f6',

    // Text colors
    textPrimary: '#171717',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',

    // Border colors
    borderLight: '#e5e7eb',
    borderMedium: '#d1d5db',
    borderDark: '#9ca3af',

    // Accent colors
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    buttonPrimary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',

    // Status colors
    info: '#3b82f6',
    successLight: '#d1fae5',
    warningLight: '#fef3c7',
    errorLight: '#fee2e2',
};

export const darkColors = {
    backgroundPrimary: '#171717',
    backgroundSecondary: '#262626',
    cardBackground: '#262626',
    backgroundTertiary: '#1f1f1f',
    textPrimary: '#e5e5e5',
    textSecondary: '#a3a3a3',
    textTertiary: '#737373',
    textInverse: '#ffffff',
    borderLight: '#404040',
    borderMedium: '#525252',
    borderDark: '#737373',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    buttonPrimary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#dc2626',
    info: '#3b82f6',
    successLight: '#064e3b',
    warningLight: '#451a03',
    errorLight: '#450a0a',
};

// Re-export the hook from ThemeContext to avoid circular dependencies
export { useThemeColors } from '../context/ThemeContext';

// Legacy color constants for backward compatibility
export const Colors = {
    light: lightColors,
    dark: darkColors,
};

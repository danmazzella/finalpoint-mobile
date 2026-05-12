import { useTheme } from '../context/ThemeContext';

// Universal theme color palettes for the entire mobile app
export const lightColors = {
    // Background colors
    backgroundPrimary: '#f9fafb',
    backgroundSecondary: '#EEF4FF',
    cardBackground: '#F5F9FF',
    backgroundTertiary: '#E6EEFB',

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

    // Glass UI
    // (light mode glass tokens defined below dark section)

    // Secondary button (ghost blue)
    buttonSecondaryBg: 'rgba(59, 130, 246, 0.12)',
    buttonSecondaryBorder: 'rgba(37, 99, 235, 0.30)',
    buttonSecondaryText: '#2563eb',

    // Glass UI
    glassBackground: '#F5F9FF',
    glassBorder: 'rgba(59, 130, 246, 0.18)',
    glassShadowColor: '#3b82f6',
    pageBackground: '#dbeafe',
    modalBackground: '#ffffff',
    inputBackground: '#E6EEFB',
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

    // Glass UI
    glassBackground: 'rgba(26, 26, 26, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.07)',
    glassShadowColor: '#000000',
    pageBackground: '#0f0f0f',
    modalBackground: '#1e1e1e',
    inputBackground: 'rgba(0, 0, 0, 0.20)',

    // Secondary button (ghost blue)
    buttonSecondaryBg: 'rgba(59, 130, 246, 0.10)',
    buttonSecondaryBorder: 'rgba(37, 99, 235, 0.25)',
    buttonSecondaryText: '#60a5fa',
};

// Re-export the hook from ThemeContext to avoid circular dependencies
export { useThemeColors } from '../context/ThemeContext';

// Legacy color constants for backward compatibility
export const Colors = {
    light: lightColors,
    dark: darkColors,
};

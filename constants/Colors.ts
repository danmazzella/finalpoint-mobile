/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2563eb'; // blue-600
const tintColorDark = '#2563eb'; // blue-600

export default {
  light: {
    text: '#171717',
    background: '#ffffff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    // Primary colors - Blue theme (matching Tailwind)
    primary: '#2563eb', // blue-600
    primaryLight: '#dbeafe', // blue-100
    primaryDark: '#1d4ed8', // blue-700
    // Secondary colors
    secondary: '#2196f3',
    secondaryLight: '#bbdefb',
    secondaryDark: '#1976d2',
    // Success colors
    success: '#4caf50',
    successLight: '#c8e6c9',
    successDark: '#388e3c',
    // Error colors
    error: '#f44336',
    errorLight: '#ffcdd2',
    errorDark: '#d32f2f',
    // Warning colors
    warning: '#ff9800',
    warningLight: '#ffe0b2',
    warningDark: '#f57c00',
    // Info colors
    info: '#2196f3',
    infoLight: '#bbdefb',
    infoDark: '#1976d2',
    // Gray scale (matching Tailwind exactly)
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    // Background colors (matching web)
    backgroundPrimary: '#f9fafb', // gray-50
    backgroundSecondary: '#ffffff', // white
    backgroundTertiary: '#f3f4f6', // gray-100
    // Border colors (matching web)
    borderLight: '#e5e7eb', // gray-200
    borderMedium: '#d1d5db', // gray-300
    borderDark: '#9ca3af', // gray-400
    // Text colors (matching web)
    textPrimary: '#111827', // gray-900
    textSecondary: '#6b7280', // gray-500
    textTertiary: '#9ca3af', // gray-400
    textInverse: '#ffffff',
    // Card colors
    cardBackground: '#ffffff',
    cardBorder: '#e5e7eb', // gray-200
    cardShadow: '#000000',
    // Button colors (matching web)
    buttonPrimary: '#2563eb', // blue-600
    buttonPrimaryHover: '#1d4ed8', // blue-700
    buttonSecondary: '#6b7280', // gray-500
    buttonSecondaryHover: '#4b5563', // gray-600
    buttonSuccess: '#4caf50',
    buttonSuccessHover: '#388e3c',
    buttonError: '#f44336',
    buttonErrorHover: '#d32f2f',
    // Status colors
    statusOnline: '#4caf50',
    statusOffline: '#9ca3af',
    statusAway: '#ff9800',
    // Chart colors
    chartPrimary: '#2563eb', // blue-600
    chartSecondary: '#2196f3',
    chartSuccess: '#4caf50',
    chartWarning: '#ff9800',
    chartError: '#f44336',
  },
  dark: {
    text: '#ededed',
    background: '#0a0a0a',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    // Primary colors - Blue theme
    primary: '#2563eb', // blue-600
    primaryLight: '#dbeafe', // blue-100
    primaryDark: '#1d4ed8', // blue-700
    // Secondary colors
    secondary: '#2196f3',
    secondaryLight: '#bbdefb',
    secondaryDark: '#1976d2',
    // Success colors
    success: '#4caf50',
    successLight: '#c8e6c9',
    successDark: '#388e3c',
    // Error colors
    error: '#f44336',
    errorLight: '#ffcdd2',
    errorDark: '#d32f2f',
    // Warning colors
    warning: '#ff9800',
    warningLight: '#ffe0b2',
    warningDark: '#f57c00',
    // Info colors
    info: '#2196f3',
    infoLight: '#bbdefb',
    infoDark: '#1976d2',
    // Gray scale (dark mode)
    gray50: '#1f2937',
    gray100: '#374151',
    gray200: '#4b5563',
    gray300: '#6b7280',
    gray400: '#9ca3af',
    gray500: '#d1d5db',
    gray600: '#e5e7eb',
    gray700: '#f3f4f6',
    gray800: '#f9fafb',
    gray900: '#ffffff',
    // Background colors
    backgroundPrimary: '#0a0a0a',
    backgroundSecondary: '#1f2937',
    backgroundTertiary: '#374151',
    // Border colors
    borderLight: '#374151',
    borderMedium: '#4b5563',
    borderDark: '#6b7280',
    // Text colors
    textPrimary: '#ffffff',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    textInverse: '#111827',
    // Card colors
    cardBackground: '#1f2937',
    cardBorder: '#374151',
    cardShadow: '#000000',
    // Button colors
    buttonPrimary: '#2563eb', // blue-600
    buttonPrimaryHover: '#1d4ed8', // blue-700
    buttonSecondary: '#6b7280',
    buttonSecondaryHover: '#4b5563',
    buttonSuccess: '#4caf50',
    buttonSuccessHover: '#388e3c',
    buttonError: '#f44336',
    buttonErrorHover: '#d32f2f',
    // Status colors
    statusOnline: '#4caf50',
    statusOffline: '#6b7280',
    statusAway: '#ff9800',
    // Chart colors
    chartPrimary: '#2563eb', // blue-600
    chartSecondary: '#2196f3',
    chartSuccess: '#4caf50',
    chartWarning: '#ff9800',
    chartError: '#f44336',
  },
};

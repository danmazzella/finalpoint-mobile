import Constants from 'expo-constants';

/**
 * Check if the app is running in Expo Go
 */
export const isExpoGo = (): boolean => {
    return Constants.appOwnership === 'expo';
};

/**
 * Check if the app is a development build (standalone with dev mode)
 */
export const isDevelopmentBuild = (): boolean => {
    return Constants.appOwnership === 'standalone' && __DEV__;
};

/**
 * Check if the app is a production build (standalone without dev mode)
 */
export const isProductionBuild = (): boolean => {
    return Constants.appOwnership === 'standalone' && !__DEV__;
};

/**
 * Determine if notifications should be enabled
 * - Disabled in Expo Go (SDK 53+ limitation)
 * - Enabled in development builds and production builds
 */
export const shouldEnableNotifications = (): boolean => {
    return !isExpoGo();
};

/**
 * Get the current environment type for debugging
 */
export const getEnvironmentType = (): string => {
    if (isExpoGo()) return 'Expo Go';
    if (isDevelopmentBuild()) return 'Development Build';
    if (isProductionBuild()) return 'Production Build';
    return 'Unknown';
};

/**
 * Log environment information for debugging
 */
export const logEnvironmentInfo = (): void => {
    console.log('🔧 Environment Info:', {
        appOwnership: Constants.appOwnership,
        isExpoGo: isExpoGo(),
        isDevelopmentBuild: isDevelopmentBuild(),
        isProductionBuild: isProductionBuild(),
        shouldEnableNotifications: shouldEnableNotifications(),
        environmentType: getEnvironmentType(),
        isDev: __DEV__
    });
};

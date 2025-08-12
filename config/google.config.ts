// Google OAuth configuration for FinalPoint Mobile App
// This file handles Google Sign-In configuration

interface GoogleConfig {
    clientId: string;
    redirectUri: string;
}

// Get Google Client ID from environment variables based on platform
const getGoogleClientId = (): string => {
    // For Android, we need the web client ID for the Google Sign-In SDK
    // This is the same as EXPO_PUBLIC_GOOGLE_CLIENT_ID
    return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
};

// Get redirect URI for the app
const getRedirectUri = (): string => {
    // Use a custom URL scheme that redirects back to the mobile app
    // This will be handled by the app's deep linking configuration
    return 'finalpoint://auth/callback';
};

// Export the Google configuration
export const googleConfig: GoogleConfig = {
    clientId: getGoogleClientId(),
    redirectUri: getRedirectUri(),
};

// Check if Google configuration is valid
export const isGoogleConfigured = (): boolean => {
    return !!googleConfig.clientId;
};

// Get Google configuration status
export const getGoogleConfigStatus = () => {
    return {
        isConfigured: isGoogleConfigured(),
        clientId: googleConfig.clientId ? 'Set' : 'Missing',
        redirectUri: googleConfig.redirectUri,
        environment: process.env.NODE_ENV || 'development',
    };
};

// Log configuration status
if (!isGoogleConfigured()) {
    console.warn('⚠️ Google OAuth configuration is missing:');
    console.warn('  - Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your environment variables');
}

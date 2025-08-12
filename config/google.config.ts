// Google OAuth configuration for FinalPoint Mobile App
// This file handles Google Sign-In configuration

interface GoogleConfig {
    clientId: string;
}

// Get Google Client ID from environment variables based on platform
const getGoogleClientId = (): string => {
    // For Android, we need the web client ID for the Google Sign-In SDK
    // This is the same as EXPO_PUBLIC_GOOGLE_CLIENT_ID
    return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
};

// Export the Google configuration
export const googleConfig: GoogleConfig = {
    clientId: getGoogleClientId(),
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
        environment: process.env.NODE_ENV || 'development',
    };
};

// Log configuration status
if (!isGoogleConfigured()) {
    console.warn('⚠️ Google OAuth configuration is missing:');
    console.warn('  - Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your environment variables');
} else {
    console.log('✅ Google OAuth configured with client ID:', googleConfig.clientId);
    console.log('🔍 Environment variable value:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID);
}

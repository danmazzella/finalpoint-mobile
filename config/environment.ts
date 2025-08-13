// Environment configuration for FinalPoint Mobile App
// This file handles environment variables and provides fallbacks for development

interface EnvironmentConfig {
    firebase: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
        measurementId?: string;
    };
    api: {
        url: string;
    };
    app: {
        env: string;
        showGoogleSignIn: boolean;
    };
}


// Production configuration (should always use environment variables)
const PROD_CONFIG: EnvironmentConfig = {
    firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
    },
    api: {
        url: process.env.EXPO_PUBLIC_API_URL || ''
    },
    app: {
        env: process.env.EXPO_PUBLIC_APP_ENV || 'production',
        showGoogleSignIn: process.env.EXPO_PUBLIC_SHOW_GOOGLE_SIGNIN === 'true' || false
    }
};

// Development configuration (requires environment variables to be set)
const DEV_CONFIG: EnvironmentConfig = {
    firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
    },
    api: {
        url: process.env.EXPO_PUBLIC_API_URL || ''
    },
    app: {
        env: process.env.EXPO_PUBLIC_APP_ENV || 'development',
        showGoogleSignIn: process.env.EXPO_PUBLIC_SHOW_GOOGLE_SIGNIN === 'true' || true
    }
};

// Determine which configuration to use
const isProduction = process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_APP_ENV === 'production';

// Helper function to check if running in development
export const isDevelopment = (): boolean => {
    return !isProduction;
};

// Helper function to check if Google Sign In should be shown
export const shouldShowGoogleSignIn = (): boolean => {
    return environment.app.showGoogleSignIn;
};

export const environment: EnvironmentConfig = isProduction ? PROD_CONFIG : DEV_CONFIG;

// Export Firebase config directly for use in the app
export const firebaseConfig = environment.firebase;

// Export other configs for convenience
export const apiConfig = environment.api;
export const appConfig = environment.app;

// Helper function to validate configuration
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check required Firebase fields
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    requiredFields.forEach(field => {
        if (!firebaseConfig[field as keyof typeof firebaseConfig]) {
            errors.push(`Missing required Firebase configuration: ${field}`);
        }
    });

    // Check API URL
    if (!apiConfig.url) {
        errors.push('Missing API URL configuration');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Log configuration status
const configValidation = validateConfig();

if (!configValidation.isValid) {
    console.warn('⚠️ Environment configuration has issues:');
    configValidation.errors.forEach(error => console.warn('  -', error));
}

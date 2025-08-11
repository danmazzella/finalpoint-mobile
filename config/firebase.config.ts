import { firebaseConfig, validateConfig, isDevelopment } from './environment';

// Firebase project information
export const getFirebaseProjectId = (): string | null => {
    return firebaseConfig.projectId || null;
};

export const getFirebaseApiKey = (): string | null => {
    return firebaseConfig.apiKey || null;
};

export const getFirebaseAuthDomain = (): string | null => {
    return firebaseConfig.authDomain || null;
};

export const getFirebaseStorageBucket = (): string | null => {
    return firebaseConfig.storageBucket || null;
};

export const getFirebaseMessagingSenderId = (): string | null => {
    return firebaseConfig.messagingSenderId || null;
};

export const getFirebaseAppId = (): string | null => {
    return firebaseConfig.appId || null;
};

export const getFirebaseMeasurementId = (): string | null => {
    return firebaseConfig.measurementId || null;
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
    const configValidation = validateConfig();
    return configValidation.isValid;
};

// Get Firebase configuration status
export const getFirebaseConfigStatus = () => {
    const configValidation = validateConfig();
    const projectId = getFirebaseProjectId();
    const apiKey = getFirebaseApiKey();

    return {
        isConfigured: configValidation.isValid,
        projectId: projectId ? 'Set' : 'Missing',
        apiKey: apiKey ? 'Set' : 'Missing',
        environment: isDevelopment() ? 'Development' : 'Production',
        errors: configValidation.errors,
        warnings: configValidation.errors.length > 0 ?
            ['Firebase may not work properly with missing configuration'] : []
    };
};

// Firebase service availability check
export const checkFirebaseServices = () => {
    const services = {
        authentication: !!firebaseConfig.apiKey && !!firebaseConfig.authDomain,
        firestore: !!firebaseConfig.projectId,
        storage: !!firebaseConfig.storageBucket,
        analytics: !!firebaseConfig.measurementId,
        messaging: !!firebaseConfig.messagingSenderId
    };

    const availableServices = Object.entries(services)
        .filter(([_, available]) => available)
        .map(([service]) => service);

    const unavailableServices = Object.entries(services)
        .filter(([_, available]) => !available)
        .map(([service]) => service);

    return {
        available: availableServices,
        unavailable: unavailableServices,
        allAvailable: unavailableServices.length === 0
    };
};

// Get EAS project ID for Expo builds
export const getEasProjectId = (): string | null => {
    // Get the EAS project ID from app.json configuration
    return 'fd837ab0-bf92-40de-8205-9bcf247994ef';
};

// Firebase configuration summary
export const getFirebaseSummary = () => {
    const configStatus = getFirebaseConfigStatus();
    const services = checkFirebaseServices();

    return {
        configuration: configStatus,
        services,
        project: {
            id: getFirebaseProjectId(),
            name: 'FinalPoint Mobile',
            environment: isDevelopment() ? 'development' : 'production'
        },
        features: {
            authentication: services.available.includes('authentication'),
            database: services.available.includes('firestore'),
            storage: services.available.includes('storage'),
            analytics: services.available.includes('analytics'),
            messaging: services.available.includes('messaging')
        }
    };
};

// Export the main Firebase config for direct use
export { firebaseConfig };

// Export validation function
export { validateConfig };

// Export environment check
export { isDevelopment };

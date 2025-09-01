import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';
import { firebaseConfig } from './environment';
import { Platform } from 'react-native';

// Validate that required environment variables are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Firebase config validation failed');
    throw new Error('Missing required Firebase environment variables. Please check your environment configuration.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
// Note: AsyncStorage persistence is not configured due to Firebase version compatibility
// This will cause auth state to not persist between sessions, but the app will still function
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Messaging for push notifications (only in native environments)
let messaging: any = null;
try {
    // Only initialize messaging in native environments (iOS/Android)
    // Web browsers don't support Firebase Cloud Messaging
    if (Platform.OS !== 'web') {
        // Additional check for React Native environment
        if (typeof window === 'undefined') {
            // We're in React Native, check if we're in Expo Go
            const Constants = require('expo-constants');
            if (Constants.appOwnership !== 'expo') {
                messaging = getMessaging(app);
            }
        }
    }
} catch (error: any) {
    console.log('Firebase messaging not available:', error.message);
}

export { messaging };

// Initialize Analytics only if supported (web only)
let analytics: any = null;
if (Platform.OS === 'web') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { analytics };
export default app;

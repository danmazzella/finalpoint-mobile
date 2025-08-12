import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';
import { firebaseConfig } from './environment';

// Validate that required environment variables are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Firebase config validation failed');
    throw new Error('Missing required Firebase environment variables. Please check your environment configuration.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Messaging for push notifications (only in development builds)
let messaging: any = null;
try {
    if (typeof window === 'undefined') {
        // We're in React Native, check if we're in Expo Go
        const Constants = require('expo-constants');
        if (Constants.appOwnership !== 'expo') {
            messaging = getMessaging(app);
        }
    }
} catch (error: any) {
    console.log('Firebase messaging not available:', error.message);
}

export { messaging };

// Initialize Analytics only if supported (web only)
let analytics: any = null;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { analytics };
export default app;

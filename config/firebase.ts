// Firebase configuration for mobile app
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';

import { Platform } from 'react-native';
import { firebaseConfig } from './environment';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
let analytics: any = null;
try {
    analytics = getAnalytics(app);
} catch (error) {
    console.error('Firebase Analytics initialization failed:', error);
}

// Initialize FCM for Android only
let messaging: any = null;
if (Platform.OS === 'android') {
    try {
        messaging = getMessaging(app);
    } catch (error) {
        console.error('Firebase FCM initialization failed:', error);
    }
}



export { app, analytics, messaging };
export default app;

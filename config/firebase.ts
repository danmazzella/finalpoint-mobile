// Firebase configuration for mobile app
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';
import { Platform } from 'react-native';
import { firebaseConfig } from './environment';
import { isExpoGo, isWebBrowser } from '../utils/environment';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics - only in native builds, not in Expo Go or web
let analytics: any = null;
if (!isExpoGo() && !isWebBrowser()) {
    try {
        // Firebase Analytics v9+ works in React Native with proper configuration
        analytics = getAnalytics(app);
    } catch (error) {
        console.error('❌ Firebase Analytics initialization failed:', error);
        // Analytics will remain null, but the app will still work
    }
} else {
    console.log('🚫 Firebase Analytics disabled in Expo Go or web browser');
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

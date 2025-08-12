import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { googleConfig } from '../config/environment';

interface GoogleAuthResult {
    success: boolean;
    idToken?: string;
    error?: string;
}

export const googleSignIn = async (): Promise<GoogleAuthResult> => {
    try {
        // Configure Google Sign-In
        GoogleSignin.configure({
            webClientId: googleConfig.clientId, // Required for getting the idToken on Android
            iosClientId: googleConfig.iosClientId,
            offlineAccess: true,
        });

        // Check if device supports Google Play
        await GoogleSignin.hasPlayServices();

        // Check if user is already signed in
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
            await GoogleSignin.signOut();
        }

        // Sign in
        const userInfo = await GoogleSignin.signIn();

        if (userInfo.idToken) {
            return {
                success: true,
                idToken: userInfo.idToken,
            };
        } else {
            return {
                success: false,
                error: 'Failed to get ID token from Google',
            };
        }
    } catch (error: any) {
        console.error('Google Sign-In error:', error);

        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            return {
                success: false,
                error: 'Google Sign-In was cancelled',
            };
        } else if (error.code === statusCodes.IN_PROGRESS) {
            return {
                success: false,
                error: 'Google Sign-In is already in progress',
            };
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            return {
                success: false,
                error: 'Google Play Services not available',
            };
        } else {
            return {
                success: false,
                error: error.message || 'Google Sign-In failed',
            };
        }
    }
};

import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface GoogleSignInConfig {
    clientId: string;
    redirectUri: string;
}

export const useGoogleSignIn = (config: GoogleSignInConfig) => {
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithGoogle } = useAuth();
    const { showToast } = useToast();

    // Configure Google Sign-In
    const configureGoogleSignIn = useCallback(() => {
        GoogleSignin.configure({
            webClientId: config.clientId, // Required for getting the ID token
            offlineAccess: true, // Get refresh token
            forceCodeForRefreshToken: true, // Force code exchange for refresh token
        });
    }, [config.clientId]);

    const signIn = useCallback(async () => {
        try {
            setIsLoading(true);

            // Configure Google Sign-In if not already configured
            configureGoogleSignIn();

            // Check if user is already signed in
            const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
            if (hasPreviousSignIn) {
                await GoogleSignin.signOut();
            }

            // Start the sign-in process
            const signInResult = await GoogleSignin.signIn();

            if (signInResult.type === 'success' && signInResult.data.idToken) {
                const userData = signInResult.data;
                console.log('🔐 Google Sign-In successful:', userData.user.email);
                console.log('🔍 Full Google Sign-In data:', JSON.stringify(userData, null, 2));

                // Call the login function with Google user data
                const loginData = {
                    accessToken: userData.idToken!,
                    userInfo: {
                        id: userData.user.id,
                        email: userData.user.email,
                        name: userData.user.name,
                        picture: userData.user.photo,
                    },
                };

                console.log('🔍 Sending to loginWithGoogle:', JSON.stringify(loginData, null, 2));

                const loginResult = await loginWithGoogle(loginData);

                if (loginResult.success) {
                    showToast('Successfully signed in with Google!', 'success');
                } else {
                    showToast(loginResult.error || 'Google sign-in failed', 'error');
                }
            } else {
                throw new Error('No ID token received from Google');
            }

        } catch (error: any) {
            console.error('Google Sign-In error:', error);

            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                showToast('Sign-in cancelled', 'info');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                showToast('Sign-in already in progress', 'info');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                showToast('Google Play Services not available', 'error');
            } else {
                showToast('An error occurred during Google sign-in', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [config.clientId, configureGoogleSignIn, loginWithGoogle, showToast]);

    return {
        signIn,
        isLoading,
    };
};

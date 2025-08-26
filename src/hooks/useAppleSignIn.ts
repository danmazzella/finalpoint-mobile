import { useState } from 'react';
import { Platform } from 'react-native';
import { appleAuth } from '@invertase/react-native-apple-authentication';

interface AppleSignInResult {
    success: boolean;
    error?: string;
    data?: {
        idToken: string;
        userInfo: {
            id: string;
            email: string;
            name?: string;
        };
    };
}

export const useAppleSignIn = () => {
    const [isLoading, setIsLoading] = useState(false);

    const signInWithApple = async (): Promise<AppleSignInResult> => {
        if (Platform.OS !== 'ios') {
            return {
                success: false,
                error: 'Apple Sign-In is only available on iOS'
            };
        }

        try {
            setIsLoading(true);

            // Check if Apple Sign-In is available
            const isAvailable = await appleAuth.isAvailable;
            if (!isAvailable) {
                return {
                    success: false,
                    error: 'Apple Sign-In is not available on this device'
                };
            }

            // Perform Apple Sign-In
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [
                    appleAuth.Scope.EMAIL,
                    appleAuth.Scope.FULL_NAME
                ],
            });

            // Get the ID token
            const { identityToken, fullName, email, user } = appleAuthRequestResponse;

            if (!identityToken) {
                return {
                    success: false,
                    error: 'Failed to get Apple ID token'
                };
            }

            // Extract user information
            const userInfo = {
                id: user,
                email: email || '',
                name: fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : undefined
            };

            return {
                success: true,
                data: {
                    idToken: identityToken,
                    userInfo
                }
            };

        } catch (error: any) {
            console.error('Apple Sign-In error:', error);

            // Handle specific Apple Sign-In errors
            if (error.code === appleAuth.Error.CANCELED) {
                return {
                    success: false,
                    error: 'Sign-In was cancelled'
                };
            } else if (error.code === appleAuth.Error.INVALID_RESPONSE) {
                return {
                    success: false,
                    error: 'Invalid response from Apple'
                };
            } else if (error.code === appleAuth.Error.NOT_HANDLED) {
                return {
                    success: false,
                    error: 'Sign-In request not handled'
                };
            } else if (error.code === appleAuth.Error.UNKNOWN) {
                return {
                    success: false,
                    error: 'Unknown error occurred during Apple Sign-In'
                };
            }

            return {
                success: false,
                error: error.message || 'Apple Sign-In failed'
            };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        signInWithApple,
        isLoading
    };
};

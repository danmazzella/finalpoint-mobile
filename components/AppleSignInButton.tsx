import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppleSignIn } from '../src/hooks/useAppleSignIn';
import { useAuth } from '../src/context/AuthContext';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { router } from 'expo-router';

interface AppleSignInButtonProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({ onSuccess, onError }) => {
    const { signInWithApple, isLoading: isAppleLoading } = useAppleSignIn();
    const { loginWithApple, isAuthenticating } = useAuth();
    const { showToast } = useSimpleToast();
    const { resolvedTheme } = useTheme();

    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;
    const isDisabled = isAppleLoading || isAuthenticating;

    const handleAppleSignIn = async () => {
        if (Platform.OS !== 'ios') {
            const errorMsg = 'Apple Sign-In is only available on iOS devices';
            showToast(errorMsg, 'error');
            onError?.(errorMsg);
            return;
        }

        try {
            const result = await signInWithApple();

            if (!result.success) {
                const errorMsg = result.error || 'Apple Sign-In failed';
                showToast(errorMsg, 'error');
                onError?.(errorMsg);
                return;
            }

            if (result.data) {
                // Authenticate with our backend
                const authResult = await loginWithApple({
                    idToken: result.data.idToken,
                    userInfo: result.data.userInfo
                });

                if (authResult.success) {
                    showToast('Successfully signed in with Apple!', 'success');
                    onSuccess?.();
                    // Navigate to main app
                    router.replace('/(tabs)');
                } else {
                    const errorMsg = authResult.error || 'Authentication failed';
                    showToast(errorMsg, 'error');
                    onError?.(errorMsg);
                }
            }
        } catch (error: any) {
            const errorMsg = error.message || 'Apple Sign-In failed';
            showToast(errorMsg, 'error');
            onError?.(errorMsg);
        }
    };

    if (Platform.OS !== 'ios') {
        return null; // Don't show Apple Sign-In button on non-iOS platforms
    }

    return (
        <TouchableOpacity
            style={[
                styles.appleButton,
                { backgroundColor: currentColors.backgroundSecondary },
                isDisabled && styles.appleButtonDisabled
            ]}
            onPress={handleAppleSignIn}
            disabled={isDisabled}
            activeOpacity={0.8}
        >
            {isDisabled ? (
                <ActivityIndicator size="small" color={currentColors.textPrimary} />
            ) : (
                <>
                    <Ionicons name="logo-apple" size={20} color={currentColors.textPrimary} />
                    <Text style={[styles.appleButtonText, { color: currentColors.textPrimary }]}>
                        Continue with Apple
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    appleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        minHeight: 44,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    appleButtonDisabled: {
        opacity: 0.6,
    },
    appleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default AppleSignInButton;

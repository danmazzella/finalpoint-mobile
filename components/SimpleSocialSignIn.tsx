import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppleSignIn } from '../src/hooks/useAppleSignIn';
import { useAuth } from '../src/context/AuthContext';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { shouldShowGoogleSignIn } from '../config/environment';
import { router } from 'expo-router';

interface SimpleSocialSignInProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

const SimpleSocialSignIn: React.FC<SimpleSocialSignInProps> = ({ onSuccess, onError }) => {
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
                const authResult = await loginWithApple({
                    idToken: result.data.idToken,
                    userInfo: result.data.userInfo
                });

                if (authResult.success) {
                    showToast('Successfully signed in with Apple!', 'success');
                    onSuccess?.();
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

    const handleGoogleSignIn = () => {
        // Google Sign-In will be handled by the existing GoogleSignInWrapper
        showToast('Google Sign-In clicked', 'info');
    };

    return (
        <View style={styles.container}>
            {/* Simple "Sign in with:" prompt */}
            <Text style={[styles.promptText, { color: currentColors.textSecondary }]}>
                Sign in with:
            </Text>

            {/* Simple rounded buttons row */}
            <View style={styles.buttonsContainer}>
                {/* Apple Sign-In Button */}
                {Platform.OS === 'ios' && (
                    <TouchableOpacity
                        style={[
                            styles.socialButton,
                            {
                                backgroundColor: resolvedTheme === 'dark' ? '#FFFFFF' : '#000000'
                            },
                            isDisabled && styles.buttonDisabled
                        ]}
                        onPress={handleAppleSignIn}
                        disabled={isDisabled}
                        activeOpacity={0.8}
                    >
                        {isDisabled ? (
                            <Ionicons
                                name="logo-apple"
                                size={32}
                                color={resolvedTheme === 'dark' ? '#000000' : '#FFFFFF'}
                            />
                        ) : (
                            <Ionicons
                                name="logo-apple"
                                size={32}
                                color={resolvedTheme === 'dark' ? '#000000' : '#FFFFFF'}
                            />
                        )}
                    </TouchableOpacity>
                )}

                {/* Google Sign-In Button */}
                {shouldShowGoogleSignIn() && (
                    <TouchableOpacity
                        style={[
                            styles.socialButton,
                            {
                                backgroundColor: '#FFFFFF',
                                borderWidth: 1,
                                borderColor: '#D1D5DB'
                            }
                        ]}
                        onPress={handleGoogleSignIn}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="logo-google" size={32} color="#4285F4" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        alignItems: 'center',
    },
    promptText: {
        fontSize: 14,
        marginBottom: 16,
        fontWeight: '500',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    socialButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    placeholderIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
});

export default SimpleSocialSignIn;

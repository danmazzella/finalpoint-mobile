import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { spacing, borderRadius, shadows, inputStyles, buttonStyles } from '../utils/styles';

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { forgotPassword } = useAuth();
    const { showToast } = useSimpleToast();
    const { resolvedTheme } = useTheme();

    const scrollViewRef = useRef<ScrollView>(null);
    const emailInputRef = useRef<TextInput>(null);

    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;
    const universalStyles = createThemeStyles(currentColors);

    const handleForgotPassword = async () => {
        if (!email) {
            showToast('Please enter your email address', 'error');
            return;
        }

        if (!email.includes('@')) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await forgotPassword(email);
            if (result.success) {
                setIsSuccess(true);
                showToast('Password reset email sent!', 'success');
            } else {
                showToast(result.error || 'Failed to send reset email', 'error');
            }
        } catch (error) {
            showToast('Failed to send reset email. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.back();
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: currentColors.backgroundPrimary }]} edges={['top', 'left', 'right']}>
                <View style={styles.successContainer}>
                    {/* Success Icon */}
                    <View style={styles.successIconContainer}>
                        <Ionicons name="checkmark-circle" size={80} color={currentColors.success} />
                    </View>

                    {/* Success Message */}
                    <Text style={[styles.successTitle, { color: currentColors.textPrimary }]}>Check Your Email</Text>
                    <Text style={[styles.successMessage, { color: currentColors.textSecondary }]}>
                        If there is an account associated with {email}, you will receive a password reset link shortly.
                    </Text>

                    {/* Instructions */}
                    <View style={styles.instructionsContainer}>
                        <Text style={[styles.instructionsTitle, { color: currentColors.textPrimary }]}>What to do next:</Text>
                        <Text style={[styles.instructionText, { color: currentColors.textSecondary }]}>1. Check your email inbox</Text>
                        <Text style={[styles.instructionText, { color: currentColors.textSecondary }]}>2. Click the reset link in the email</Text>
                        <Text style={[styles.instructionText, { color: currentColors.textSecondary }]}>3. Create your new password</Text>
                        <Text style={[styles.instructionText, { color: currentColors.textSecondary }]}>4. Return to the app to sign in</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: currentColors.primary }]}
                            onPress={handleBackToLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.primaryButtonText, { color: currentColors.textInverse }]}>Back to Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, { backgroundColor: currentColors.backgroundSecondary, borderColor: currentColors.borderMedium }]}
                            onPress={() => {
                                setIsSuccess(false);
                                setEmail('');
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.secondaryButtonText, { color: currentColors.textPrimary }]}>Send Another Email</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.backgroundPrimary }]} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={universalStyles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 20}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={universalStyles.scrollView}
                    contentContainerStyle={[universalStyles.scrollContent, styles.scrollContent]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBackToLogin}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Logo and Branding Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <View style={[styles.logo, { backgroundColor: currentColors.primary }]}>
                                <Text style={[styles.logoText, { color: currentColors.textInverse }]}>FP</Text>
                                <View style={[styles.logoAccent, { backgroundColor: currentColors.warning }]} />
                            </View>
                        </View>
                        <Text style={[styles.appName, { color: currentColors.textPrimary }]}>Reset Password</Text>
                        <Text style={[styles.tagline, { color: currentColors.textSecondary }]}>Enter your email to receive a reset link</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        {/* Email Field */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: currentColors.textPrimary }]}>Email address</Text>
                            <TextInput
                                ref={emailInputRef}
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: currentColors.backgroundSecondary,
                                        borderColor: currentColors.borderMedium,
                                        color: currentColors.textPrimary
                                    },
                                    emailFocused && [styles.inputFocused, { borderColor: currentColors.primary }],
                                ]}
                                placeholder="Enter your email address"
                                placeholderTextColor={currentColors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                returnKeyType="done"
                                onSubmitEditing={handleForgotPassword}
                            />
                        </View>

                        {/* Send Reset Link Button */}
                        <TouchableOpacity
                            style={[
                                styles.resetButton,
                                { backgroundColor: currentColors.primary },
                                isLoading && [styles.buttonDisabled, { opacity: 0.7 }]
                            ]}
                            onPress={handleForgotPassword}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={currentColors.textInverse} />
                            ) : (
                                <Text style={[styles.resetButtonText, { color: currentColors.textInverse }]}>Send Reset Link</Text>
                            )}
                        </TouchableOpacity>

                        {/* Info Text */}
                        <Text style={[styles.infoText, { color: currentColors.textSecondary }]}>
                            We&apos;ll send you a link to reset your password. The link will expire in 4 hours for security.
                        </Text>
                    </View>

                    {/* Footer Links */}
                    <View style={styles.footerSection}>
                        <View style={styles.footerTextContainer}>
                            <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>Remember your password? </Text>
                            <TouchableOpacity onPress={handleBackToLogin}>
                                <Text style={[styles.footerLink, { color: currentColors.primary }]}>Sign in</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingVertical: 24,
        paddingBottom: 48,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    logoSection: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 32,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    logoAccent: {
        position: 'absolute',
        right: 8,
        top: 8,
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tagline: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    formSection: {
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        minHeight: 44,
    },
    inputFocused: {
        borderWidth: 2,
    },
    resetButton: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 16,
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
    buttonDisabled: {
        opacity: 0.7,
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 16,
        lineHeight: 20,
    },
    footerSection: {
        alignItems: 'center',
        marginTop: 24,
        paddingBottom: 16,
    },
    footerTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    successIconContainer: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    instructionsContainer: {
        marginBottom: 32,
        width: '100%',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
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
    secondaryButton: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        minHeight: 44,
        borderWidth: 1,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ForgotPasswordScreen;

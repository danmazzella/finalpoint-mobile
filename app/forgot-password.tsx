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
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows, inputStyles, buttonStyles } from '../utils/styles';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { useScreenSize } from '../hooks/useScreenSize';

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { forgotPassword } = useAuth();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();

    const scrollViewRef = useRef<ScrollView>(null);
    const emailInputRef = useRef<TextInput>(null);

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
            <SafeAreaView style={styles.container}>
                <ResponsiveContainer>
                    <View style={styles.successContainer}>
                        {/* Success Icon */}
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark-circle" size={80} color={Colors.light.success} />
                        </View>

                        {/* Success Message */}
                        <Text style={styles.successTitle}>Check Your Email</Text>
                        <Text style={styles.successMessage}>
                            If there is an account associated with {email}, you will receive a password reset link shortly.
                        </Text>

                        {/* Instructions */}
                        <View style={styles.instructionsContainer}>
                            <Text style={styles.instructionsTitle}>What to do next:</Text>
                            <Text style={styles.instructionText}>1. Check your email inbox</Text>
                            <Text style={styles.instructionText}>2. Click the reset link in the email</Text>
                            <Text style={styles.instructionText}>3. Create your new password</Text>
                            <Text style={styles.instructionText}>4. Return to the app to sign in</Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleBackToLogin}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryButtonText}>Back to Sign In</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => {
                                    setIsSuccess(false);
                                    setEmail('');
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.secondaryButtonText}>Try Different Email</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ResponsiveContainer>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveContainer>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 20}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        automaticallyAdjustKeyboardInsets={true}
                    >
                        {/* Main Content - Responsive Layout */}
                        {screenSize === 'tablet' ? (
                            <View style={styles.tabletLayout}>
                                {/* Left Column - Logo & Branding */}
                                <View style={styles.tabletLeftColumn}>
                                    <View style={styles.logoSection}>
                                        <View style={styles.logoContainer}>
                                            <View style={styles.logo}>
                                                <Text style={styles.logoText}>FP</Text>
                                                <View style={styles.logoAccent} />
                                            </View>
                                        </View>
                                        <Text style={styles.appName}>FinalPoint</Text>
                                        <Text style={styles.tagline}>F1 Prediction Game</Text>

                                        {/* Additional branding for tablets */}
                                        <View style={styles.tabletBranding}>
                                            <Text style={styles.tabletSubtitle}>
                                                Forgot your password? No worries!
                                            </Text>
                                            <Text style={styles.tabletFeatures}>
                                                • Enter your email address{'\n'}
                                                • Receive a reset link{'\n'}
                                                • Create a new password{'\n'}
                                                • Get back to racing!
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Right Column - Reset Form */}
                                <View style={styles.tabletRightColumn}>
                                    <View style={styles.formSection}>
                                        <Text style={styles.formTitle}>Reset Password</Text>
                                        <Text style={styles.formSubtitle}>
                                            Enter your email address and we&apos;ll send you a link to reset your password.
                                        </Text>

                                        {/* Email Field */}
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>Email Address</Text>
                                            <TextInput
                                                ref={emailInputRef}
                                                style={[
                                                    styles.input,
                                                    emailFocused && styles.inputFocused,
                                                ]}
                                                placeholder="Enter your email address"
                                                placeholderTextColor={Colors.light.textSecondary}
                                                value={email}
                                                onChangeText={setEmail}
                                                onFocus={() => setEmailFocused(true)}
                                                onBlur={() => setEmailFocused(false)}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                returnKeyType="done"
                                                onSubmitEditing={handleForgotPassword}
                                            />
                                        </View>

                                        {/* Reset Button */}
                                        <TouchableOpacity
                                            style={styles.resetButton}
                                            onPress={handleForgotPassword}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                            ) : (
                                                <Text style={styles.resetButtonText}>Send Reset Link</Text>
                                            )}
                                        </TouchableOpacity>

                                        {/* Back to Login */}
                                        <TouchableOpacity
                                            style={styles.backToLoginButton}
                                            onPress={handleBackToLogin}
                                        >
                                            <Text style={styles.backToLoginText}>Back to Sign In</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            /* Mobile Layout (existing code) */
                            <>
                                {/* Logo and Branding Section */}
                                <View style={styles.logoSection}>
                                    <View style={styles.logoContainer}>
                                        <View style={styles.logo}>
                                            <Text style={styles.logoText}>FP</Text>
                                            <View style={styles.logoAccent} />
                                        </View>
                                    </View>
                                    <Text style={styles.appName}>FinalPoint</Text>
                                    <Text style={styles.tagline}>F1 Prediction Game</Text>
                                </View>

                                {/* Form Section */}
                                <View style={styles.formSection}>
                                    <Text style={styles.formTitle}>Reset Password</Text>
                                    <Text style={styles.formSubtitle}>
                                        Enter your email address and we&apos;ll send you a link to reset your password.
                                    </Text>

                                    {/* Email Field */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Email Address</Text>
                                        <TextInput
                                            ref={emailInputRef}
                                            style={[
                                                styles.input,
                                                emailFocused && styles.inputFocused,
                                            ]}
                                            placeholder="Enter your email address"
                                            placeholderTextColor={Colors.light.textSecondary}
                                            value={email}
                                            onChangeText={setEmail}
                                            onFocus={() => setEmailFocused(true)}
                                            onBlur={() => setEmailFocused(false)}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            returnKeyType="done"
                                            onSubmitEditing={handleForgotPassword}
                                        />
                                    </View>

                                    {/* Reset Button */}
                                    <TouchableOpacity
                                        style={styles.resetButton}
                                        onPress={handleForgotPassword}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                        ) : (
                                            <Text style={styles.resetButtonText}>Send Reset Link</Text>
                                        )}
                                    </TouchableOpacity>

                                    {/* Back to Login */}
                                    <TouchableOpacity
                                        style={styles.backToLoginButton}
                                        onPress={handleBackToLogin}
                                    >
                                        <Text style={styles.backToLoginText}>Back to Sign In</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </ResponsiveContainer>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundPrimary,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: spacing.xl,
    },
    logoSection: {
        alignItems: 'center',
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    logoContainer: {
        marginBottom: spacing.md,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        ...shadows.md,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.light.textInverse,
    },
    logoAccent: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.light.warning,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    tagline: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    tabletBranding: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    tabletSubtitle: {
        fontSize: 18,
        color: Colors.light.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 24,
    },
    tabletFeatures: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    formSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    formSubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.light.borderMedium,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        fontSize: 16,
        color: Colors.light.textPrimary,
    },
    inputFocused: {
        borderColor: Colors.light.primary,
        borderWidth: 2,
    },
    resetButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.lg,
        ...shadows.sm,
    },
    resetButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    backToLoginButton: {
        alignItems: 'center',
        marginTop: spacing.md,
    },
    backToLoginText: {
        fontSize: 14,
        color: Colors.light.primary,
        fontWeight: '600',
    },
    // Success state styles
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    successIconContainer: {
        marginBottom: spacing.lg,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    successMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    instructionsContainer: {
        backgroundColor: Colors.light.backgroundSecondary,
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
        width: '100%',
        maxWidth: 400,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        width: '100%',
        maxWidth: 400,
    },
    primaryButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    primaryButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.light.borderMedium,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: Colors.light.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    // Tablet-specific styles
    tabletLayout: {
        flexDirection: 'row',
        minHeight: '100%',
        paddingHorizontal: spacing.lg,
    },
    tabletLeftColumn: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: spacing.xl,
    },
    tabletRightColumn: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: spacing.xl,
    },
});

export default ForgotPasswordScreen;

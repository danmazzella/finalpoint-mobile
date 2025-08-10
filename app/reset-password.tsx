import React, { useState, useRef, useEffect } from 'react';
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
import { useToast } from '../src/context/ToastContext';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';

const ResetPasswordScreen = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPasswordFocused, setNewPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const { resetPassword, forgotPassword } = useAuth();
    const { showToast } = useToast();
    const { token } = useLocalSearchParams<{ token: string }>();

    const scrollViewRef = useRef<ScrollView>(null);
    const newPasswordInputRef = useRef<TextInput>(null);
    const confirmPasswordInputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, [token]);

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('At least 8 characters');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('One lowercase letter');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('One uppercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('One number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
            errors.push('One special character');
        }

        return errors;
    };

    const handleResetPassword = async () => {
        if (!token) {
            showToast('Invalid reset link', 'error');
            return;
        }

        if (!newPassword || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            showToast(`Password must have: ${passwordErrors[0]}`, 'error');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await resetPassword(token, newPassword);
            if (result.success) {
                setIsSuccess(true);
                showToast(result.message || 'Password reset successful!', 'success');
            } else {
                const errorMessage = result.error || 'Failed to reset password';
                if (errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('invalid')) {
                    setError('This password reset link has expired. Please request a new one.');
                } else {
                    setError(errorMessage);
                }
                showToast(errorMessage, 'error');
            }
        } catch (error) {
            const errorMessage = 'Failed to reset password. Please try again.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestNewLink = async () => {
        router.push('/forgot-password');
    };

    const handleGoToLogin = () => {
        router.replace('/login');
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.successContainer}>
                    {/* Success Icon */}
                    <View style={styles.successIconContainer}>
                        <Ionicons name="checkmark-circle" size={80} color={Colors.light.success} />
                    </View>

                    {/* Success Message */}
                    <Text style={styles.successTitle}>Password Reset Complete!</Text>
                    <Text style={styles.successMessage}>
                        Your password has been successfully reset. You can now sign in with your new password.
                    </Text>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleGoToLogin}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>Go to Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (error && (error.includes('expired') || error.includes('invalid'))) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.errorContainer}>
                    {/* Error Icon */}
                    <View style={styles.errorIconContainer}>
                        <Ionicons name="time-outline" size={80} color={Colors.light.warning} />
                    </View>

                    {/* Error Message */}
                    <Text style={styles.errorTitle}>Link Expired</Text>
                    <Text style={styles.errorMessage}>
                        This password reset link has expired. Password reset links are valid for 4 hours for security reasons.
                    </Text>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleRequestNewLink}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Request New Link</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleGoToLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
                >
                    {/* Logo and Branding Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <View style={styles.logo}>
                                <Text style={styles.logoText}>FP</Text>
                                <View style={styles.logoAccent} />
                            </View>
                        </View>
                        <Text style={styles.appName}>Create New Password</Text>
                        <Text style={styles.tagline}>Enter your new secure password</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        {/* New Password Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    ref={newPasswordInputRef}
                                    style={[
                                        styles.passwordInput,
                                        newPasswordFocused && styles.inputFocused,
                                    ]}
                                    placeholder="Enter your new password"
                                    placeholderTextColor={Colors.light.textSecondary}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    onFocus={() => setNewPasswordFocused(true)}
                                    onBlur={() => setNewPasswordFocused(false)}
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="new-password"
                                    returnKeyType="next"
                                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Ionicons
                                        name={showNewPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={Colors.light.gray500}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirm Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    ref={confirmPasswordInputRef}
                                    style={[
                                        styles.passwordInput,
                                        confirmPasswordFocused && styles.inputFocused,
                                    ]}
                                    placeholder="Confirm your new password"
                                    placeholderTextColor={Colors.light.textSecondary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    onFocus={() => setConfirmPasswordFocused(true)}
                                    onBlur={() => setConfirmPasswordFocused(false)}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="new-password"
                                    returnKeyType="done"
                                    onSubmitEditing={handleResetPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={Colors.light.gray500}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password Requirements */}
                        <View style={styles.requirementsContainer}>
                            <Text style={styles.requirementsTitle}>Password must contain:</Text>
                            {[
                                { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
                                { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
                                { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
                                { test: (p: string) => /\d/.test(p), label: 'One number' },
                                { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p), label: 'One special character' },
                            ].map((req, index) => {
                                const isMet = req.test(newPassword);
                                return (
                                    <View key={index} style={styles.requirementItem}>
                                        <Ionicons
                                            name={isMet ? 'checkmark-circle' : 'ellipse-outline'}
                                            size={16}
                                            color={isMet ? Colors.light.success : Colors.light.textSecondary}
                                        />
                                        <Text style={[
                                            styles.requirementText,
                                            isMet && styles.requirementTextMet
                                        ]}>
                                            {req.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Reset Password Button */}
                        <TouchableOpacity
                            style={[styles.resetButton, isLoading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={Colors.light.textInverse} />
                            ) : (
                                <Text style={styles.resetButtonText}>Reset Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer Links */}
                    <View style={styles.footerSection}>
                        <TouchableOpacity onPress={handleGoToLogin}>
                            <Text style={styles.footerLink}>Back to Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundSecondary, // White background
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logoContainer: {
        marginBottom: spacing.lg,
    },
    logo: {
        width: 80,
        height: 80,
        backgroundColor: Colors.light.primary,
        borderRadius: borderRadius.lg,
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
        right: 8,
        top: 8,
        width: 12,
        height: 12,
        backgroundColor: Colors.light.warning,
        borderRadius: 2,
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
    formSection: {
        marginBottom: spacing.xxl,
    },
    inputContainer: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        backgroundColor: Colors.light.backgroundSecondary, // White background
        borderWidth: 1,
        borderColor: Colors.light.borderMedium,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingRight: 50,
        fontSize: 16,
        color: Colors.light.textPrimary,
    },
    inputFocused: {
        borderColor: Colors.light.primary,
        borderWidth: 2,
    },
    eyeButton: {
        position: 'absolute',
        right: spacing.md,
        top: '50%',
        transform: [{ translateY: -10 }],
        padding: spacing.xs,
    },
    requirementsContainer: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    requirementText: {
        fontSize: 13,
        color: Colors.light.textSecondary,
        marginLeft: spacing.sm,
    },
    requirementTextMet: {
        color: Colors.light.success,
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
    buttonDisabled: {
        opacity: 0.6,
    },
    footerSection: {
        alignItems: 'center',
    },
    footerLink: {
        fontSize: 14,
        color: Colors.light.primary,
        fontWeight: '600',
    },
    // Success and Error screen styles
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    successIconContainer: {
        marginBottom: spacing.xl,
    },
    errorIconContainer: {
        marginBottom: spacing.xl,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
        paddingHorizontal: spacing.md,
    },
    errorMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
        paddingHorizontal: spacing.md,
    },
    actionButtonsContainer: {
        width: '100%',
        gap: spacing.md,
    },
    primaryButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    primaryButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
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
});

export default ResetPasswordScreen;

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
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { useScreenSize } from '../hooks/useScreenSize';

const ResetPasswordScreen = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { resetPassword } = useAuth();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();
    const { token } = useLocalSearchParams();

    const scrollViewRef = useRef<ScrollView>(null);
    const passwordInputRef = useRef<TextInput>(null);
    const confirmPasswordInputRef = useRef<TextInput>(null);

    const validatePasswordComplexity = (password: string) => {
        const requirements = [
            { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
            { test: (p: string) => /[a-z]/.test(p), label: 'Contains lowercase letter' },
            { test: (p: string) => /[A-Z]/.test(p), label: 'Contains uppercase letter' },
            { test: (p: string) => /\d/.test(p), label: 'Contains number' },
            { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p), label: 'Contains special character' }
        ];

        const errors: string[] = [];
        requirements.forEach(req => {
            if (!req.test(password)) {
                errors.push(req.label);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            score: requirements.filter(req => req.test(password)).length
        };
    };

    const passwordValidation = validatePasswordComplexity(password);

    const handleResetPassword = async () => {
        if (!token) {
            showToast('Invalid reset token. Please request a new password reset.', 'error');
            return;
        }

        if (!password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (!passwordValidation.isValid) {
            showToast('Password does not meet requirements', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await resetPassword(token as string, password);
            if (result.success) {
                setIsSuccess(true);
                showToast('Password reset successfully!', 'success');
            } else {
                showToast(result.error || 'Failed to reset password', 'error');
            }
        } catch (error) {
            showToast('Failed to reset password. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.replace('/login');
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
                        <Text style={styles.successTitle}>Password Reset Successfully!</Text>
                        <Text style={styles.successMessage}>
                            Your password has been updated. You can now sign in with your new password.
                        </Text>

                        {/* Action Button */}
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleBackToLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Sign In</Text>
                        </TouchableOpacity>
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
                                                Create a new secure password
                                            </Text>
                                            <Text style={styles.tabletFeatures}>
                                                • Choose a strong password{'\n'}
                                                • Meet all requirements{'\n'}
                                                • Confirm your password{'\n'}
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
                                            Create a new secure password for your account.
                                        </Text>

                                        {/* Password Field */}
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>New Password</Text>
                                            <View style={styles.passwordContainer}>
                                                <TextInput
                                                    ref={passwordInputRef}
                                                    style={[
                                                        styles.passwordInput,
                                                        passwordFocused && styles.inputFocused,
                                                    ]}
                                                    placeholder="Enter your new password"
                                                    placeholderTextColor={Colors.light.textSecondary}
                                                    value={password}
                                                    onChangeText={setPassword}
                                                    onFocus={() => setPasswordFocused(true)}
                                                    onBlur={() => setPasswordFocused(false)}
                                                    secureTextEntry={!showPassword}
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                    returnKeyType="next"
                                                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                                                />
                                                <TouchableOpacity
                                                    style={styles.eyeButton}
                                                    onPress={() => setShowPassword(!showPassword)}
                                                >
                                                    <Ionicons
                                                        name={showPassword ? 'eye-off' : 'eye'}
                                                        size={20}
                                                        color={Colors.light.textSecondary}
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Password Strength Indicator */}
                                            <View style={styles.passwordStrengthContainer}>
                                                <View style={styles.strengthBar}>
                                                    <View
                                                        style={[
                                                            styles.strengthFill,
                                                            { width: `${(passwordValidation.score / 5) * 100}%` }
                                                        ]}
                                                    />
                                                </View>
                                                <Text style={styles.strengthText}>
                                                    {passwordValidation.score}/5 requirements met
                                                </Text>
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
                                                    returnKeyType="done"
                                                    onSubmitEditing={handleResetPassword}
                                                />
                                                <TouchableOpacity
                                                    style={styles.eyeButton}
                                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    <Ionicons
                                                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                                                        size={20}
                                                        color={Colors.light.textSecondary}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Reset Button */}
                                        <TouchableOpacity
                                            style={styles.resetButton}
                                            onPress={handleResetPassword}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                            ) : (
                                                <Text style={styles.resetButtonText}>Reset Password</Text>
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
                                        Create a new secure password for your account.
                                    </Text>

                                    {/* Password Field */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>New Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <TextInput
                                                ref={passwordInputRef}
                                                style={[
                                                    styles.passwordInput,
                                                    passwordFocused && styles.inputFocused,
                                                ]}
                                                placeholder="Enter your new password"
                                                placeholderTextColor={Colors.light.textSecondary}
                                                value={password}
                                                onChangeText={setPassword}
                                                onFocus={() => setPasswordFocused(true)}
                                                onBlur={() => setPasswordFocused(false)}
                                                secureTextEntry={!showPassword}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                returnKeyType="next"
                                                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                                            />
                                            <TouchableOpacity
                                                style={styles.eyeButton}
                                                onPress={() => setShowPassword(!showPassword)}
                                            >
                                                <Ionicons
                                                    name={showPassword ? 'eye-off' : 'eye'}
                                                    size={20}
                                                    color={Colors.light.textSecondary}
                                                />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Password Strength Indicator */}
                                        <View style={styles.passwordStrengthContainer}>
                                            <View style={styles.strengthBar}>
                                                <View
                                                    style={[
                                                        styles.strengthFill,
                                                        { width: `${(passwordValidation.score / 5) * 100}%` }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.strengthText}>
                                                {passwordValidation.score}/5 requirements met
                                            </Text>
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
                                                returnKeyType="done"
                                                onSubmitEditing={handleResetPassword}
                                            />
                                            <TouchableOpacity
                                                style={styles.eyeButton}
                                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                <Ionicons
                                                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                                                    size={20}
                                                    color={Colors.light.textSecondary}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Reset Button */}
                                    <TouchableOpacity
                                        style={styles.resetButton}
                                        onPress={handleResetPassword}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                        ) : (
                                            <Text style={styles.resetButtonText}>Reset Password</Text>
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
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        backgroundColor: Colors.light.backgroundSecondary,
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
    passwordStrengthContainer: {
        marginTop: spacing.sm,
    },
    strengthBar: {
        height: 4,
        backgroundColor: Colors.light.borderLight,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    strengthFill: {
        height: '100%',
        backgroundColor: Colors.light.primary,
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        textAlign: 'center',
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

export default ResetPasswordScreen;

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/context/ToastContext';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows, inputStyles, buttonStyles } from '../utils/styles';

const SignupScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signup, isLoading } = useAuth();
    const { showToast } = useToast();

    const scrollViewRef = useRef<ScrollView>(null);
    const nameInputRef = useRef<TextInput>(null);
    const emailInputRef = useRef<TextInput>(null);
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

        // Check for common weak patterns
        const weakPatterns = [
            { test: /(.)\1{2,}/, message: 'Avoid repeated characters' },
            { test: /123456/, message: 'Avoid sequential numbers' },
            { test: /abcdef/i, message: 'Avoid sequential letters' },
            { test: /qwerty/i, message: 'Avoid keyboard patterns' },
            { test: /password/i, message: 'Avoid common words like "password"' },
        ];

        for (const pattern of weakPatterns) {
            if (pattern.test.test(password)) {
                errors.push(pattern.message);
                break; // Only show one weak pattern error
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            score: requirements.filter(req => req.test(password)).length
        };
    };

    const passwordValidation = validatePasswordComplexity(password);

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        // Validate password complexity
        if (!passwordValidation.isValid) {
            showToast(passwordValidation.errors[0], 'error');
            return;
        }

        const success = await signup(name, email, password);
        if (success) {
            showToast('Account created successfully!', 'success');
            router.replace('/(tabs)');
        } else {
            showToast('Failed to create account. Please try again.', 'error');
        }
    };

    const scrollToInput = (inputRef: React.RefObject<TextInput | null>) => {
        if (scrollViewRef.current && inputRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                    y: 200, // Fixed offset that should work for most cases
                    animated: true,
                });
            }, 100);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
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
                    automaticallyAdjustKeyboardInsets={true}
                >
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
                        {/* Name Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Username</Text>
                            <TextInput
                                ref={nameInputRef}
                                style={[
                                    styles.input,
                                    nameFocused && styles.inputFocused,
                                ]}
                                placeholder="Enter your username"
                                value={name}
                                onChangeText={setName}
                                onFocus={() => {
                                    setNameFocused(true);
                                }}
                                onBlur={() => setNameFocused(false)}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => emailInputRef.current?.focus()}
                            />
                        </View>

                        {/* Email Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email address</Text>
                            <TextInput
                                ref={emailInputRef}
                                style={[
                                    styles.input,
                                    emailFocused && styles.inputFocused,
                                ]}
                                placeholder="Enter your email address"
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => {
                                    setEmailFocused(true);
                                }}
                                onBlur={() => setEmailFocused(false)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                            />
                        </View>

                        {/* Password Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    ref={passwordInputRef}
                                    style={[
                                        styles.passwordInput,
                                        passwordFocused && styles.inputFocused,
                                    ]}
                                    placeholder="Create a password"
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => {
                                        setPasswordFocused(true);
                                    }}
                                    onBlur={() => setPasswordFocused(false)}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="password"
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={Colors.light.gray500}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Password Requirements */}
                            {password.length > 0 && (
                                <View style={styles.requirementsContainer}>
                                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                                    <View style={styles.requirementItem}>
                                        <Ionicons
                                            name={passwordValidation.score >= 1 ? 'checkmark-circle' : 'close-circle'}
                                            size={16}
                                            color={passwordValidation.score >= 1 ? Colors.light.success : Colors.light.error}
                                        />
                                        <Text style={[styles.requirementText, passwordValidation.score >= 1 && styles.requirementMet]}>
                                            At least 8 characters
                                        </Text>
                                    </View>
                                    <View style={styles.requirementItem}>
                                        <Ionicons
                                            name={passwordValidation.score >= 2 ? 'checkmark-circle' : 'close-circle'}
                                            size={16}
                                            color={passwordValidation.score >= 2 ? Colors.light.success : Colors.light.error}
                                        />
                                        <Text style={[styles.requirementText, passwordValidation.score >= 2 && styles.requirementMet]}>
                                            Contains lowercase letter
                                        </Text>
                                    </View>
                                    <View style={styles.requirementItem}>
                                        <Ionicons
                                            name={passwordValidation.score >= 3 ? 'checkmark-circle' : 'close-circle'}
                                            size={16}
                                            color={passwordValidation.score >= 3 ? Colors.light.success : Colors.light.error}
                                        />
                                        <Text style={[styles.requirementText, passwordValidation.score >= 3 && styles.requirementMet]}>
                                            Contains uppercase letter
                                        </Text>
                                    </View>
                                    <View style={styles.requirementItem}>
                                        <Ionicons
                                            name={passwordValidation.score >= 4 ? 'checkmark-circle' : 'close-circle'}
                                            size={16}
                                            color={passwordValidation.score >= 4 ? Colors.light.success : Colors.light.error}
                                        />
                                        <Text style={[styles.requirementText, passwordValidation.score >= 4 && styles.requirementMet]}>
                                            Contains number
                                        </Text>
                                    </View>
                                    <View style={styles.requirementItem}>
                                        <Ionicons
                                            name={passwordValidation.score >= 5 ? 'checkmark-circle' : 'close-circle'}
                                            size={16}
                                            color={passwordValidation.score >= 5 ? Colors.light.success : Colors.light.error}
                                        />
                                        <Text style={[styles.requirementText, passwordValidation.score >= 5 && styles.requirementMet]}>
                                            Contains special character
                                        </Text>
                                    </View>
                                    {passwordValidation.errors.some(error =>
                                        error.includes('repeated') ||
                                        error.includes('sequential') ||
                                        error.includes('keyboard') ||
                                        error.includes('common')
                                    ) && (
                                            <View style={styles.requirementItem}>
                                                <Ionicons
                                                    name="close-circle"
                                                    size={16}
                                                    color={Colors.light.error}
                                                />
                                                <Text style={styles.requirementText}>
                                                    {passwordValidation.errors.find(error =>
                                                        error.includes('repeated') ||
                                                        error.includes('sequential') ||
                                                        error.includes('keyboard') ||
                                                        error.includes('common')
                                                    )}
                                                </Text>
                                            </View>
                                        )}
                                </View>
                            )}
                        </View>

                        {/* Confirm Password Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirm password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    ref={confirmPasswordInputRef}
                                    style={[
                                        styles.passwordInput,
                                        confirmPasswordFocused && styles.inputFocused,
                                    ]}
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    onFocus={() => {
                                        setConfirmPasswordFocused(true);
                                    }}
                                    onBlur={() => setConfirmPasswordFocused(false)}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="password"
                                    returnKeyType="done"
                                    onSubmitEditing={handleSignup}
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
                            {confirmPassword.length > 0 && password !== confirmPassword && (
                                <Text style={styles.errorText}>Passwords do not match</Text>
                            )}
                        </View>

                        {/* Create Account Button */}
                        <TouchableOpacity
                            style={[
                                styles.createAccountButton,
                                (!name || !email || !password || !confirmPassword || !passwordValidation.isValid || password !== confirmPassword) &&
                                styles.createAccountButtonDisabled
                            ]}
                            onPress={handleSignup}
                            activeOpacity={0.8}
                            disabled={
                                !name ||
                                !email ||
                                !password ||
                                !confirmPassword ||
                                !passwordValidation.isValid ||
                                password !== confirmPassword
                            }
                        >
                            <Text style={styles.createAccountButtonText}>Create account</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Links */}
                    <View style={styles.footerSection}>
                        <View style={styles.footerTextContainer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/login')}>
                                <Text style={styles.footerLink}>Sign in</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.learnMoreButton}
                            onPress={() => showToast('Learn more about FinalPoint', 'info')}
                        >
                            <Text style={styles.learnMoreText}>Learn more about FinalPoint</Text>
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
        backgroundColor: Colors.light.backgroundPrimary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    input: {
        backgroundColor: Colors.light.backgroundPrimary,
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
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        backgroundColor: Colors.light.backgroundPrimary,
        borderWidth: 1,
        borderColor: Colors.light.borderMedium,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingRight: 50,
        fontSize: 16,
        color: Colors.light.textPrimary,
    },
    eyeButton: {
        position: 'absolute',
        right: spacing.md,
        top: '50%',
        transform: [{ translateY: -10 }],
        padding: spacing.xs,
    },
    createAccountButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.lg,
        ...shadows.sm,
    },
    createAccountButtonDisabled: {
        backgroundColor: Colors.light.borderMedium,
        opacity: 0.7,
    },
    createAccountButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerSection: {
        alignItems: 'center',
    },
    footerTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    footerText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    footerLink: {
        fontSize: 14,
        color: Colors.light.primary,
        fontWeight: '600',
    },
    learnMoreButton: {
        paddingVertical: spacing.sm,
    },
    learnMoreText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textDecorationLine: 'underline',
    },
    requirementsContainer: {
        marginTop: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.light.borderMedium,
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
        marginLeft: spacing.xs,
    },
    requirementMet: {
        color: Colors.light.success,
        fontWeight: '600',
    },
    errorText: {
        color: Colors.light.error,
        fontSize: 12,
        marginTop: spacing.xs,
        marginLeft: spacing.md,
    },
});

export default SignupScreen;


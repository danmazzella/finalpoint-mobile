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
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';
import GoogleSignInWrapper from '../components/GoogleSignInWrapper';
import { shouldShowGoogleSignIn } from '../config/environment';


const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading, isAuthenticating } = useAuth();
    const { showToast } = useSimpleToast();
    const params = useLocalSearchParams();
    const redirectTo = params.redirect ? decodeURIComponent(params.redirect as string) : '/(tabs)';

    const scrollViewRef = useRef<ScrollView>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);



    // Function to open finalpoint.app website
    const handleLearnMore = async () => {
        try {
            const url = 'https://finalpoint.app';
            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
            } else {
                showToast('Unable to open website', 'error');
            }
        } catch (error) {
            showToast('Error opening website', 'error');
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const result = await login(email, password);
        if (result.success && 'message' in result && result.message) {
            showToast(result.message, 'success');
            // Redirect to the intended destination or default to tabs
            // Validate redirect path to prevent navigation errors
            if (redirectTo && redirectTo.startsWith('/') && redirectTo !== '/login' && redirectTo !== '/signup') {
                router.replace(redirectTo as any);
            } else {
                router.replace('/(tabs)');
            }
        } else if (!result.success && 'error' in result && result.error) {
            showToast(result.error, 'error');
        } else {
            showToast('Login failed. Please try again.', 'error');
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
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
                    contentInsetAdjustmentBehavior="automatic"
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
                                placeholderTextColor={Colors.light.textSecondary}
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
                                    placeholder="Enter your password"
                                    placeholderTextColor={Colors.light.textSecondary}
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
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
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
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={[styles.signInButton, isAuthenticating && { opacity: 0.7 }]}
                            onPress={handleLogin}
                            activeOpacity={0.8}
                            disabled={isAuthenticating}
                        >
                            {isAuthenticating ? (
                                <ActivityIndicator size="small" color={Colors.light.textInverse} />
                            ) : (
                                <Text style={styles.signInButtonText}>Sign in</Text>
                            )}
                        </TouchableOpacity>

                        {/* Google Sign-In Section */}
                        {shouldShowGoogleSignIn() && (
                            <>
                                {/* Divider */}
                                <View style={styles.dividerContainer}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>or</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {/* Conditional Google Sign-In Button */}
                                <GoogleSignInWrapper disabled={isAuthenticating || false} />
                            </>
                        )}

                        {/* Forgot Password Link */}
                        <TouchableOpacity
                            style={styles.forgotPasswordButton}
                            onPress={() => router.push('/forgot-password')}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Links */}
                    <View style={styles.footerSection}>
                        <View style={styles.footerTextContainer}>
                            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/signup')}>
                                <Text style={styles.footerLink}>Create an account</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.learnMoreButton}
                            onPress={handleLearnMore}
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
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
        paddingBottom: spacing.xxl * 2, // Add extra bottom padding
    },
    logoSection: {
        alignItems: 'center',
        marginTop: spacing.xxl,
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
        backgroundColor: Colors.light.backgroundSecondary, // White background
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
    eyeButton: {
        position: 'absolute',
        right: spacing.md,
        top: '50%',
        transform: [{ translateY: -10 }],
        padding: spacing.xs,
    },
    signInButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.lg,
        ...shadows.sm,
    },
    signInButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    forgotPasswordButton: {
        alignItems: 'center',
        marginTop: spacing.md,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: Colors.light.primary,
        fontWeight: '600',
    },
    footerSection: {
        alignItems: 'center',
        marginTop: spacing.xl,
        paddingBottom: spacing.lg,
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.light.borderMedium,
    },
    dividerText: {
        marginHorizontal: spacing.md,
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },


});

export default LoginScreen;


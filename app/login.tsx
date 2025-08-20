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
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
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
    const { resolvedTheme } = useTheme();
    const params = useLocalSearchParams();
    const redirectTo = params.redirect ? decodeURIComponent(params.redirect as string) : '/(tabs)';

    const scrollViewRef = useRef<ScrollView>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;
    const universalStyles = createThemeStyles(currentColors);

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
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: currentColors.backgroundPrimary }]} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color={currentColors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.backgroundPrimary }]} edges={['top', 'left', 'right', 'bottom']}>
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
                    automaticallyAdjustKeyboardInsets={true}
                    contentInsetAdjustmentBehavior="automatic"
                >
                    {/* Logo and Branding Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <View style={[styles.logo, { backgroundColor: currentColors.primary }]}>
                                <Text style={[styles.logoText, { color: currentColors.textInverse }]}>FP</Text>
                                <View style={[styles.logoAccent, { backgroundColor: currentColors.warning }]} />
                            </View>
                        </View>
                        <Text style={[styles.appName, { color: currentColors.textPrimary }]}>FinalPoint</Text>
                        <Text style={[styles.tagline, { color: currentColors.textSecondary }]}>F1 Prediction Game</Text>
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
                            <Text style={[styles.inputLabel, { color: currentColors.textPrimary }]}>Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    ref={passwordInputRef}
                                    style={[
                                        styles.passwordInput,
                                        {
                                            backgroundColor: currentColors.backgroundSecondary,
                                            borderColor: currentColors.borderMedium,
                                            color: currentColors.textPrimary
                                        },
                                        passwordFocused && [styles.inputFocused, { borderColor: currentColors.primary }],
                                    ]}
                                    placeholder="Enter your password"
                                    placeholderTextColor={currentColors.textSecondary}
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
                                        color={currentColors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={[
                                styles.signInButton,
                                { backgroundColor: currentColors.primary },
                                isAuthenticating && { opacity: 0.7 }
                            ]}
                            onPress={handleLogin}
                            activeOpacity={0.8}
                            disabled={isAuthenticating}
                        >
                            {isAuthenticating ? (
                                <ActivityIndicator size="small" color={currentColors.textInverse} />
                            ) : (
                                <Text style={[styles.signInButtonText, { color: currentColors.textInverse }]}>Sign in</Text>
                            )}
                        </TouchableOpacity>

                        {/* Google Sign-In Section */}
                        {shouldShowGoogleSignIn() && (
                            <>
                                {/* Divider */}
                                <View style={styles.dividerContainer}>
                                    <View style={[styles.dividerLine, { backgroundColor: currentColors.borderMedium }]} />
                                    <Text style={[styles.dividerText, { color: currentColors.textSecondary }]}>or</Text>
                                    <View style={[styles.dividerLine, { backgroundColor: currentColors.borderMedium }]} />
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
                            <Text style={[styles.forgotPasswordText, { color: currentColors.primary }]}>Forgot your password?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Links */}
                    <View style={styles.footerSection}>
                        <View style={styles.footerTextContainer}>
                            <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>Don&apos;t have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/signup')}>
                                <Text style={[styles.footerLink, { color: currentColors.primary }]}>Create an account</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.learnMoreButton}
                            onPress={handleLearnMore}
                        >
                            <Text style={[styles.learnMoreText, { color: currentColors.textSecondary }]}>Learn more about FinalPoint</Text>
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingVertical: 24,
        paddingBottom: 48, // Add extra bottom padding
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
    },
    formSection: {
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    inputFocused: {
        borderWidth: 2,
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        paddingRight: 50,
        fontSize: 16,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: [{ translateY: -10 }],
        padding: 4,
    },
    signInButton: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    signInButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    forgotPasswordButton: {
        alignItems: 'center',
        marginTop: 12,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footerSection: {
        alignItems: 'center',
        marginTop: 24,
        paddingBottom: 16,
    },
    footerTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    footerText: {
        fontSize: 14,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    learnMoreButton: {
        paddingVertical: 6,
    },
    learnMoreText: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 14,
        fontWeight: '500',
    },
});

export default LoginScreen;


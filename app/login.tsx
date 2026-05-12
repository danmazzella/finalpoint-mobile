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
    Image,
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
import { shadows } from '../utils/styles';
import GoogleSignInWrapper from '../components/GoogleSignInWrapper';
import { shouldShowGoogleSignIn } from '../config/environment';
import GlassBackground from '../src/components/GlassBackground';

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
            <GlassBackground>
                <SafeAreaView style={[styles.loadingContainer, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
                    <ActivityIndicator size="large" color={currentColors.primary} />
                </SafeAreaView>
            </GlassBackground>
        );
    }

    return (
        <GlassBackground>
            <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right', 'bottom']}>
                <KeyboardAvoidingView
                    style={universalStyles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 20}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        style={universalStyles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        automaticallyAdjustKeyboardInsets={true}
                        contentInsetAdjustmentBehavior="automatic"
                    >
                        {/* Logo Section */}
                        <View style={styles.logoSection}>
                            <View style={styles.logoWrapper}>
                                <Image
                                    source={require('../assets/android-icons/playstore-icon.png')}
                                    style={styles.logoImage}
                                    resizeMode="cover"
                                />
                            </View>
                            <Text style={[styles.appName, { color: currentColors.textPrimary }]}>FinalPoint</Text>
                            <Text style={[styles.tagline, { color: currentColors.textSecondary }]}>F1 Prediction Game</Text>
                        </View>

                        {/* Form Card */}
                        <View style={[styles.formCard, {
                            backgroundColor: currentColors.glassBackground,
                            borderColor: currentColors.glassBorder,
                        }]}>
                            <Text style={[styles.formTitle, { color: currentColors.textPrimary }]}>Sign in</Text>

                            {/* Email Field */}
                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Email address</Text>
                                <TextInput
                                    ref={emailInputRef}
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: currentColors.inputBackground,
                                            borderColor: emailFocused ? currentColors.primary : currentColors.glassBorder,
                                            color: currentColors.textPrimary,
                                            borderWidth: emailFocused ? 2 : 1,
                                        },
                                    ]}
                                    placeholder="Enter your email"
                                    placeholderTextColor={currentColors.textTertiary}
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setEmailFocused(true)}
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
                                <View style={styles.labelRow}>
                                    <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Password</Text>
                                    <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                                        <Text style={[styles.forgotLink, { color: currentColors.primary }]}>Forgot?</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        ref={passwordInputRef}
                                        style={[
                                            styles.passwordInput,
                                            {
                                                backgroundColor: currentColors.inputBackground,
                                                borderColor: passwordFocused ? currentColors.primary : currentColors.glassBorder,
                                                color: currentColors.textPrimary,
                                                borderWidth: passwordFocused ? 2 : 1,
                                            },
                                        ]}
                                        placeholder="Enter your password"
                                        placeholderTextColor={currentColors.textTertiary}
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setPasswordFocused(true)}
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
                                            color={currentColors.textTertiary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Sign In Button */}
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    { backgroundColor: currentColors.primary },
                                    isAuthenticating && { opacity: 0.7 },
                                ]}
                                onPress={handleLogin}
                                activeOpacity={0.85}
                                disabled={isAuthenticating}
                            >
                                {isAuthenticating ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Sign in</Text>
                                )}
                            </TouchableOpacity>

                            {/* Google Sign-In */}
                            {shouldShowGoogleSignIn() && (
                                <>
                                    <View style={styles.dividerRow}>
                                        <View style={[styles.dividerLine, { backgroundColor: currentColors.glassBorder }]} />
                                        <Text style={[styles.dividerText, { color: currentColors.textTertiary }]}>or</Text>
                                        <View style={[styles.dividerLine, { backgroundColor: currentColors.glassBorder }]} />
                                    </View>
                                    <GoogleSignInWrapper disabled={isAuthenticating || false} />
                                </>
                            )}
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <View style={styles.footerRow}>
                                <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/signup')}>
                                    <Text style={[styles.footerLink, { color: currentColors.primary }]}>Create account</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={handleLearnMore} style={styles.learnMoreButton}>
                                <Text style={[styles.learnMoreText, { color: currentColors.textTertiary }]}>Learn more at finalpoint.app</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </GlassBackground>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 48,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoWrapper: {
        width: 96,
        height: 96,
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#0A1628',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoImage: {
        width: 96,
        height: 96,
    },
    appName: {
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    tagline: {
        fontSize: 15,
        fontWeight: '400',
    },
    formCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        marginBottom: 20,
        ...shadows.glass,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 6,
    },
    forgotLink: {
        fontSize: 13,
        fontWeight: '600',
    },
    input: {
        borderRadius: 10,
        paddingVertical: 13,
        paddingHorizontal: 14,
        fontSize: 15,
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        borderRadius: 10,
        paddingVertical: 13,
        paddingHorizontal: 14,
        paddingRight: 48,
        fontSize: 15,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: [{ translateY: -10 }],
        padding: 4,
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    dividerRow: {
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
        fontSize: 13,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        gap: 10,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
    },
    learnMoreButton: {
        paddingVertical: 4,
    },
    learnMoreText: {
        fontSize: 13,
    },
});

export default LoginScreen;

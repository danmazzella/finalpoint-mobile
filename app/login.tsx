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

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuth();
    const { showToast } = useToast();

    const scrollViewRef = useRef<ScrollView>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const success = await login(email, password);
        if (success) {
            showToast('Login successful!', 'success');
            router.replace('/(tabs)');
        } else {
            showToast('Invalid email or password', 'error');
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
                                    placeholder="Enter your password"
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
                            style={styles.signInButton}
                            onPress={handleLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.signInButtonText}>Sign in</Text>
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
});

export default LoginScreen;


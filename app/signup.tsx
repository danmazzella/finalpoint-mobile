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
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { spacing, borderRadius, shadows, inputStyles, buttonStyles } from '../utils/styles';
import SimpleSocialSignIn from '../components/SimpleSocialSignIn';
import GoogleSignInWrapper from '../components/GoogleSignInWrapper';
import { shouldShowGoogleSignIn } from '../config/environment';

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
  const { signup, isLoading, isAuthenticating } = useAuth();
  const { showToast } = useSimpleToast();
  const { resolvedTheme } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const googleButtonRef = useRef<View>(null);

  const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;
  const universalStyles = createThemeStyles(currentColors);

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
    try {
      // Field validation
      if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
      }

      // Username validation
      if (name.length < 3) {
        showToast('Username must be at least 3 characters long', 'error');
        return;
      }

      // Password validation
      if (!passwordValidation.isValid) {
        showToast('Please fix password requirements', 'error');
        return;
      }

      // Password confirmation
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      // Attempt signup
      const result = await signup(email, password, name);
      if (result.success) {
        showToast('Account created successfully!', 'success');
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        showToast(result.error || 'Signup failed', 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast('An unexpected error occurred', 'error');
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  if (isLoading || isAuthenticating) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: currentColors.backgroundPrimary }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={currentColors.primary} />
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
            {/* Name Field */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: currentColors.textPrimary }]}>Username</Text>
              <TextInput
                ref={nameInputRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: currentColors.backgroundSecondary,
                    borderColor: currentColors.borderMedium,
                    color: currentColors.textPrimary
                  },
                  nameFocused && [styles.inputFocused, { borderColor: currentColors.primary }],
                ]}
                placeholder="Enter your username"
                placeholderTextColor={currentColors.textSecondary}
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="username"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
            </View>

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
                  placeholder="Create a password"
                  placeholderTextColor={currentColors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
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
                    color={currentColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Requirements */}
              {password.length > 0 && (
                <View style={styles.requirementsContainer}>
                  <Text style={[styles.requirementsTitle, { color: currentColors.textPrimary }]}>Password Requirements:</Text>
                  {[
                    { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
                    { test: (p: string) => /[a-z]/.test(p), label: 'Contains lowercase letter' },
                    { test: (p: string) => /[A-Z]/.test(p), label: 'Contains uppercase letter' },
                    { test: (p: string) => /\d/.test(p), label: 'Contains number' },
                    { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p), label: 'Contains special character' }
                  ].map((req, index) => {
                    const isMet = req.test(password);
                    return (
                      <View key={index} style={styles.requirementItem}>
                        <Ionicons
                          name={isMet ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color={isMet ? currentColors.success : currentColors.error}
                        />
                        <Text style={[styles.requirementText, { color: currentColors.textSecondary }, isMet && { color: currentColors.success }]}>
                          {req.label}
                        </Text>
                      </View>
                    );
                  })}
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
                          color={currentColors.error}
                        />
                        <Text style={[styles.requirementText, { color: currentColors.error }]}>
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
              <Text style={[styles.inputLabel, { color: currentColors.textPrimary }]}>Confirm password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={confirmPasswordInputRef}
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: currentColors.backgroundSecondary,
                      borderColor: currentColors.borderMedium,
                      color: currentColors.textPrimary
                    },
                    confirmPasswordFocused && [styles.inputFocused, { borderColor: currentColors.primary }],
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={currentColors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
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
                    color={currentColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={[styles.errorText, { color: currentColors.error }]}>Passwords do not match</Text>
              )}
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[
                styles.createAccountButton,
                { backgroundColor: currentColors.primary },
                (!name || !email || !password || !confirmPassword || !passwordValidation.isValid || password !== confirmPassword) &&
                [styles.createAccountButtonDisabled, { backgroundColor: currentColors.borderMedium }],
                isAuthenticating && { opacity: 0.7 }
              ]}
              onPress={handleSignup}
              activeOpacity={0.8}
              disabled={!name || !email || !password || !confirmPassword || !passwordValidation.isValid || password !== confirmPassword || isAuthenticating}
            >
              {isAuthenticating ? (
                <ActivityIndicator size="small" color={currentColors.textInverse} />
              ) : (
                <Text style={[styles.createAccountButtonText, { color: currentColors.textInverse }]}>Create account</Text>
              )}
            </TouchableOpacity>

            {/* Simple Social Sign-In */}
            <SimpleSocialSignIn />
          </View>

          {/* Footer Links */}
          <View style={styles.footerSection}>
            <View style={styles.footerTextContainer}>
              <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={[styles.footerLink, { color: currentColors.primary }]}>Sign in</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.learnMoreButton}
              onPress={() => showToast('Learn more about FinalPoint', 'info')}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 48,
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
    minHeight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  requirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  requirementMet: {
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  createAccountButton: {
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
  createAccountButtonDisabled: {
    opacity: 0.6,
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButtonsContainer: {
    gap: 12,
  },
});

export default SignupScreen;


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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import SimpleToast from '../components/SimpleToast';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { shadows } from '../utils/styles';
import GlassBackground from '../src/components/GlassBackground';

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
  const { showToast, toast, hideToast } = useSimpleToast();
  const { resolvedTheme } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

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
        break;
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
      if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
      }
      if (name.length < 3) {
        showToast('Username must be at least 3 characters long', 'error');
        return;
      }
      if (!passwordValidation.isValid) {
        showToast('Please fix password requirements', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      const result = await signup(email, password, name);
      if (result.success) {
        showToast('Account created successfully!', 'success');
        router.replace('/(tabs)');
      } else {
        showToast(result.error || 'Signup failed', 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast('An unexpected error occurred', 'error');
    }
  };

  const isFormValid = !!(name && email && password && confirmPassword && passwordValidation.isValid && password === confirmPassword);

  if (isLoading || isAuthenticating) {
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
      <>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
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
                <Text style={[styles.tagline, { color: currentColors.textSecondary }]}>Create your account</Text>
              </View>

              {/* Form Card */}
              <View style={[styles.formCard, {
                backgroundColor: currentColors.glassBackground,
                borderColor: currentColors.glassBorder,
              }]}>
                <Text style={[styles.formTitle, { color: currentColors.textPrimary }]}>Get started</Text>

                {/* Username */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Username</Text>
                  <TextInput
                    ref={nameInputRef}
                    style={[
                      styles.input,
                      {
                        backgroundColor: currentColors.inputBackground,
                        borderColor: nameFocused ? currentColors.primary : currentColors.glassBorder,
                        color: currentColors.textPrimary,
                        borderWidth: nameFocused ? 2 : 1,
                      },
                    ]}
                    placeholder="Choose a username"
                    placeholderTextColor={currentColors.textTertiary}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                  />
                </View>

                {/* Email */}
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

                {/* Password */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Password</Text>
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
                      placeholder="Create a password"
                      placeholderTextColor={currentColors.textTertiary}
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
                        color={currentColors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Password Requirements */}
                  {password.length > 0 && (
                    <View style={[styles.requirementsContainer, { backgroundColor: currentColors.inputBackground }]}>
                      {[
                        { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
                        { test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
                        { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
                        { test: (p: string) => /\d/.test(p), label: 'Number' },
                        { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p), label: 'Special character' }
                      ].map((req, index) => {
                        const isMet = req.test(password);
                        return (
                          <View key={index} style={styles.requirementItem}>
                            <Ionicons
                              name={isMet ? 'checkmark-circle' : 'ellipse-outline'}
                              size={14}
                              color={isMet ? currentColors.success : currentColors.textTertiary}
                            />
                            <Text style={[
                              styles.requirementText,
                              { color: isMet ? currentColors.success : currentColors.textTertiary }
                            ]}>
                              {req.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Confirm password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      ref={confirmPasswordInputRef}
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: currentColors.inputBackground,
                          borderColor: confirmPasswordFocused ? currentColors.primary : currentColors.glassBorder,
                          color: currentColors.textPrimary,
                          borderWidth: confirmPasswordFocused ? 2 : 1,
                        },
                        confirmPassword.length > 0 && password !== confirmPassword && {
                          borderColor: currentColors.error,
                          borderWidth: 1,
                        },
                      ]}
                      placeholder="Confirm your password"
                      placeholderTextColor={currentColors.textTertiary}
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
                        color={currentColors.textTertiary}
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
                    styles.primaryButton,
                    { backgroundColor: isFormValid ? currentColors.primary : currentColors.borderMedium },
                    isAuthenticating && { opacity: 0.7 },
                  ]}
                  onPress={handleSignup}
                  activeOpacity={0.85}
                  disabled={!isFormValid || isAuthenticating}
                >
                  {isAuthenticating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Create account</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.footerRow}>
                  <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/login')}>
                    <Text style={[styles.footerLink, { color: currentColors.primary }]}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        <SimpleToast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onHide={hideToast}
          duration={toast.duration}
        />
      </>
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
    marginBottom: 24,
  },
  logoWrapper: {
    width: 88,
    height: 88,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 88,
    height: 88,
  },
  appName: {
    fontSize: 28,
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
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
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
  requirementsContainer: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '47%',
  },
  requirementText: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
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
  footer: {
    alignItems: 'center',
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
});

export default SignupScreen;

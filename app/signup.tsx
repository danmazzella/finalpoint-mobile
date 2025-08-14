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
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows, inputStyles, buttonStyles } from '../utils/styles';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { useScreenSize } from '../hooks/useScreenSize';

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
  const screenSize = useScreenSize();

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
        showToast('Password does not meet requirements', 'error');
        return;
      }

      // Confirm password validation
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      const result = await signup(name, email, password);
      if (result.success) {
        showToast('Account created successfully!', 'success');
        router.replace('/(tabs)');
      } else {
        showToast(result.error || 'Failed to create account', 'error');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      showToast('Failed to create account. Please try again.', 'error');
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
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
                        Join the ultimate Formula 1 prediction competition
                      </Text>
                      <Text style={styles.tabletFeatures}>
                        • Create your account{'\n'}
                        • Join leagues and compete{'\n'}
                        • Make race predictions{'\n'}
                        • Track your performance
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right Column - Signup Form */}
                <View style={styles.tabletRightColumn}>
                  <View style={styles.formSection}>
                    <Text style={styles.formTitle}>Create Account</Text>
                    <Text style={styles.formSubtitle}>Join FinalPoint today</Text>

                    {/* Name Field */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Full Name</Text>
                      <TextInput
                        ref={nameInputRef}
                        style={[
                          styles.input,
                          nameFocused && styles.inputFocused,
                        ]}
                        placeholder="Enter your full name"
                        placeholderTextColor={Colors.light.textSecondary}
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="next"
                        onSubmitEditing={() => emailInputRef.current?.focus()}
                      />
                    </View>

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
                        returnKeyType="next"
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
                          placeholder="Create a strong password"
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
                          placeholder="Confirm your password"
                          placeholderTextColor={Colors.light.textSecondary}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          onFocus={() => setConfirmPasswordFocused(true)}
                          onBlur={() => setConfirmPasswordFocused(false)}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
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
                            color={Colors.light.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity
                      style={styles.signUpButton}
                      onPress={handleSignup}
                      disabled={isAuthenticating}
                      activeOpacity={0.8}
                    >
                      {isAuthenticating ? (
                        <ActivityIndicator size="small" color={Colors.light.textInverse} />
                      ) : (
                        <Text style={styles.signUpButtonText}>Create Account</Text>
                      )}
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={styles.footerSection}>
                      <View style={styles.footerTextContainer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={handleBackToLogin}>
                          <Text style={styles.footerLink}>Sign in</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
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
                  {/* Name Field */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      ref={nameInputRef}
                      style={[
                        styles.input,
                        nameFocused && styles.inputFocused,
                      ]}
                      placeholder="Enter your full name"
                      placeholderTextColor={Colors.light.textSecondary}
                      value={name}
                      onChangeText={setName}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                    />
                  </View>

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
                      returnKeyType="next"
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
                        placeholder="Create a strong password"
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
                        placeholder="Confirm your password"
                        placeholderTextColor={Colors.light.textSecondary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
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
                          color={Colors.light.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Sign Up Button */}
                  <TouchableOpacity
                    style={styles.signUpButton}
                    onPress={handleSignup}
                    disabled={isAuthenticating}
                    activeOpacity={0.8}
                  >
                    {isAuthenticating ? (
                      <ActivityIndicator size="small" color={Colors.light.textInverse} />
                    ) : (
                      <Text style={styles.signUpButtonText}>Create Account</Text>
                    )}
                  </TouchableOpacity>

                  {/* Footer */}
                  <View style={styles.footerSection}>
                    <View style={styles.footerTextContainer}>
                      <Text style={styles.footerText}>Already have an account? </Text>
                      <TouchableOpacity onPress={handleBackToLogin}>
                        <Text style={styles.footerLink}>Sign in</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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
  signUpButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  signUpButtonText: {
    color: Colors.light.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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

export default SignupScreen;


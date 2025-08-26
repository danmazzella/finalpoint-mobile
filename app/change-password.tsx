import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { spacing, borderRadius } from '../utils/styles';
import { router } from 'expo-router';

const ChangePasswordScreen = () => {
    const { changePassword } = useAuth();
    const { showToast } = useSimpleToast();
    const { resolvedTheme } = useTheme();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Get current theme colors from universal palette
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors
    const universalStyles = createThemeStyles(currentColors);

    // Input refs for navigation
    const newPasswordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

    const handleChangePassword = async () => {
        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showToast('New password must be at least 8 characters long', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const result = await changePassword(currentPassword, newPassword);
            if (result.success) {
                showToast('Password changed successfully!', 'success');
                Alert.alert(
                    'Success',
                    'Your password has been changed successfully.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back(),
                        },
                    ]
                );
            } else {
                showToast(result.error || 'Failed to change password. Please check your current password.', 'error');
            }
        } catch (error) {
            console.error('Change password error:', error);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const validatePassword = (password: string) => {
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

    const passwordValidation = validatePassword(newPassword);

    const styles = StyleSheet.create({
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
            minHeight: 64,
        },
        backButton: {
            paddingLeft: spacing.md,
            paddingRight: spacing.sm,
            paddingVertical: spacing.sm,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        placeholder: {
            width: 40,
        },
        form: {
            padding: spacing.lg,
        },
        inputGroup: {
            marginBottom: spacing.lg,
        },
        label: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: spacing.sm,
        },
        inputContainer: {
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
        },
        input: {
            flex: 1,
            fontSize: 16,
            color: currentColors.textPrimary,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            paddingRight: 50, // Space for eye button
            backgroundColor: currentColors.cardBackground,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            borderRadius: borderRadius.md,
        },
        eyeButton: {
            position: 'absolute',
            right: spacing.sm,
            padding: spacing.xs,
        },
        hint: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginTop: spacing.xs,
        },
        submitButton: {
            backgroundColor: currentColors.primary,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
            alignItems: 'center',
            marginTop: spacing.lg,
        },
        submitButtonDisabled: {
            backgroundColor: currentColors.borderMedium,
        },
        submitButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: 'bold',
        },
        validationContainer: {
            marginTop: spacing.sm,
        },
        validationTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: spacing.xs,
        },
        requirementItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.xs,
        },
        requirementText: {
            fontSize: 12,
            marginLeft: spacing.xs,
        },
        requirementMet: {
            color: currentColors.success,
        },
        requirementUnmet: {
            color: currentColors.error,
        },
        strengthBar: {
            height: 4,
            backgroundColor: currentColors.borderLight,
            borderRadius: 2,
            marginTop: spacing.xs,
            overflow: 'hidden',
        },
        strengthFill: {
            height: '100%',
            borderRadius: 2,
        },
        strengthWeak: {
            backgroundColor: currentColors.error,
            width: '20%',
        },
        strengthFair: {
            backgroundColor: currentColors.warning,
            width: '40%',
        },
        strengthGood: {
            backgroundColor: currentColors.warning,
            width: '60%',
        },
        strengthStrong: {
            backgroundColor: currentColors.success,
            width: '80%',
        },
        strengthVeryStrong: {
            backgroundColor: currentColors.success,
            width: '100%',
        },
    });

    const getStrengthColor = () => {
        if (passwordValidation.score <= 1) return styles.strengthWeak;
        if (passwordValidation.score <= 2) return styles.strengthFair;
        if (passwordValidation.score <= 3) return styles.strengthGood;
        if (passwordValidation.score <= 4) return styles.strengthStrong;
        return styles.strengthVeryStrong;
    };

    return (
        <SafeAreaView style={universalStyles.container} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={universalStyles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={universalStyles.scrollView}
                    contentContainerStyle={universalStyles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Change Password</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Current Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Current Password</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Enter your current password"
                                    placeholderTextColor={currentColors.textSecondary}
                                    secureTextEntry={!showCurrentPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="next"
                                    onSubmitEditing={() => newPasswordRef.current?.focus()}
                                    blurOnSubmit={false}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    <Ionicons
                                        name={showCurrentPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={currentColors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* New Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    ref={newPasswordRef}
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter your new password"
                                    placeholderTextColor={currentColors.textSecondary}
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="next"
                                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                                    blurOnSubmit={false}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Ionicons
                                        name={showNewPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={currentColors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Password Validation */}
                            {newPassword.length > 0 && (
                                <View style={styles.validationContainer}>
                                    <Text style={styles.validationTitle}>Password Requirements:</Text>
                                    {[
                                        { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
                                        { test: (p: string) => /[a-z]/.test(p), label: 'Contains lowercase letter' },
                                        { test: (p: string) => /[A-Z]/.test(p), label: 'Contains uppercase letter' },
                                        { test: (p: string) => /\d/.test(p), label: 'Contains number' },
                                        { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p), label: 'Contains special character' }
                                    ].map((req, index) => (
                                        <View key={index} style={styles.requirementItem}>
                                            <Ionicons
                                                name={req.test(newPassword) ? 'checkmark-circle' : 'close-circle'}
                                                size={16}
                                                color={req.test(newPassword) ? currentColors.success : currentColors.error}
                                            />
                                            <Text style={[
                                                styles.requirementText,
                                                req.test(newPassword) ? styles.requirementMet : styles.requirementUnmet
                                            ]}>
                                                {req.label}
                                            </Text>
                                        </View>
                                    ))}

                                    {/* Password Strength Bar */}
                                    <View style={styles.strengthBar}>
                                        <View style={[styles.strengthFill, getStrengthColor()]} />
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    ref={confirmPasswordRef}
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm your new password"
                                    placeholderTextColor={currentColors.textSecondary}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="done"
                                    onSubmitEditing={handleChangePassword}
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
                            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                <Text style={[styles.hint, { color: currentColors.error }]}>
                                    Passwords do not match
                                </Text>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordValidation.isValid) && styles.submitButtonDisabled
                            ]}
                            onPress={handleChangePassword}
                            disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordValidation.isValid || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={currentColors.textInverse} />
                            ) : (
                                <Text style={styles.submitButtonText}>Change Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChangePasswordScreen;

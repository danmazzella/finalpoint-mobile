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
import { useToast } from '../src/context/ToastContext';
import Colors from '../constants/Colors';
import { spacing, borderRadius } from '../utils/styles';
import { router } from 'expo-router';

const ChangePasswordScreen = () => {
    const { changePassword } = useAuth();
    const { showToast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

        if (newPassword.length < 6) {
            showToast('New password must be at least 8 characters long', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const success = await changePassword(currentPassword, newPassword);
            if (success) {
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
                showToast('Failed to change password. Please check your current password.', 'error');
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

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
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
                                    placeholderTextColor={Colors.light.textSecondary}
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
                                        color={Colors.light.textSecondary}
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
                                    placeholderTextColor={Colors.light.textSecondary}
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
                                        color={Colors.light.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password Requirements */}
                        {newPassword.length > 0 && (
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
                                    placeholderTextColor={Colors.light.textSecondary}
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
                                        color={Colors.light.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                <Text style={styles.errorText}>Passwords do not match</Text>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!currentPassword || !newPassword || !confirmPassword || !passwordValidation.isValid || newPassword !== confirmPassword) &&
                                styles.submitButtonDisabled
                            ]}
                            onPress={handleChangePassword}
                            disabled={
                                !currentPassword ||
                                !newPassword ||
                                !confirmPassword ||
                                !passwordValidation.isValid ||
                                newPassword !== confirmPassword ||
                                isLoading
                            }
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={Colors.light.textInverse} />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundSecondary, // White background
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: Colors.light.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
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
        color: Colors.light.textPrimary,
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
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.cardBackground,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.light.textPrimary,
        paddingVertical: spacing.md,
    },
    eyeButton: {
        padding: spacing.sm,
    },
    requirementsContainer: {
        backgroundColor: Colors.light.backgroundSecondary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
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
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginLeft: spacing.xs,
    },
    requirementMet: {
        color: Colors.light.textPrimary,
    },
    errorText: {
        fontSize: 14,
        color: Colors.light.error,
        marginTop: spacing.xs,
    },
    submitButton: {
        backgroundColor: Colors.light.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    submitButtonDisabled: {
        backgroundColor: Colors.light.gray400,
    },
    submitButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ChangePasswordScreen;

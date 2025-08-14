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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { useScreenSize } from '../hooks/useScreenSize';

const ChangePasswordScreen = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPasswordFocused, setCurrentPasswordFocused] = useState(false);
    const [newPasswordFocused, setNewPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { changePassword } = useAuth();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();

    const scrollViewRef = useRef<ScrollView>(null);
    const currentPasswordInputRef = useRef<TextInput>(null);
    const newPasswordInputRef = useRef<TextInput>(null);
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

        return {
            isValid: errors.length === 0,
            errors,
            score: requirements.filter(req => req.test(password)).length
        };
    };

    const passwordValidation = validatePasswordComplexity(newPassword);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (!passwordValidation.isValid) {
            showToast('New password does not meet requirements', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (currentPassword === newPassword) {
            showToast('New password must be different from current password', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await changePassword(currentPassword, newPassword);
            if (result) {
                showToast('Password changed successfully!', 'success');
                router.back();
            } else {
                showToast('Failed to change password', 'error');
            }
        } catch (error) {
            showToast('Failed to change password. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Changes',
            'Are you sure you want to cancel? Any unsaved changes will be lost.',
            [
                { text: 'Keep Editing', style: 'cancel' },
                { text: 'Cancel', style: 'destructive', onPress: () => router.back() }
            ]
        );
    };

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
                                                Update your account security
                                            </Text>
                                            <Text style={styles.tabletFeatures}>
                                                • Enter current password{'\n'}
                                                • Choose new strong password{'\n'}
                                                • Meet all requirements{'\n'}
                                                • Keep your account secure
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Right Column - Change Password Form */}
                                <View style={styles.tabletRightColumn}>
                                    <View style={styles.formSection}>
                                        <Text style={styles.formTitle}>Change Password</Text>
                                        <Text style={styles.formSubtitle}>
                                            Update your password to keep your account secure.
                                        </Text>

                                        {/* Current Password Field */}
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>Current Password</Text>
                                            <View style={styles.passwordContainer}>
                                                <TextInput
                                                    ref={currentPasswordInputRef}
                                                    style={[
                                                        styles.passwordInput,
                                                        currentPasswordFocused && styles.inputFocused,
                                                    ]}
                                                    placeholder="Enter your current password"
                                                    placeholderTextColor={Colors.light.textSecondary}
                                                    value={currentPassword}
                                                    onChangeText={setCurrentPassword}
                                                    onFocus={() => setCurrentPasswordFocused(true)}
                                                    onBlur={() => setCurrentPasswordFocused(false)}
                                                    secureTextEntry={!showCurrentPassword}
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                    returnKeyType="next"
                                                    onSubmitEditing={() => newPasswordInputRef.current?.focus()}
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

                                        {/* New Password Field */}
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>New Password</Text>
                                            <View style={styles.passwordContainer}>
                                                <TextInput
                                                    ref={newPasswordInputRef}
                                                    style={[
                                                        styles.passwordInput,
                                                        newPasswordFocused && styles.inputFocused,
                                                    ]}
                                                    placeholder="Enter your new password"
                                                    placeholderTextColor={Colors.light.textSecondary}
                                                    value={newPassword}
                                                    onChangeText={setNewPassword}
                                                    onFocus={() => setNewPasswordFocused(true)}
                                                    onBlur={() => setNewPasswordFocused(false)}
                                                    secureTextEntry={!showNewPassword}
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                    returnKeyType="next"
                                                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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
                                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                                            <View style={styles.passwordContainer}>
                                                <TextInput
                                                    ref={confirmPasswordInputRef}
                                                    style={[
                                                        styles.passwordInput,
                                                        confirmPasswordFocused && styles.inputFocused,
                                                    ]}
                                                    placeholder="Confirm your new password"
                                                    placeholderTextColor={Colors.light.textSecondary}
                                                    value={confirmPassword}
                                                    onChangeText={setConfirmPassword}
                                                    onFocus={() => setConfirmPasswordFocused(true)}
                                                    onBlur={() => setConfirmPasswordFocused(false)}
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
                                        </View>

                                        {/* Action Buttons */}
                                        <View style={styles.buttonContainer}>
                                            <TouchableOpacity
                                                style={styles.changeButton}
                                                onPress={handleChangePassword}
                                                disabled={isLoading}
                                                activeOpacity={0.8}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                                ) : (
                                                    <Text style={styles.changeButtonText}>Change Password</Text>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.cancelButton}
                                                onPress={handleCancel}
                                                disabled={isLoading}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.cancelButtonText}>Cancel</Text>
                                            </TouchableOpacity>
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
                                    <Text style={styles.formTitle}>Change Password</Text>
                                    <Text style={styles.formSubtitle}>
                                        Update your password to keep your account secure.
                                    </Text>

                                    {/* Current Password Field */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Current Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <TextInput
                                                ref={currentPasswordInputRef}
                                                style={[
                                                    styles.passwordInput,
                                                    currentPasswordFocused && styles.inputFocused,
                                                ]}
                                                placeholder="Enter your current password"
                                                placeholderTextColor={Colors.light.textSecondary}
                                                value={currentPassword}
                                                onChangeText={setCurrentPassword}
                                                onFocus={() => setCurrentPasswordFocused(true)}
                                                onBlur={() => setCurrentPasswordFocused(false)}
                                                secureTextEntry={!showCurrentPassword}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                returnKeyType="next"
                                                onSubmitEditing={() => newPasswordInputRef.current?.focus()}
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

                                    {/* New Password Field */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>New Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <TextInput
                                                ref={newPasswordInputRef}
                                                style={[
                                                    styles.passwordInput,
                                                    newPasswordFocused && styles.inputFocused,
                                                ]}
                                                placeholder="Enter your new password"
                                                placeholderTextColor={Colors.light.textSecondary}
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                onFocus={() => setNewPasswordFocused(true)}
                                                onBlur={() => setNewPasswordFocused(false)}
                                                secureTextEntry={!showNewPassword}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                returnKeyType="next"
                                                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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
                                        <Text style={styles.inputLabel}>Confirm New Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <TextInput
                                                ref={confirmPasswordInputRef}
                                                style={[
                                                    styles.passwordInput,
                                                    confirmPasswordFocused && styles.inputFocused,
                                                ]}
                                                placeholder="Confirm your new password"
                                                placeholderTextColor={Colors.light.textSecondary}
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                onFocus={() => setConfirmPasswordFocused(true)}
                                                onBlur={() => setConfirmPasswordFocused(false)}
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
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.changeButton}
                                            onPress={handleChangePassword}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                            ) : (
                                                <Text style={styles.changeButtonText}>Change Password</Text>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={handleCancel}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
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
        lineHeight: 22,
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
    inputFocused: {
        borderColor: Colors.light.primary,
        borderWidth: 2,
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
    buttonContainer: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    changeButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    changeButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.light.borderMedium,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: Colors.light.textPrimary,
        fontSize: 16,
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

export default ChangePasswordScreen;

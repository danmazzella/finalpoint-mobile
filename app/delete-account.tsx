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

const DeleteAccountScreen = () => {
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmTextFocused, setConfirmTextFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { logout } = useAuth();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();

    const scrollViewRef = useRef<ScrollView>(null);
    const passwordInputRef = useRef<TextInput>(null);
    const confirmTextInputRef = useRef<TextInput>(null);

    const handleDeleteAccount = async () => {
        if (!password) {
            showToast('Please enter your password', 'error');
            return;
        }

        if (confirmText !== 'DELETE') {
            showToast('Please type DELETE to confirm', 'error');
            return;
        }

        Alert.alert(
            'Final Warning',
            'This action cannot be undone. All your data, leagues, and predictions will be permanently deleted. Are you absolutely sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            // For now, just show a message since deleteAccount might not be implemented
                            showToast('Account deletion feature is not yet implemented. Please contact support.', 'info');
                            setIsLoading(false);
                        } catch (error) {
                            showToast('Failed to delete account. Please try again.', 'error');
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCancel = () => {
        router.back();
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
                                                Account Deletion Warning
                                            </Text>
                                            <Text style={styles.tabletFeatures}>
                                                • This action is irreversible{'\n'}
                                                • All data will be lost{'\n'}
                                                • Leagues and predictions deleted{'\n'}
                                                • Please consider alternatives
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Right Column - Delete Account Form */}
                                <View style={styles.tabletRightColumn}>
                                    <View style={styles.formSection}>
                                        <View style={styles.warningContainer}>
                                            <Ionicons name="warning" size={48} color={Colors.light.warning} />
                                            <Text style={styles.warningTitle}>Delete Account</Text>
                                            <Text style={styles.warningMessage}>
                                                This action cannot be undone. All your data, leagues, and predictions will be permanently deleted.
                                            </Text>
                                        </View>

                                        {/* Password Field */}
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>Enter Your Password</Text>
                                            <View style={styles.passwordContainer}>
                                                <TextInput
                                                    ref={passwordInputRef}
                                                    style={[
                                                        styles.passwordInput,
                                                        passwordFocused && styles.inputFocused,
                                                    ]}
                                                    placeholder="Enter your password to confirm"
                                                    placeholderTextColor={Colors.light.textSecondary}
                                                    value={password}
                                                    onChangeText={setPassword}
                                                    onFocus={() => setPasswordFocused(true)}
                                                    onBlur={() => setPasswordFocused(false)}
                                                    secureTextEntry={!showPassword}
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                    returnKeyType="next"
                                                    onSubmitEditing={() => confirmTextInputRef.current?.focus()}
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
                                        </View>

                                        {/* Confirmation Text Field */}
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>Type DELETE to Confirm</Text>
                                            <TextInput
                                                ref={confirmTextInputRef}
                                                style={[
                                                    styles.input,
                                                    confirmTextFocused && styles.inputFocused,
                                                ]}
                                                placeholder="Type DELETE"
                                                placeholderTextColor={Colors.light.textSecondary}
                                                value={confirmText}
                                                onChangeText={setConfirmText}
                                                onFocus={() => setConfirmTextFocused(true)}
                                                onBlur={() => setConfirmTextFocused(false)}
                                                autoCapitalize="characters"
                                                autoCorrect={false}
                                                returnKeyType="done"
                                                onSubmitEditing={handleDeleteAccount}
                                            />
                                        </View>

                                        {/* Action Buttons */}
                                        <View style={styles.buttonContainer}>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={handleDeleteAccount}
                                                disabled={isLoading || !password || confirmText !== 'DELETE'}
                                                activeOpacity={0.8}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                                ) : (
                                                    <Text style={styles.deleteButtonText}>Delete Account</Text>
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
                                    <View style={styles.warningContainer}>
                                        <Ionicons name="warning" size={48} color={Colors.light.warning} />
                                        <Text style={styles.warningTitle}>Delete Account</Text>
                                        <Text style={styles.warningMessage}>
                                            This action cannot be undone. All your data, leagues, and predictions will be permanently deleted.
                                        </Text>
                                    </View>

                                    {/* Password Field */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Enter Your Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <TextInput
                                                ref={passwordInputRef}
                                                style={[
                                                    styles.passwordInput,
                                                    passwordFocused && styles.inputFocused,
                                                ]}
                                                placeholder="Enter your password to confirm"
                                                placeholderTextColor={Colors.light.textSecondary}
                                                value={password}
                                                onChangeText={setPassword}
                                                onFocus={() => setPasswordFocused(true)}
                                                onBlur={() => setPasswordFocused(false)}
                                                secureTextEntry={!showPassword}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                returnKeyType="next"
                                                onSubmitEditing={() => confirmTextInputRef.current?.focus()}
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
                                    </View>

                                    {/* Confirmation Text Field */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Type DELETE to Confirm</Text>
                                        <TextInput
                                            ref={confirmTextInputRef}
                                            style={[
                                                styles.input,
                                                confirmTextFocused && styles.inputFocused,
                                            ]}
                                            placeholder="Type DELETE"
                                            placeholderTextColor={Colors.light.textSecondary}
                                            value={confirmText}
                                            onChangeText={setConfirmText}
                                            onFocus={() => setConfirmTextFocused(true)}
                                            onBlur={() => setConfirmTextFocused(false)}
                                            autoCapitalize="characters"
                                            autoCorrect={false}
                                            returnKeyType="done"
                                            onSubmitEditing={handleDeleteAccount}
                                        />
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={handleDeleteAccount}
                                            disabled={isLoading || !password || confirmText !== 'DELETE'}
                                            activeOpacity={0.8}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                            ) : (
                                                <Text style={styles.deleteButtonText}>Delete Account</Text>
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
    warningContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        padding: spacing.lg,
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.warning,
    },
    warningTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.warning,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    warningMessage: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
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
    buttonContainer: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    deleteButton: {
        backgroundColor: Colors.light.error,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    deleteButtonText: {
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

export default DeleteAccountScreen;

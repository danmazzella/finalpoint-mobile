import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import { spacing, borderRadius } from '../utils/styles';

const DeleteAccountScreen = () => {
    const { user, deleteAccount } = useAuth();
    const { showToast } = useSimpleToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Delete Account Form State
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const handleDeleteAccount = async () => {
        setError('');
        setSuccess('');

        if (!deletePassword) {
            setError('Please enter your password to confirm account deletion');
            return;
        }

        if (deleteConfirmation !== 'DELETE') {
            setError('Please type "DELETE" to confirm account deletion');
            return;
        }

        Alert.alert(
            'Confirm Account Deletion',
            'Are you absolutely sure you want to delete your account? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const success = await deleteAccount(deletePassword);
                            if (success) {
                                setSuccess('Account successfully deleted. You will be redirected to the login screen.');
                                showToast('Account successfully deleted', 'success');
                                // Redirect to login after a short delay
                                setTimeout(() => {
                                    router.replace('/(tabs)');
                                }, 2000);
                            } else {
                                setError('Failed to delete account. Please check your password and try again.');
                            }
                        } catch (error) {
                            console.error('Delete account error:', error);
                            setError('An error occurred while deleting your account. Please try again.');
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleContactSupport = async () => {
        try {
            const emailUrl = 'mailto:dan@mazzella.me?subject=FinalPoint%20Account%20Help';
            const supported = await Linking.canOpenURL(emailUrl);
            if (supported) {
                await Linking.openURL(emailUrl);
            } else {
                showToast('Unable to open email client', 'error');
            }
        } catch (error) {
            console.error('Error opening email client:', error);
            showToast('Unable to open email client', 'error');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Delete Account</Text>
                </View>

                <View style={styles.content}>
                    <Text style={styles.description}>
                        Permanently delete your FinalPoint account and all associated data.
                    </Text>

                    {/* Success/Error Messages */}
                    {success ? (
                        <View style={styles.successContainer}>
                            <Text style={styles.successText}>{success}</Text>
                        </View>
                    ) : null}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Warning Section */}
                    <View style={styles.warningContainer}>
                        <View style={styles.warningHeader}>
                            <Ionicons name="warning" size={24} color={Colors.light.error} />
                            <Text style={styles.warningTitle}>Warning: This action cannot be undone</Text>
                        </View>
                        <View style={styles.warningList}>
                            <Text style={styles.warningItem}>• Your personal information will be permanently removed</Text>
                            <Text style={styles.warningItem}>• You will lose access to all your leagues and predictions</Text>
                            <Text style={styles.warningItem}>• Your account cannot be recovered after deletion</Text>
                            <Text style={styles.warningItem}>• Any outstanding league activity will be preserved but anonymized</Text>
                        </View>
                    </View>

                    {/* Account Info */}
                    <View style={styles.accountInfoContainer}>
                        <Text style={styles.accountInfoTitle}>Account to be deleted</Text>
                        <View style={styles.accountInfoContent}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                            <View style={styles.accountDetails}>
                                <Text style={styles.accountName}>{user?.name}</Text>
                                <Text style={styles.accountEmail}>{user?.email}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Delete Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Confirm Account Deletion</Text>
                        <Text style={styles.formDescription}>
                            Please enter your password and type "DELETE" to confirm this action.
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Enter your password</Text>
                            <TextInput
                                style={styles.textInput}
                                value={deletePassword}
                                onChangeText={setDeletePassword}
                                placeholder="Your current password"
                                placeholderTextColor={Colors.light.textTertiary}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Type "DELETE" to confirm</Text>
                            <TextInput
                                style={styles.textInput}
                                value={deleteConfirmation}
                                onChangeText={setDeleteConfirmation}
                                placeholder="Type DELETE"
                                placeholderTextColor={Colors.light.textTertiary}
                                autoCapitalize="characters"
                            />
                            <Text style={styles.inputHint}>
                                This must exactly match "DELETE" (case-sensitive)
                            </Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => router.back()}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.deleteButton,
                                    (!deletePassword || deleteConfirmation !== 'DELETE' || isLoading) && styles.deleteButtonDisabled
                                ]}
                                onPress={handleDeleteAccount}
                                disabled={!deletePassword || deleteConfirmation !== 'DELETE' || isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                ) : (
                                    <Text style={styles.deleteButtonText}>Delete My Account</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Additional Help */}
                    <View style={styles.helpContainer}>
                        <Text style={styles.helpTitle}>Need help instead?</Text>
                        <Text style={styles.helpDescription}>
                            If you're having issues with your account, consider contacting support before deleting your account.
                        </Text>
                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={handleContactSupport}
                        >
                            <Text style={styles.contactButtonText}>Contact Support</Text>
                            <Ionicons name="mail-outline" size={16} color={Colors.light.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundPrimary,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
        backgroundColor: Colors.light.cardBackground,
    },
    backButton: {
        marginRight: spacing.md,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
    },
    content: {
        padding: spacing.lg,
    },
    description: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    successContainer: {
        backgroundColor: Colors.light.success + '20',
        borderWidth: 1,
        borderColor: Colors.light.success,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    successText: {
        color: Colors.light.success,
        textAlign: 'center',
    },
    errorContainer: {
        backgroundColor: Colors.light.error + '20',
        borderWidth: 1,
        borderColor: Colors.light.error,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    errorText: {
        color: Colors.light.error,
        textAlign: 'center',
    },
    warningContainer: {
        backgroundColor: Colors.light.error + '10',
        borderWidth: 1,
        borderColor: Colors.light.error + '30',
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.error,
        marginLeft: spacing.sm,
    },
    warningList: {
        marginLeft: spacing.md,
    },
    warningItem: {
        fontSize: 14,
        color: Colors.light.error,
        marginBottom: spacing.xs,
    },
    accountInfoContainer: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    accountInfoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.md,
    },
    accountInfoContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.light.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.textSecondary,
    },
    accountDetails: {
        flex: 1,
    },
    accountName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    accountEmail: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    formContainer: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    formDescription: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.lg,
    },
    inputContainer: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    textInput: {
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: Colors.light.textPrimary,
        backgroundColor: Colors.light.backgroundPrimary,
    },
    inputHint: {
        fontSize: 12,
        color: Colors.light.textTertiary,
        marginTop: spacing.xs,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.lg,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.light.borderLight,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: Colors.light.borderLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.textSecondary,
    },
    deleteButton: {
        flex: 1,
        backgroundColor: Colors.light.error,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    deleteButtonDisabled: {
        opacity: 0.5,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.textInverse,
    },
    helpContainer: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginTop: spacing.lg,
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    helpDescription: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.md,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactButtonText: {
        fontSize: 14,
        color: Colors.light.primary,
        marginRight: spacing.xs,
    },
});

export default DeleteAccountScreen;

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/context/ToastContext';
import Colors from '../constants/Colors';
import { spacing, borderRadius } from '../utils/styles';
import { router } from 'expo-router';

const EditProfileScreen = () => {
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const [name, setName] = useState(user?.name || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateProfile = async () => {
        if (!name.trim()) {
            showToast('Please enter a name', 'error');
            return;
        }

        if (name.trim().length < 2) {
            showToast('Name must be at least 2 characters long', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const success = await updateProfile(name.trim());
            if (success) {
                showToast('Profile updated successfully!', 'success');
                Alert.alert(
                    'Success',
                    'Your profile has been updated successfully.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back(),
                        },
                    ]
                );
            } else {
                showToast('Failed to update profile. Please try again.', 'error');
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            if (error?.response?.data?.errors?.some((e: any) => e.message === 'Username already taken')) {
                showToast('Username already taken. Please choose a different username.', 'error');
            } else {
                showToast('An error occurred. Please try again.', 'error');
            }
        } finally {
            setIsLoading(false);
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
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Name Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor={Colors.light.textSecondary}
                            autoCapitalize="words"
                            autoCorrect={false}
                            maxLength={50}
                        />
                        <Text style={styles.hint}>Minimum 2 characters</Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!name.trim() || name.trim().length < 2) && styles.submitButtonDisabled
                        ]}
                        onPress={handleUpdateProfile}
                        disabled={!name.trim() || name.trim().length < 2 || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={Colors.light.textInverse} />
                        ) : (
                            <Text style={styles.submitButtonText}>Update Profile</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundSecondary, // White background
    },
    scrollView: {
        flex: 1,
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
    input: {
        fontSize: 16,
        color: Colors.light.textPrimary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: Colors.light.cardBackground,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        borderRadius: borderRadius.md,
    },
    hint: {
        fontSize: 14,
        color: Colors.light.textSecondary,
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

export default EditProfileScreen;

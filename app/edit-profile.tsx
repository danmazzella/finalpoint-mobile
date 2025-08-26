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
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { spacing, borderRadius } from '../utils/styles';
import { router } from 'expo-router';

const EditProfileScreen = () => {
    const { user, updateProfile } = useAuth();
    const { showToast } = useSimpleToast();
    const { resolvedTheme } = useTheme();
    const [name, setName] = useState(user?.name || '');
    const [isLoading, setIsLoading] = useState(false);

    // Get current theme colors from universal palette
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors
    const universalStyles = createThemeStyles(currentColors);

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
            const result = await updateProfile(name.trim());
            if (result.success) {
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
                showToast(result.error || 'Failed to update profile. Please try again.', 'error');
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

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
        input: {
            fontSize: 16,
            color: currentColors.textPrimary,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            backgroundColor: currentColors.cardBackground,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            borderRadius: borderRadius.md,
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
    });

    return (
        <SafeAreaView style={universalStyles.container} edges={['top', 'left', 'right']}>
            <ScrollView style={universalStyles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
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
                            placeholderTextColor={currentColors.textSecondary}
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
                            <ActivityIndicator size="small" color={currentColors.textInverse} />
                        ) : (
                            <Text style={styles.submitButtonText}>Update Profile</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditProfileScreen;

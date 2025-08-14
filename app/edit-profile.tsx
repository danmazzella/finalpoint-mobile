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
import Avatar from '../src/components/Avatar';

const EditProfileScreen = () => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user, updateProfile } = useAuth();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();

    const scrollViewRef = useRef<ScrollView>(null);
    const nameInputRef = useRef<TextInput>(null);

    // Initialize name from user data
    React.useEffect(() => {
        if (user?.name) {
            setName(user.name);
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            showToast('Please enter a valid name', 'error');
            return;
        }

        if (name.trim() === user?.name) {
            showToast('No changes to save', 'info');
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateProfile(name.trim());
            if (result) {
                showToast('Profile updated successfully!', 'success');
                router.back();
            } else {
                showToast('Failed to update profile', 'error');
            }
        } catch (error) {
            showToast('Failed to update profile. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (name !== user?.name) {
            Alert.alert(
                'Cancel Changes',
                'Are you sure you want to cancel? Any unsaved changes will be lost.',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    { text: 'Cancel', style: 'destructive', onPress: () => router.back() }
                ]
            );
        } else {
            router.back();
        }
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
                                                Update your profile information
                                            </Text>
                                            <Text style={styles.tabletFeatures}>
                                                • Edit your display name{'\n'}
                                                • Keep your profile current{'\n'}
                                                • Maintain your identity{'\n'}
                                                • Stay connected with friends
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Right Column - Edit Profile Form */}
                                <View style={styles.tabletRightColumn}>
                                    <View style={styles.formSection}>
                                        <Text style={styles.formTitle}>Edit Profile</Text>
                                        <Text style={styles.formSubtitle}>
                                            Update your profile information below.
                                        </Text>

                                        {/* Profile Picture Section */}
                                        <View style={styles.avatarSection}>
                                            <Avatar
                                                src={user?.avatar}
                                                size="xl"
                                                fallback={user?.name?.[0] || 'U'}
                                            />
                                            <Text style={styles.avatarText}>
                                                Profile picture managed in Profile settings
                                            </Text>
                                        </View>

                                        {/* Name Field */}
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>Display Name</Text>
                                            <TextInput
                                                ref={nameInputRef}
                                                style={styles.input}
                                                placeholder="Enter your display name"
                                                placeholderTextColor={Colors.light.textSecondary}
                                                value={name}
                                                onChangeText={setName}
                                                autoCapitalize="words"
                                                autoCorrect={false}
                                                returnKeyType="done"
                                                onSubmitEditing={handleSaveProfile}
                                            />
                                        </View>

                                        {/* Action Buttons */}
                                        <View style={styles.buttonContainer}>
                                            <TouchableOpacity
                                                style={styles.saveButton}
                                                onPress={handleSaveProfile}
                                                disabled={isLoading}
                                                activeOpacity={0.8}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                                ) : (
                                                    <Text style={styles.saveButtonText}>Save Changes</Text>
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
                                    <Text style={styles.formTitle}>Edit Profile</Text>
                                    <Text style={styles.formSubtitle}>
                                        Update your profile information below.
                                    </Text>

                                    {/* Profile Picture Section */}
                                    <View style={styles.avatarSection}>
                                        <Avatar
                                            src={user?.avatar}
                                            size="xl"
                                            fallback={user?.name?.[0] || 'U'}
                                        />
                                        <Text style={styles.avatarText}>
                                            Profile picture managed in Profile settings
                                        </Text>
                                    </View>

                                    {/* Name Field */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Display Name</Text>
                                        <TextInput
                                            ref={nameInputRef}
                                            style={styles.input}
                                            placeholder="Enter your display name"
                                            placeholderTextColor={Colors.light.textSecondary}
                                            value={name}
                                            onChangeText={setName}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                            returnKeyType="done"
                                            onSubmitEditing={handleSaveProfile}
                                        />
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={handleSaveProfile}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                            ) : (
                                                <Text style={styles.saveButtonText}>Save Changes</Text>
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
    avatarSection: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatarText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        lineHeight: 18,
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
    buttonContainer: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    saveButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    saveButtonText: {
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

export default EditProfileScreen;

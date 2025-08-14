import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { authAPI, apiService } from '../../src/services/apiService';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Avatar from '../../src/components/Avatar';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import Colors from '../../constants/Colors';
import { spacing, borderRadius, shadows } from '../../utils/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useScreenSize } from '../../hooks/useScreenSize';

const ProfileScreen = () => {
    const { user, logout, refreshUser } = useAuth();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // Force re-render when avatar updates

    // Profile avatar state - fetched directly from API
    const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

    // Determine base URL based on environment
    const getBaseUrl = () => {
        // For development, use the local server
        // For production, use finalpoint.app
        // You can add environment detection logic here if needed
        return __DEV__ ? 'http://192.168.0.15:6075' : 'https://finalpoint.app';
    };

    // Fetch profile data directly from API when component mounts
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoadingAvatar(true);
                const response = await apiService.get('/users/profile');
                if (response.data.success && response.data.data) {
                    setProfileAvatar(response.data.data.avatar);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setIsLoadingAvatar(false);
            }
        };

        fetchProfileData();
    }, []);

    // Refresh user data from server
    const refreshUserData = async () => {
        try {
            await refreshUser();
            setRefreshKey(prev => prev + 1); // Force re-render

            // Also refresh profile data from API using the existing service
            try {
                const response = await apiService.get('/users/profile');
                if (response.data.success && response.data.data) {
                    setProfileAvatar(response.data.data.avatar);
                }
            } catch (profileError) {
                console.error('Error refreshing profile data:', profileError);
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    // Refresh user data when component mounts
    useEffect(() => {
        refreshUserData();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const handleAvatarUpload = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showToast('Permission to access camera roll is required!', 'error');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadAvatar(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showToast('Error selecting image. Please try again.', 'error');
        }
    };

    const uploadAvatar = async (imageAsset: ImagePicker.ImagePickerAsset) => {
        try {
            setUploadingAvatar(true);

            // Create form data
            const formData = new FormData();
            formData.append('avatar', {
                uri: imageAsset.uri,
                type: 'image/jpeg',
                name: 'avatar.jpg',
            } as any);

            // Upload avatar
            const response = await apiService.put('/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                showToast('Avatar updated successfully!', 'success');
                setProfileAvatar(response.data.data.avatar);
                setRefreshKey(prev => prev + 1); // Force re-render
            } else {
                showToast('Failed to update avatar. Please try again.', 'error');
            }
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            if (error.response?.status === 413) {
                showToast('Image file is too large. Please select a smaller image.', 'error');
            } else {
                showToast('Error uploading avatar. Please try again.', 'error');
            }
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            setUploadingAvatar(true);

            const response = await apiService.delete('/users/avatar');
            if (response.data.success) {
                showToast('Avatar removed successfully!', 'success');
                setProfileAvatar(null);
                setRefreshKey(prev => prev + 1); // Force re-render
            } else {
                showToast('Failed to remove avatar. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error removing avatar:', error);
            showToast('Error removing avatar. Please try again.', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const openWebApp = () => {
        const url = getBaseUrl();
        Linking.openURL(url);
    };

    const openInfoPage = () => {
        const url = `${getBaseUrl()}/info`;
        Linking.openURL(url);
    };

    const openTermsPage = () => {
        const url = `${getBaseUrl()}/terms`;
        Linking.openURL(url);
    };

    const openPrivacyPage = () => {
        const url = `${getBaseUrl()}/privacy`;
        Linking.openURL(url);
    };

    const openScoringPage = () => {
        const url = `${getBaseUrl()}/scoring`;
        Linking.openURL(url);
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.buttonPrimary} />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveContainer>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Profile</Text>
                        <Text style={styles.subtitle}>Manage your account and preferences</Text>
                    </View>

                    {/* Main Content - Responsive Layout */}
                    {screenSize === 'tablet' ? (
                        <View style={styles.tabletLayout}>
                            {/* Left Column - Profile Info & Avatar */}
                            <View style={styles.tabletLeftColumn}>
                                {/* Profile Information */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Profile Information</Text>
                                    <View style={styles.profileInfo}>
                                        <View style={styles.avatarContainer}>
                                            <Avatar
                                                size="xl"
                                                src={profileAvatar}
                                                fallback={user.name?.charAt(0).toUpperCase() || 'U'}
                                            />
                                            <View style={styles.avatarActions}>
                                                <TouchableOpacity
                                                    style={styles.avatarButton}
                                                    onPress={handleAvatarUpload}
                                                    disabled={uploadingAvatar}
                                                >
                                                    {uploadingAvatar ? (
                                                        <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                                    ) : (
                                                        <>
                                                            <Ionicons name="camera" size={16} color={Colors.light.textInverse} />
                                                            <Text style={styles.avatarButtonText}>Change</Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                                {profileAvatar && (
                                                    <TouchableOpacity
                                                        style={styles.avatarButtonSecondary}
                                                        onPress={handleRemoveAvatar}
                                                        disabled={uploadingAvatar}
                                                    >
                                                        <Ionicons name="trash" size={16} color={Colors.light.error} />
                                                        <Text style={styles.avatarButtonTextSecondary}>Remove</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{user.name}</Text>
                                            <Text style={styles.userEmail}>{user.email}</Text>
                                            <Text style={styles.userRole}>
                                                Role: {user.role || 'User'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Account Actions */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Account Actions</Text>
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => router.push('/edit-profile')}
                                        >
                                            <Ionicons name="create-outline" size={20} color={Colors.light.buttonPrimary} />
                                            <Text style={styles.actionButtonText}>Edit Profile</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => router.push('/change-password')}
                                        >
                                            <Ionicons name="key-outline" size={20} color={Colors.light.buttonPrimary} />
                                            <Text style={styles.actionButtonText}>Change Password</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => router.push('/delete-account')}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                                            <Text style={[styles.actionButtonText, { color: Colors.light.error }]}>
                                                Delete Account
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Right Column - Quick Links & Logout */}
                            <View style={styles.tabletRightColumn}>
                                {/* Quick Links */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Quick Links</Text>
                                    <View style={styles.quickLinks}>
                                        <TouchableOpacity
                                            style={styles.quickLink}
                                            onPress={openWebApp}
                                        >
                                            <Ionicons name="globe-outline" size={20} color={Colors.light.buttonPrimary} />
                                            <Text style={styles.quickLinkText}>Open Web App</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quickLink}
                                            onPress={openScoringPage}
                                        >
                                            <Ionicons name="help-circle-outline" size={20} color={Colors.light.buttonPrimary} />
                                            <Text style={styles.quickLinkText}>How Scoring Works</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quickLink}
                                            onPress={openInfoPage}
                                        >
                                            <Ionicons name="information-circle-outline" size={20} color={Colors.light.buttonPrimary} />
                                            <Text style={styles.quickLinkText}>About FinalPoint</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Legal & Support */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Legal & Support</Text>
                                    <View style={styles.legalLinks}>
                                        <TouchableOpacity
                                            style={styles.legalLink}
                                            onPress={openTermsPage}
                                        >
                                            <Ionicons name="document-text-outline" size={20} color={Colors.light.textSecondary} />
                                            <Text style={styles.legalLinkText}>Terms of Service</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.legalLink}
                                            onPress={openPrivacyPage}
                                        >
                                            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.light.textSecondary} />
                                            <Text style={styles.legalLinkText}>Privacy Policy</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Logout */}
                                <View style={styles.section}>
                                    <TouchableOpacity
                                        style={styles.logoutButton}
                                        onPress={handleLogout}
                                    >
                                        <Ionicons name="log-out-outline" size={20} color={Colors.light.textInverse} />
                                        <Text style={styles.logoutButtonText}>Logout</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* Mobile Layout (existing code) */
                        <>
                            {/* Profile Information */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Profile Information</Text>
                                <View style={styles.profileInfo}>
                                    <View style={styles.avatarContainer}>
                                        <Avatar
                                            size="xl"
                                            src={profileAvatar}
                                            fallback={user.name?.charAt(0).toUpperCase() || 'U'}
                                        />
                                        <View style={styles.avatarActions}>
                                            <TouchableOpacity
                                                style={styles.avatarButton}
                                                onPress={handleAvatarUpload}
                                                disabled={uploadingAvatar}
                                            >
                                                {uploadingAvatar ? (
                                                    <ActivityIndicator size="small" color={Colors.light.textInverse} />
                                                ) : (
                                                    <>
                                                        <Ionicons name="camera" size={16} color={Colors.light.textInverse} />
                                                        <Text style={styles.avatarButtonText}>Change</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            {profileAvatar && (
                                                <TouchableOpacity
                                                    style={styles.avatarButtonSecondary}
                                                    onPress={handleRemoveAvatar}
                                                    disabled={uploadingAvatar}
                                                >
                                                    <Ionicons name="trash" size={16} color={Colors.light.error} />
                                                    <Text style={styles.avatarButtonTextSecondary}>Remove</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>{user.name}</Text>
                                        <Text style={styles.userEmail}>{user.email}</Text>
                                        <Text style={styles.userRole}>
                                            Role: {user.role || 'User'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Account Actions */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Account Actions</Text>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => router.push('/edit-profile')}
                                    >
                                        <Ionicons name="create-outline" size={20} color={Colors.light.buttonPrimary} />
                                        <Text style={styles.actionButtonText}>Edit Profile</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => router.push('/change-password')}
                                    >
                                        <Ionicons name="key-outline" size={20} color={Colors.light.buttonPrimary} />
                                        <Text style={styles.actionButtonText}>Change Password</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => router.push('/delete-account')}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                                        <Text style={[styles.actionButtonText, { color: Colors.light.error }]}>
                                            Delete Account
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Quick Links */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Quick Links</Text>
                                <View style={styles.quickLinks}>
                                    <TouchableOpacity
                                        style={styles.quickLink}
                                        onPress={openWebApp}
                                    >
                                        <Ionicons name="globe-outline" size={20} color={Colors.light.buttonPrimary} />
                                        <Text style={styles.quickLinkText}>Open Web App</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.quickLink}
                                        onPress={openScoringPage}
                                    >
                                        <Ionicons name="help-circle-outline" size={20} color={Colors.light.buttonPrimary} />
                                        <Text style={styles.quickLinkText}>How Scoring Works</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.quickLink}
                                        onPress={openInfoPage}
                                    >
                                        <Ionicons name="information-circle-outline" size={20} color={Colors.light.buttonPrimary} />
                                        <Text style={styles.quickLinkText}>About FinalPoint</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Legal & Support */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Legal & Support</Text>
                                <View style={styles.legalLinks}>
                                    <TouchableOpacity
                                        style={styles.legalLink}
                                        onPress={openTermsPage}
                                    >
                                        <Ionicons name="document-text-outline" size={20} color={Colors.light.textSecondary} />
                                        <Text style={styles.legalLinkText}>Terms of Service</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.legalLink}
                                        onPress={openPrivacyPage}
                                    >
                                        <Ionicons name="shield-checkmark-outline" size={20} color={Colors.light.textSecondary} />
                                        <Text style={styles.legalLinkText}>Privacy Policy</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Logout */}
                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={styles.logoutButton}
                                    onPress={handleLogout}
                                >
                                    <Ionicons name="log-out-outline" size={20} color={Colors.light.textInverse} />
                                    <Text style={styles.logoutButtonText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ScrollView>
            </ResponsiveContainer>
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
    scrollContent: {
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    section: {
        backgroundColor: Colors.light.cardBackground,
        marginHorizontal: spacing.md,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.md,
    },
    profileInfo: {
        alignItems: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    avatarButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    avatarButtonText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: '600',
    },
    avatarButtonSecondary: {
        backgroundColor: Colors.light.backgroundPrimary,
        borderWidth: 1,
        borderColor: Colors.light.error,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    avatarButtonTextSecondary: {
        color: Colors.light.error,
        fontSize: 14,
        fontWeight: '600',
    },
    userInfo: {
        alignItems: 'center',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    userEmail: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginBottom: spacing.xs,
    },
    userRole: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontStyle: 'italic',
    },
    actionButtons: {
        gap: spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: Colors.light.backgroundPrimary,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    quickLinks: {
        gap: spacing.md,
    },
    quickLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: Colors.light.backgroundPrimary,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    quickLinkText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    legalLinks: {
        gap: spacing.md,
    },
    legalLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: Colors.light.backgroundPrimary,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    legalLinkText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textSecondary,
    },
    logoutButton: {
        backgroundColor: Colors.light.error,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    logoutButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    // Tablet-specific styles
    tabletLayout: {
        flexDirection: 'row',
        gap: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    tabletLeftColumn: {
        flex: 2,
        gap: spacing.lg,
    },
    tabletRightColumn: {
        flex: 1,
        gap: spacing.lg,
    },
});

export default ProfileScreen;

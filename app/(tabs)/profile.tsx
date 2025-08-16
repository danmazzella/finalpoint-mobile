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
import { authAPI, apiService, getBaseUrl } from '../../src/services/apiService';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Avatar from '../../src/components/Avatar';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import Colors from '../../constants/Colors';
import { spacing, borderRadius } from '../../utils/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
    const { user, logout, refreshUser } = useAuth();
    const { showToast } = useSimpleToast();
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // Force re-render when avatar updates

    // Profile avatar state - fetched directly from API
    const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

    // Remove the conflicting getBaseUrl function - use the one from apiService

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

    const handleAboutFinalPoint = async () => {
        try {
            const url = `${getBaseUrl()}/info`;
            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
            } else {
                showToast('Unable to open link', 'error');
            }
        } catch (error) {
            console.error('Error opening About FinalPoint link:', error);
            showToast('Unable to open link', 'error');
        }
    };

    const handlePrivacyPolicy = async () => {
        try {
            const url = `${getBaseUrl()}/privacy`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                showToast('Unable to open Privacy Policy link', 'error');
            }
        } catch (error) {
            console.error('Error opening Privacy Policy link:', error);
            showToast('Unable to open link', 'error');
        }
    };

    const handleTermsOfService = async () => {
        try {
            const url = `${getBaseUrl()}/terms`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                showToast('Unable to open Terms of Service link', 'error');
            }
        } catch (error) {
            console.error('Error opening Terms of Service link:', error);
            showToast('Unable to open link', 'error');
        }
    };

    const handleHelpAndSupport = async () => {
        try {
            const emailUrl = 'mailto:dan@mazzella.me?subject=FinalPoint%20Support%20Request';
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

    const handleAvatarUpload = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];

                // Check file size (5MB limit)
                if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    return;
                }

                setUploadingAvatar(true);

                const formData = new FormData();
                formData.append('avatar', {
                    uri: asset.uri,
                    type: 'image/jpeg',
                    name: 'avatar.jpg',
                } as any);

                const response = await apiService.put('/users/avatar', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.data.success) {
                    showToast('Avatar updated successfully!', 'success');

                    // Refresh user data from API to get the updated avatar
                    await refreshUserData();

                    // Also update the local profile avatar state using the API service
                    try {
                        const profileResponse = await apiService.get('/users/profile');
                        if (profileResponse.data.success && profileResponse.data.data) {
                            setProfileAvatar(profileResponse.data.data.avatar);
                        }
                    } catch (profileError) {
                        console.error('Error refreshing profile data:', profileError);
                    }
                } else {
                    showToast('Failed to update avatar', 'error');
                }
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToast('Failed to upload avatar', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={handleAvatarUpload}
                        disabled={uploadingAvatar}
                    >
                        {uploadingAvatar ? (
                            <ActivityIndicator size="small" color={Colors.light.textInverse} />
                        ) : (
                            <Avatar
                                key={refreshKey} // Force re-render when avatar updates
                                src={profileAvatar || user?.avatar}
                                size="xl"
                                fallback={user?.name?.charAt(0).toUpperCase() || 'U'}
                            />
                        )}
                        <View style={styles.avatarOverlay}>
                            <Ionicons name="camera" size={20} color={Colors.light.textInverse} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <Text style={styles.avatarHint}>Tap to change avatar</Text>


                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/edit-profile')}
                    >
                        <Text style={styles.menuItemText}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/change-password')}
                    >
                        <Text style={styles.menuItemText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/notifications')}
                    >
                        <Text style={styles.menuItemText}>Notification Settings</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.deleteAccountItem]}
                        onPress={() => router.push('/delete-account')}
                    >
                        <Text style={styles.deleteAccountText}>Delete Account</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.light.error} />
                    </TouchableOpacity>

                    {user?.role === 'admin' && (
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => router.push('/admin')}
                        >
                            <Text style={styles.menuItemText}>Admin Dashboard</Text>
                            <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleAboutFinalPoint}
                    >
                        <Text style={styles.menuItemText}>About FinalPoint</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
                        <Text style={styles.menuItemText}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleTermsOfService}>
                        <Text style={styles.menuItemText}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleHelpAndSupport}>
                        <Text style={styles.menuItemText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>FinalPoint v1.0.0</Text>
                    <Text style={styles.footerSubtext}>F1 Prediction Game</Text>
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
        backgroundColor: Colors.light.cardBackground,
        padding: spacing.lg,
        alignItems: 'center',
        minHeight: 64,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.light.primary,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.cardBackground,
    },
    avatarHint: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginTop: spacing.xs,
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
    },
    section: {
        marginTop: spacing.lg,
        backgroundColor: Colors.light.cardBackground,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        padding: spacing.lg,
        paddingBottom: spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
    },
    menuItemText: {
        fontSize: 16,
        color: Colors.light.textPrimary,
    },
    logoutButton: {
        backgroundColor: Colors.light.error,
        margin: spacing.lg,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        padding: spacing.lg,
        marginTop: spacing.lg,
    },
    footerText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.xs,
    },
    footerSubtext: {
        fontSize: 12,
        color: Colors.light.textTertiary,
    },
    deleteAccountItem: {
        borderBottomWidth: 0,
    },
    deleteAccountText: {
        fontSize: 16,
        color: Colors.light.error,
    },

});

export default ProfileScreen;

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
import { useTheme } from '../../src/context/ThemeContext';
import { lightColors, darkColors } from '../../src/constants/Colors';
import { createThemeStyles } from '../../src/styles/universalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { contactConfig } from '../../config/environment';

const ProfileScreen = () => {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useSimpleToast();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when avatar updates

  // Get current theme colors from universal palette
  const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

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
          onPress: () => {
            logout();
            // Redirect to dashboard after logout
            router.replace('/(tabs)');
          },
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
      const emailUrl = `mailto:${contactConfig.email}?subject=FinalPoint%20Support%20Request`;
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

  // Create universal styles with current theme colors
  const universalStyles = createThemeStyles(currentColors);

  // Create profile-specific styles
  const styles = StyleSheet.create({
    // Profile-specific styles that extend universal styles
    avatarContainer: {
      position: 'relative',
      marginBottom: 12,
    },
    avatarOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: currentColors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: currentColors.cardBackground,
    },
    avatarHint: {
      fontSize: 12,
      color: currentColors.textSecondary,
      marginTop: 4,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentColors.textPrimary,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: currentColors.textSecondary,
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentColors.borderMedium,
    },
    menuItemText: {
      fontSize: 16,
      color: currentColors.textPrimary,
    },
    logoutButton: {
      backgroundColor: currentColors.error,
      margin: 16,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    logoutButtonText: {
      color: currentColors.textInverse,
      fontSize: 16,
      fontWeight: 'bold',
    },
    deleteAccountText: {
      fontSize: 16,
      color: currentColors.error,
    },
  });

  return (
    <SafeAreaView style={universalStyles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={universalStyles.scrollView}>
        <View style={universalStyles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarUpload}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={currentColors.textInverse} />
            ) : (
              <Avatar
                key={refreshKey} // Force re-render when avatar updates
                src={profileAvatar || user?.avatar}
                size="xl"
                fallback={user?.name?.charAt(0).toUpperCase() || 'U'}
              />
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={20} color={currentColors.textInverse} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.avatarHint}>Tap to change avatar</Text>


        </View>

        <View style={universalStyles.section}>
          <Text style={universalStyles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={16} color={currentColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/change-password')}
          >
            <Text style={styles.menuItemText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={16} color={currentColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
          >
            <Text style={styles.menuItemText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={currentColors.textSecondary} />
          </TouchableOpacity>

          {/* Theme Toggle */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={toggleTheme}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemText}>Theme</Text>
              <Text style={[styles.menuItemText, { fontSize: 12, color: currentColors.textSecondary }]}>
                Switch between light and dark mode
              </Text>
            </View>
            <View style={{
              width: 44,
              height: 24,
              backgroundColor: resolvedTheme === 'dark' ? currentColors.primary : currentColors.borderLight,
              borderRadius: 12,
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}>
              <View style={{
                width: 20,
                height: 20,
                backgroundColor: currentColors.textInverse,
                borderRadius: 10,
                alignSelf: resolvedTheme === 'dark' ? 'flex-end' : 'flex-start',
              }} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/delete-account')}
          >
            <Text style={styles.deleteAccountText}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={16} color={currentColors.error} />
          </TouchableOpacity>

          {user?.role === 'admin' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/admin')}
            >
              <Text style={styles.menuItemText}>Admin Dashboard</Text>
              <Ionicons name="chevron-forward" size={16} color={currentColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={universalStyles.section}>
          <Text style={universalStyles.sectionTitle}>App</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAboutFinalPoint}
          >
            <Text style={styles.menuItemText}>About FinalPoint</Text>
            <Ionicons name="chevron-forward" size={16} color={currentColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={currentColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTermsOfService}>
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color={currentColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleHelpAndSupport}>
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={currentColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={universalStyles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={universalStyles.footer}>
          <Text style={universalStyles.footerText}>FinalPoint v1.0.0</Text>
          <Text style={[universalStyles.footerText, { fontSize: 12 }]}>F1 Prediction Game</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
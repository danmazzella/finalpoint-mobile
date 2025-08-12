import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { notificationsAPI } from '../src/services/apiService';
import { NotificationPreferences } from '../src/types';
import { useNotificationContext } from '../components/NotificationProvider';
import Colors from '../constants/Colors';
import { spacing, borderRadius } from '../utils/styles';
import { router } from 'expo-router';
import { shouldEnableNotifications } from '../utils/environment';
import { getEasProjectId } from '../config/firebase.config';

const NotificationSettingsScreen = () => {
  const { user } = useAuth();

  // Always call the hook (React requirement)
  const notificationContext = useNotificationContext();

  // Check if notifications are enabled
  const notificationsEnabled = shouldEnableNotifications();

  const {
    pushToken,
    isSupported,
    error: pushError,
    isRegistering,
    register,
    sendTokenToServer,
    showLocalNotification,
  } = notificationContext;

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailReminders: true,
    emailScoreUpdates: true,
    pushReminders: true,
    pushScoreUpdates: true,
    emailReminder5Days: true,
    emailReminder3Days: true,
    emailReminder1Day: true,
    pushReminder5Days: true,
    pushReminder3Days: true,
    pushReminder1Day: true,
    emailOther: true,
    pushOther: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSendingToken, setIsSendingToken] = useState(false);


  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsAPI.getPreferences();
      if (response.data.success) {
        // Convert database values (1/0) to proper booleans
        const rawData = response.data.data;
        console.log('Raw notification preferences from backend:', rawData);

        setPreferences({
          emailReminders: Boolean(rawData.emailReminders),
          emailScoreUpdates: Boolean(rawData.emailScoreUpdates),
          pushReminders: Boolean(rawData.pushReminders),
          pushScoreUpdates: Boolean(rawData.pushScoreUpdates),
          emailReminder5Days: Boolean(rawData.emailReminder5Days ?? true),
          emailReminder3Days: Boolean(rawData.emailReminder3Days ?? true),
          emailReminder1Day: Boolean(rawData.emailReminder1Day ?? true),
          pushReminder5Days: Boolean(rawData.pushReminder5Days ?? true),
          pushReminder3Days: Boolean(rawData.pushReminder3Days ?? true),
          pushReminder1Day: Boolean(rawData.pushReminder1Day ?? true),
          emailOther: Boolean(rawData.emailOther ?? true),
          pushOther: Boolean(rawData.pushOther ?? true)
        });

        console.log('Processed notification preferences:', {
          emailReminders: Boolean(rawData.emailReminders),
          emailScoreUpdates: Boolean(rawData.emailScoreUpdates),
          pushReminders: Boolean(rawData.pushReminders),
          pushScoreUpdates: Boolean(rawData.pushScoreUpdates),
          emailReminder5Days: Boolean(rawData.emailReminder5Days ?? true),
          emailReminder3Days: Boolean(rawData.emailReminder3Days ?? true),
          emailReminder1Day: Boolean(rawData.emailReminder1Day ?? true),
          pushReminder5Days: Boolean(rawData.pushReminder5Days ?? true),
          pushReminder3Days: Boolean(rawData.pushReminder3Days ?? true),
          pushReminder1Day: Boolean(rawData.pushReminder1Day ?? true),
          emailOther: Boolean(rawData.emailOther ?? true),
          pushOther: Boolean(rawData.pushOther ?? true)
        });
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError('Failed to load notification preferences. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);

    try {
      const response = await notificationsAPI.updatePreferences(preferences);
      if (response.data.success) {
        Alert.alert('Success', 'Notification preferences updated successfully!');
      } else {
        Alert.alert('Error', response.data.error || 'Failed to update preferences');
      }
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        Alert.alert('Error', 'Unable to connect to server. Please check your internet connection.');
      } else {
        Alert.alert('Error', 'Failed to save notification preferences');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterPushNotifications = async () => {
    try {
      await register();
      Alert.alert('Success', 'Successfully registered for push notifications!');
    } catch (err) {
      Alert.alert('Error', 'Failed to register for push notifications');
    }
  };

  const handleSendTokenToServer = async () => {
    if (!pushToken) {
      Alert.alert('Error', 'No push token available');
      return;
    }

    try {
      setIsSendingToken(true);
      await sendTokenToServer();
      Alert.alert('Success', 'Push token sent to server successfully!');
    } catch (error: any) {
      console.error('Error sending token to server:', error);
      Alert.alert('Error', 'Failed to send push token to server');
    } finally {
      setIsSendingToken(false);
    }
  };

  const testNotification = async (type: 'email' | 'push') => {
    try {
      if (type === 'push') {
        await showLocalNotification(
          'Test Push Notification',
          'This is a test push notification from FinalPoint!',
          { test: true, type: 'test' }
        );
        Alert.alert('Success', 'Test push notification sent!');
        return;
      }

      const response = await notificationsAPI.testEmail();
      if (response.data.success) {
        Alert.alert('Success', `Test ${type} notification sent successfully!`);
      } else {
        Alert.alert('Error', `Failed to send test ${type} notification`);
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        Alert.alert('Error', 'Unable to connect to server. Please check your internet connection.');
      } else {
        Alert.alert('Error', `Failed to send test ${type} notification`);
      }
    }
  };

  const testPushRegistration = async () => {
    try {
      // Only proceed if notifications are enabled
      if (!shouldEnableNotifications()) {
        Alert.alert('Info', 'Push notifications are disabled in Expo Go. Use a development build to test.');
        return;
      }

      // Dynamically import required modules
      const [Device, Notifications] = await Promise.all([
        import('expo-device'),
        import('expo-notifications')
      ]);

      // Test 1: Check if device supports notifications
      console.log('📱 Device supports notifications');

      // Test 2: Check current notification permissions
      const { status: existingStatus } = await Notifications.default.getPermissionsAsync();
      console.log(`🔐 Current notification status: ${existingStatus}`);

      // Test 3: Check EAS project ID
      const projectId = getEasProjectId();
      console.log('🔑 EAS Project ID verified');

      // Test 4: Try to get push token
      console.log('🎯 Attempting to get push token...');
      const token = await Notifications.default.getExpoPushTokenAsync({
        projectId: projectId!,
      });
      console.log('✅ Push token obtained successfully');

      Alert.alert('Success', 'Push registration test passed!');
    } catch (error: any) {
      console.error(`❌ Push registration failed: ${error.message}`);
      Alert.alert('Error', `Push registration failed: ${error.message}`);
    }
  };

  // Show disabled message if notifications are not available
  if (!notificationsEnabled) {
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
            <Text style={styles.headerTitle}>Notification Settings</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Disabled Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications Disabled</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Expo Go Limitation</Text>
                <Text style={styles.settingDescription}>
                  Push notifications are not available in Expo Go. To test notification features, please use a development build.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.fullScreenErrorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPreferences}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Email Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Race Reminders</Text>
              <Text style={styles.settingDescription}>
                Get reminded 5, 3, and 1 day before races if you haven&apos;t made picks
              </Text>
            </View>
            <Switch
              value={preferences.emailReminders}
              onValueChange={(value) => handlePreferenceChange('emailReminders', value)}
              trackColor={{ false: Colors.light.gray300, true: Colors.light.primary }}
              thumbColor={preferences.emailReminders ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          {/* 5-Day Reminder */}
          <View style={[styles.settingItem, { marginLeft: 20 }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>5-Day Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded 5 days before races
              </Text>
            </View>
            <Switch
              value={preferences.emailReminder5Days}
              onValueChange={(value) => handlePreferenceChange('emailReminder5Days', value)}
              disabled={!preferences.emailReminders}
              trackColor={{ false: Colors.light.gray300, true: preferences.emailReminders ? Colors.light.primary : Colors.light.gray400 }}
              thumbColor={preferences.emailReminder5Days && preferences.emailReminders ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          {/* 3-Day Reminder */}
          <View style={[styles.settingItem, { marginLeft: 20 }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>3-Day Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded 3 days before races
              </Text>
            </View>
            <Switch
              value={preferences.emailReminder3Days}
              onValueChange={(value) => handlePreferenceChange('emailReminder3Days', value)}
              disabled={!preferences.emailReminders}
              trackColor={{ false: Colors.light.gray300, true: preferences.emailReminders ? Colors.light.primary : Colors.light.gray400 }}
              thumbColor={preferences.emailReminder3Days && preferences.emailReminders ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          {/* 1-Day Reminder */}
          <View style={[styles.settingItem, { marginLeft: 20 }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>1-Day Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded 1 day before races
              </Text>
            </View>
            <Switch
              value={preferences.emailReminder1Day}
              onValueChange={(value) => handlePreferenceChange('emailReminder1Day', value)}
              disabled={!preferences.emailReminders}
              trackColor={{ false: Colors.light.gray300, true: preferences.emailReminders ? Colors.light.primary : Colors.light.gray400 }}
              thumbColor={preferences.emailReminder1Day && preferences.emailReminders ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Score Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified when your scores are updated after races
              </Text>
            </View>
            <Switch
              value={preferences.emailScoreUpdates}
              onValueChange={(value) => handlePreferenceChange('emailScoreUpdates', value)}
              trackColor={{ false: Colors.light.gray300, true: Colors.light.primary }}
              thumbColor={preferences.emailScoreUpdates ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          {/* Other Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Other Notifications</Text>
              <Text style={styles.settingDescription}>
                Welcome messages, league invitations, and custom messages
              </Text>
            </View>
            <Switch
              value={preferences.emailOther}
              onValueChange={(value) => handlePreferenceChange('emailOther', value)}
              trackColor={{ false: Colors.light.gray300, true: Colors.light.primary }}
              thumbColor={preferences.emailOther ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>
        </View>

        {/* Push Notification Setup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notification Setup</Text>
          <Text style={styles.sectionDescription}>
            Register for push notifications to receive reminders and updates directly on your device
          </Text>

          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, pushToken ? styles.statusSuccess : styles.statusWarning]}>
              {!isSupported
                ? 'Push notifications not available'
                : pushToken
                  ? 'Push notifications registered'
                  : 'Push notifications not registered'}
            </Text>
          </View>

          {!isSupported && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Your device supports local notifications (as shown by the test below),
                but push notification registration failed. This is common and doesn&apos;t
                affect the app&apos;s functionality.
              </Text>
            </View>
          )}

          {pushError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{pushError}</Text>
            </View>
          )}

          {pushToken && (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Push Token:</Text>
              <Text style={styles.tokenText} numberOfLines={2}>
                {pushToken}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                console.log('🔘 Button pressed!');
                console.log('📱 isSupported:', isSupported);
                console.log('⏳ isRegistering:', isRegistering);
                console.log('🔑 register function:', typeof register);
                try {
                  register();
                } catch (error) {
                  console.error('❌ Error calling register:', error);
                }
              }}
              disabled={isRegistering || !isSupported}
            >
              <Text style={styles.buttonText}>
                {isRegistering ? 'Registering...' : 'Register for Push Notifications'}
              </Text>
            </TouchableOpacity>

            {pushToken && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSendTokenToServer}
                disabled={isSendingToken}
              >
                <Text style={styles.buttonText}>
                  {isSendingToken ? 'Sending...' : 'Send Token to Server'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Test button to verify TouchableOpacity is working */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.light.warning }]}
              onPress={() => {
                console.log('🧪 Test button pressed!');
                Alert.alert('Test', 'TouchableOpacity is working!');
              }}
            >
              <Text style={styles.buttonText}>Test Button (Debug)</Text>
            </TouchableOpacity>

            {/* Push Registration Test Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.light.info }]}
              onPress={testPushRegistration}
            >
              <Text style={styles.buttonText}>Test Push Registration</Text>
            </TouchableOpacity>


          </View>
        </View>

        {/* Push Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notification Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Race Reminders</Text>
              <Text style={styles.settingDescription}>
                Get reminded 5, 3, and 1 day before races if you haven&apos;t made picks
              </Text>
            </View>
            <Switch
              value={preferences.pushReminders}
              onValueChange={(value) => handlePreferenceChange('pushReminders', value)}
              trackColor={{ false: Colors.light.gray300, true: Colors.light.primary }}
              thumbColor={preferences.pushReminders ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          {/* 5-Day Reminder */}
          <View style={[styles.settingItem, { marginLeft: 20 }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>5-Day Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded 5 days before races
              </Text>
            </View>
            <Switch
              value={preferences.pushReminder5Days}
              onValueChange={(value) => handlePreferenceChange('pushReminder5Days', value)}
              disabled={!preferences.pushReminders}
              trackColor={{ false: Colors.light.gray300, true: preferences.pushReminders ? Colors.light.primary : Colors.light.gray400 }}
              thumbColor={preferences.pushReminder5Days && preferences.pushReminders ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          {/* 3-Day Reminder */}
          <View style={[styles.settingItem, { marginLeft: 20 }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>3-Day Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded 3 days before races
              </Text>
            </View>
            <Switch
              value={preferences.pushReminder3Days}
              onValueChange={(value) => handlePreferenceChange('pushReminder3Days', value)}
              disabled={!preferences.pushReminders}
              trackColor={{ false: Colors.light.gray300, true: preferences.pushReminders ? Colors.light.primary : Colors.light.gray400 }}
              thumbColor={preferences.pushReminder3Days && preferences.pushReminders ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          {/* 1-Day Reminder */}
          <View style={[styles.settingItem, { marginLeft: 20 }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>1-Day Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded 1 day before races
              </Text>
            </View>
            <Switch
              value={preferences.pushReminder1Day}
              onValueChange={(value) => handlePreferenceChange('pushReminder1Day', value)}
              disabled={!preferences.pushReminders}
              trackColor={{ false: Colors.light.gray300, true: preferences.pushReminders ? Colors.light.primary : Colors.light.gray400 }}
              thumbColor={preferences.pushReminder1Day && preferences.pushReminders ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Score Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified when your scores are updated after races
              </Text>
            </View>
            <Switch
              value={preferences.pushScoreUpdates}
              onValueChange={(value) => handlePreferenceChange('pushScoreUpdates', value)}
              trackColor={{ false: Colors.light.gray300, true: Colors.light.primary }}
              thumbColor={preferences.pushScoreUpdates ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>

          {/* Other Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Other Notifications</Text>
              <Text style={styles.settingDescription}>
                Welcome messages, league invitations, and custom messages
              </Text>
            </View>
            <Switch
              value={preferences.pushOther}
              onValueChange={(value) => handlePreferenceChange('pushOther', value)}
              trackColor={{ false: Colors.light.gray300, true: Colors.light.primary }}
              thumbColor={preferences.pushOther ? Colors.light.textInverse : Colors.light.gray100}
            />
          </View>
        </View>

        {/* Test Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <Text style={styles.sectionDescription}>
            Send test notifications to verify your settings are working correctly
          </Text>

          <View style={styles.testButtons}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => testNotification('email')}
            >
              <Text style={styles.testButtonText}>Test Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={() => testNotification('push')}
            >
              <Text style={styles.testButtonText}>Test Push</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={savePreferences}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.light.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>Save Preferences</Text>
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
    backgroundColor: Colors.light.backgroundPrimary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundPrimary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  fullScreenErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundPrimary,
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.error,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: Colors.light.textInverse,
    fontSize: 16,
    fontWeight: '600',
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
  section: {
    backgroundColor: Colors.light.cardBackground,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.textPrimary,
    marginBottom: spacing.md,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  testButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  testButtonText: {
    color: Colors.light.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  saveSection: {
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.light.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: borderRadius.sm,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginRight: spacing.sm,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusSuccess: {
    color: Colors.light.success,
  },
  statusWarning: {
    color: Colors.light.warning,
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
  },
  tokenContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  buttonContainer: {
    marginTop: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.light.success,
  },
  buttonText: {
    color: Colors.light.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },

});

export default NotificationSettingsScreen;

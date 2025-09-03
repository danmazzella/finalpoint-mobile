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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { notificationsAPI } from '../src/services/apiService';
import { NotificationPreferences } from '../src/types';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { spacing, borderRadius } from '../utils/styles';
import { router } from 'expo-router';
import { shouldEnableNotifications } from '../utils/environment';

const NotificationSettingsScreen = () => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  // Get current theme colors from universal palette
  const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

  // Create universal styles with current theme colors
  const universalStyles = createThemeStyles(currentColors);

  // Check if notifications are supported in this environment
  const notificationsSupported = shouldEnableNotifications();

  // Safely handle notification context - only use if available
  const [showLocalNotification, setShowLocalNotification] = useState<((title: string, body: string) => Promise<void>) | undefined>(undefined);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailReminders: true,
    emailScoreUpdates: true,
    pushReminders: true,
    pushScoreUpdates: true,
    emailReminder5Days: true,
    emailReminder3Days: true,
    emailReminder1Day: true,
    emailReminder1Hour: true,
    pushReminder5Days: true,
    pushReminder3Days: true,
    pushReminder1Day: true,
    pushReminder1Hour: true,
    emailOther: true,
    pushOther: true,
    pushChatMessages: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        setPreferences({
          emailReminders: Boolean(rawData.emailReminders),
          emailScoreUpdates: Boolean(rawData.emailScoreUpdates),
          pushReminders: Boolean(rawData.pushReminders),
          pushScoreUpdates: Boolean(rawData.pushScoreUpdates),
          emailReminder5Days: Boolean(rawData.emailReminder5Days ?? true),
          emailReminder3Days: Boolean(rawData.emailReminder3Days ?? true),
          emailReminder1Day: Boolean(rawData.emailReminder1Day ?? true),
          emailReminder1Hour: Boolean(rawData.emailReminder1Hour ?? true),
          pushReminder5Days: Boolean(rawData.pushReminder5Days ?? true),
          pushReminder3Days: Boolean(rawData.pushReminder3Days ?? true),
          pushReminder1Day: Boolean(rawData.pushReminder1Day ?? true),
          pushReminder1Hour: Boolean(rawData.pushReminder1Hour ?? true),
          emailOther: Boolean(rawData.emailOther ?? true),
          pushOther: Boolean(rawData.pushOther ?? true),
          pushChatMessages: Boolean(rawData.pushChatMessages ?? true)
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

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Convert boolean values to 1/0 for database
      const dataToSend = Object.fromEntries(
        Object.entries(preferences).map(([key, value]) => [key, value ? 1 : 0])
      );

      const response = await notificationsAPI.updatePreferences(dataToSend);
      if (response.data.success) {
        Alert.alert('Success', 'Notification preferences updated successfully!');
      } else {
        setError('Failed to update preferences. Please try again.');
      }
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError('Failed to save preferences. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!notificationsSupported) {
      Alert.alert(
        'Notifications Not Supported',
        'Push notifications are not available in Expo Go. Please use a development build or production build to test notifications.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (showLocalNotification) {
      try {
        await showLocalNotification('Test Notification', 'This is a test notification from FinalPoint!');
        Alert.alert('Success', 'Test notification sent!');
      } catch (error) {
        console.error('Error sending test notification:', error);
        Alert.alert('Error', 'Failed to send test notification. Please try again.');
      }
    }
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: currentColors.borderLight,
      backgroundColor: currentColors.cardBackground,
    },
    backButton: {
      marginRight: spacing.md,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentColors.textPrimary,
    },
    content: {
      padding: spacing.lg,
    },
    description: {
      fontSize: 16,
      color: currentColors.textSecondary,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    section: {
      backgroundColor: currentColors.cardBackground,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: currentColors.borderLight,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.textPrimary,
      marginBottom: spacing.md,
    },
    preferenceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: currentColors.borderLight,
    },
    preferenceRowLast: {
      borderBottomWidth: 0,
    },
    preferenceLabel: {
      fontSize: 16,
      color: currentColors.textPrimary,
      flex: 1,
      marginRight: spacing.md,
    },
    preferenceDescription: {
      fontSize: 14,
      color: currentColors.textSecondary,
      marginTop: spacing.xs,
    },
    saveButton: {
      backgroundColor: currentColors.primary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    saveButtonDisabled: {
      backgroundColor: currentColors.borderMedium,
    },
    saveButtonText: {
      color: currentColors.textInverse,
      fontSize: 16,
      fontWeight: 'bold',
    },
    testButton: {
      backgroundColor: currentColors.secondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    testButtonText: {
      color: currentColors.textInverse,
      fontSize: 16,
      fontWeight: 'bold',
    },
    errorContainer: {
      backgroundColor: currentColors.error + '20',
      borderWidth: 1,
      borderColor: currentColors.error,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    errorText: {
      color: currentColors.error,
      textAlign: 'center',
    },
    warningContainer: {
      backgroundColor: currentColors.warning + '20',
      borderWidth: 1,
      borderColor: currentColors.warning,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    warningText: {
      color: currentColors.warning,
      textAlign: 'center',
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={universalStyles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.section}>
            <ActivityIndicator size="large" color={currentColors.primary} />
            <Text style={styles.description}>Loading preferences...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Notification Settings</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Customize how you receive notifications from FinalPoint.
          </Text>

          {/* Environment Warning */}
          {!notificationsSupported && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ Push notifications are not available in Expo Go. Please use a development build or production build to test push notifications.
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email Notifications</Text>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>5-Day Reminder</Text>
                <Text style={styles.preferenceDescription}>Get reminded 5 days before a race</Text>
              </View>
              <Switch
                value={preferences.emailReminder5Days}
                onValueChange={(value) => handlePreferenceChange('emailReminder5Days', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.emailReminder5Days ? currentColors.primary : currentColors.borderMedium}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>3-Day Reminder</Text>
                <Text style={styles.preferenceDescription}>Get reminded 3 days before a race</Text>
              </View>
              <Switch
                value={preferences.emailReminder3Days}
                onValueChange={(value) => handlePreferenceChange('emailReminder3Days', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.emailReminder3Days ? currentColors.primary : currentColors.borderMedium}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>1-Day Reminder</Text>
                <Text style={styles.preferenceDescription}>Get reminded 1 day before a race</Text>
              </View>
              <Switch
                value={preferences.emailReminder1Day}
                onValueChange={(value) => handlePreferenceChange('emailReminder1Day', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.emailReminder1Day ? currentColors.primary : currentColors.borderMedium}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>1-Hour Reminder</Text>
                <Text style={styles.preferenceDescription}>Get reminded 1 hour before a race</Text>
              </View>
              <Switch
                value={preferences.emailReminder1Hour}
                onValueChange={(value) => handlePreferenceChange('emailReminder1Hour', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.emailReminder1Hour ? currentColors.primary : currentColors.borderMedium}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>Score Updates</Text>
                <Text style={styles.preferenceDescription}>Get notified when race results are posted</Text>
              </View>
              <Switch
                value={preferences.emailScoreUpdates}
                onValueChange={(value) => handlePreferenceChange('emailScoreUpdates', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.emailScoreUpdates ? currentColors.primary : currentColors.borderMedium}
              />
            </View>

            <View style={[styles.preferenceRow, styles.preferenceRowLast]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>Other Updates</Text>
                <Text style={styles.preferenceDescription}>Receive other important updates</Text>
              </View>
              <Switch
                value={preferences.emailOther}
                onValueChange={(value) => handlePreferenceChange('emailOther', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.emailOther ? currentColors.primary : currentColors.borderMedium}
              />
            </View>
          </View>

          {/* Push Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>5-Day Reminder</Text>
                <Text style={styles.preferenceDescription}>Get reminded 5 days before a race</Text>
              </View>
              <Switch
                value={preferences.pushReminder5Days}
                onValueChange={(value) => handlePreferenceChange('pushReminder5Days', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.pushReminder5Days ? currentColors.primary : currentColors.borderMedium}
                disabled={!notificationsSupported}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>3-Day Reminder</Text>
                <Text style={styles.preferenceDescription}>Get reminded 3 days before a race</Text>
              </View>
              <Switch
                value={preferences.pushReminder3Days}
                onValueChange={(value) => handlePreferenceChange('pushReminder3Days', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.pushReminder3Days ? currentColors.primary : currentColors.borderMedium}
                disabled={!notificationsSupported}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>1-Day Reminder</Text>
                <Text style={styles.preferenceDescription}>Get reminded 1 day before a race</Text>
              </View>
              <Switch
                value={preferences.pushReminder1Day}
                onValueChange={(value) => handlePreferenceChange('pushReminder1Day', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.pushReminder1Day ? currentColors.primary : currentColors.borderMedium}
                disabled={!notificationsSupported}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>1-Hour Reminder</Text>
                <Text style={styles.preferenceDescription}>Get reminded 1 hour before a race</Text>
              </View>
              <Switch
                value={preferences.pushReminder1Hour}
                onValueChange={(value) => handlePreferenceChange('pushReminder1Hour', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.pushReminder1Hour ? currentColors.primary : currentColors.borderMedium}
                disabled={!notificationsSupported}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>Score Updates</Text>
                <Text style={styles.preferenceDescription}>Get notified when race results are posted</Text>
              </View>
              <Switch
                value={preferences.pushScoreUpdates}
                onValueChange={(value) => handlePreferenceChange('pushScoreUpdates', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.pushScoreUpdates ? currentColors.primary : currentColors.borderMedium}
                disabled={!notificationsSupported}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>Chat Messages</Text>
                <Text style={styles.preferenceDescription}>Get notified when someone sends a message in league chats</Text>
              </View>
              <Switch
                value={preferences.pushChatMessages}
                onValueChange={(value) => handlePreferenceChange('pushChatMessages', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.pushChatMessages ? currentColors.primary : currentColors.borderMedium}
                disabled={!notificationsSupported}
              />
            </View>

            <View style={[styles.preferenceRow, styles.preferenceRowLast]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceLabel}>Other Updates</Text>
                <Text style={styles.preferenceDescription}>Receive other important updates</Text>
              </View>
              <Switch
                value={preferences.pushOther}
                onValueChange={(value) => handlePreferenceChange('pushOther', value)}
                trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                thumbColor={preferences.pushOther ? currentColors.primary : currentColors.borderMedium}
                disabled={!notificationsSupported}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSavePreferences}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={currentColors.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            )}
          </TouchableOpacity>

          {/* Test Notification Button */}
          {notificationsSupported && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestNotification}
            >
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;

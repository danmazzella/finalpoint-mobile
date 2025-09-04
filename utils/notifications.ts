import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { shouldEnableNotifications } from './environment';
// Note: Firebase config removed - using environment variables directly

export interface PushNotificationToken {
    type: 'ios' | 'android';
}

/**
 * Enhanced Android notification channel setup
 */
async function setupAndroidNotificationChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;

    if (!shouldEnableNotifications()) {
        console.log('🚫 Android notification channels disabled in Expo Go');
        return;
    }

    try {
        const Notifications = await import('expo-notifications');

        // Create default channel first (matches app.json configuration)
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            description: 'Default notifications for FinalPoint',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1e3a8a',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
        });

        // Create Pick Reminders channel
        await Notifications.setNotificationChannelAsync('finalpoint_pick_reminders', {
            name: 'Pick Reminders',
            description: 'Reminders to make your F1 picks before races',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: '#1e3a8a',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
        });

        // Create Race Scoring channel
        await Notifications.setNotificationChannelAsync('finalpoint_race_scoring', {
            name: 'Race Scoring',
            description: 'Updates when race results are scored and standings change',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1e3a8a',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
        });

        // Create Chat Messages channel
        await Notifications.setNotificationChannelAsync('finalpoint_chat', {
            name: 'Chat Messages',
            description: 'New messages in league chat rooms',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1e3a8a',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
        });

        // Create Miscellaneous channel
        await Notifications.setNotificationChannelAsync('finalpoint_misc', {
            name: 'Miscellaneous',
            description: 'Other notifications like league invites, admin messages, etc.',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250],
            lightColor: '#1e3a8a',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
        });

        // Keep the high priority channel for critical notifications
        await Notifications.setNotificationChannelAsync('finalpoint_high_priority', {
            name: 'High Priority',
            description: 'Critical notifications requiring immediate attention',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: '#1e3a8a',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
        });
    } catch (error) {
        console.error('Error setting up Android notification channels:', error);
    }
}

/**
 * Register for push notifications and get the appropriate token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
        return null;
    }

    if (!shouldEnableNotifications()) {
        console.log('🚫 Push notification registration disabled in Expo Go');
        return null;
    }

    let token = null;

    try {
        const Notifications = await import('expo-notifications');

        // Setup Android notification channels first
        if (Platform.OS === 'android') {
            await setupAndroidNotificationChannel();
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return null;
        }

        if (Platform.OS === 'android') {
            // Get FCM device token for Android
            try {
                // Try to get FCM token first
                const { messaging } = await import('../config/firebase');
                if (messaging) {
                    // Use Firebase FCM for Android
                    const { getToken } = await import('firebase/messaging');
                    token = await getToken(messaging, {
                        vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY
                    });
                } else {
                    // Fallback to Expo FCM token
                    token = (await Notifications.getDevicePushTokenAsync()).data;
                }
            } catch (error) {
                console.error('FCM token error, falling back to Expo:', error);
                // Fallback to Expo push token
                token = await getExpoPushToken();
            }
        } else {
            // Get Expo push token for iOS
            token = await getExpoPushToken();
        }
    } catch (error) {
        console.error('Error registering for push notifications:', error);
        token = null;
    }

    return token;
}

/**
 * Get Expo push token
 */
async function getExpoPushToken(): Promise<string> {
    if (!shouldEnableNotifications()) {
        throw new Error('Push notifications not supported in Expo Go');
    }

    const Notifications = await import('expo-notifications');

    // Get project ID from environment variables
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

    if (!projectId) {
        throw new Error('EAS project ID not found in environment variables');
    }

    const token = (await Notifications.getExpoPushTokenAsync({
        projectId,
    })).data;

    return token;
}

/**
 * Send push token to your backend server
 */
export async function sendPushTokenToServer(token: string, userId?: string): Promise<void> {
    try {
        const { notificationsAPI } = await import('../src/services/apiService');
        await notificationsAPI.registerPushToken(token, Platform.OS as 'ios' | 'android');
    } catch (error) {
        console.error('Error sending push token to server:', error);
        throw error;
    }
}

/**
 * Handle notification received while app is running
 */
export async function addNotificationReceivedListener(
    listener: (notification: any) => void
): Promise<any> {
    if (!shouldEnableNotifications()) {
        console.log('🚫 Notification received listener disabled in Expo Go');
        return { remove: () => { } }; // Return a dummy subscription
    }

    const Notifications = await import('expo-notifications');
    return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Handle notification response (when user taps notification)
 */
export async function addNotificationResponseReceivedListener(
    listener: (response: any) => void
): Promise<any> {
    if (!shouldEnableNotifications()) {
        console.log('🚫 Notification response listener disabled in Expo Go');
        return { remove: () => { } }; // Return a dummy subscription
    }

    const Notifications = await import('expo-notifications');
    return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Remove notification listeners
 */
export function removeNotificationListeners(): void {
    // Cleanup handled by individual subscription.remove() calls
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    data: any = {},
    trigger: any = null
): Promise<string> {
    if (!shouldEnableNotifications()) {
        console.log('🚫 Local notification scheduling disabled in Expo Go');
        return 'disabled';
    }

    const Notifications = await import('expo-notifications');
    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: 'default',
        },
        trigger,
    });

    return identifier;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
    if (!shouldEnableNotifications()) {
        console.log('🚫 Cancel scheduled notification disabled in Expo Go');
        return;
    }

    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
    if (!shouldEnableNotifications()) {
        console.log('🚫 Cancel all scheduled notifications disabled in Expo Go');
        return;
    }

    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<any[]> {
    if (!shouldEnableNotifications()) {
        console.log('🚫 Get all scheduled notifications disabled in Expo Go');
        return [];
    }

    const Notifications = await import('expo-notifications');
    return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Get badge count (iOS only)
 */
export async function getBadgeCountAsync(): Promise<number> {
    if (Platform.OS !== 'ios') return 0;
    if (!shouldEnableNotifications()) return 0;

    const Notifications = await import('expo-notifications');
    return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count (iOS only)
 */
export async function setBadgeCountAsync(count: number): Promise<void> {
    if (Platform.OS !== 'ios') return;
    if (!shouldEnableNotifications()) return;

    const Notifications = await import('expo-notifications');
    await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge count (iOS only)
 */
export async function clearBadgeAsync(): Promise<void> {
    if (Platform.OS !== 'ios') return;
    if (!shouldEnableNotifications()) return;

    const Notifications = await import('expo-notifications');
    await Notifications.setBadgeCountAsync(0);
}

/**
 * Decrement badge count by 1 (iOS only)
 */
export async function decrementBadgeAsync(): Promise<void> {
    if (Platform.OS !== 'ios') return;
    if (!shouldEnableNotifications()) return;

    const Notifications = await import('expo-notifications');
    const currentCount = await Notifications.getBadgeCountAsync();
    const newCount = Math.max(0, currentCount - 1);
    await Notifications.setBadgeCountAsync(newCount);
}

/**
 * Get current badge count and clear it (iOS only)
 * Useful for when user opens the app
 */
export async function getAndClearBadgeAsync(): Promise<number> {
    if (Platform.OS !== 'ios') return 0;
    if (!shouldEnableNotifications()) return 0;

    const Notifications = await import('expo-notifications');
    const currentCount = await Notifications.getBadgeCountAsync();
    if (currentCount > 0) {
        await Notifications.setBadgeCountAsync(0);
    }
    return currentCount;
}

/**
 * Handle background notification processing
 * This should be called in your app's background notification handler
 */
export async function handleBackgroundNotification(notification: any): Promise<void> {
    if (Platform.OS !== 'ios') return;

    try {
        // For background notifications, we might want to increment the badge
        // but this is usually handled automatically by iOS
        // console.log('Background notification received:', notification);

        // You can add custom logic here for background processing
        // For example, updating local storage, scheduling local notifications, etc.
    } catch (error) {
        console.error('Error handling background notification:', error);
    }
}

/**
 * Reset badge count to 0 (iOS only)
 * Useful for manual badge management
 */
export async function resetBadgeAsync(): Promise<void> {
    if (Platform.OS !== 'ios') return;
    if (!shouldEnableNotifications()) return;

    const Notifications = await import('expo-notifications');
    await Notifications.setBadgeCountAsync(0);
}

/**
 * Debug utility for badge management (iOS only)
 * Logs current badge count and provides management options
 */
export async function debugBadgeAsync(): Promise<void> {
    if (Platform.OS !== 'ios') {
        return;
    }

    // try {
    // const currentCount = await Notifications.getBadgeCountAsync();

    // if (currentCount > 0) {
    //     console.log('💡 Badge is visible on app icon');
    //     console.log('🔄 Use clearBadgeAsync() to remove badge');
    // } else {
    //     console.log('✅ No badge currently displayed');
    // }
    // } catch (error) {
    //     console.error('❌ Error getting badge count:', error);
    // }
}

/**
 * Intelligently clear badge if no active notifications (iOS only)
 * This helps handle cases where notifications were dismissed
 */
export async function smartClearBadgeAsync(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    if (!shouldEnableNotifications()) return false;

    try {
        const Notifications = await import('expo-notifications');
        const currentCount = await Notifications.getBadgeCountAsync();
        if (currentCount === 0) return false;

        // Get all scheduled notifications to see if any are active
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

        // If no scheduled notifications and there's a badge, clear it
        if (scheduledNotifications.length === 0) {
            await Notifications.setBadgeCountAsync(0);
            // console.log(`Smart badge clearing: cleared ${currentCount} badges (no active notifications)`);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error in smart badge clearing:', error);
        return false;
    }
}

/**
 * Force clear badge when user manually clears notifications (iOS only)
 * This is useful when the user swipes and clears all notifications
 */
export async function forceClearBadgeAsync(): Promise<void> {
    if (Platform.OS !== 'ios') return;
    if (!shouldEnableNotifications()) return;

    try {
        const Notifications = await import('expo-notifications');
        const currentCount = await Notifications.getBadgeCountAsync();
        if (currentCount > 0) {
            await Notifications.setBadgeCountAsync(0);
            // console.log(`Force badge clearing: cleared ${currentCount} badges`);
        }
    } catch (error) {
        console.error('Error in force badge clearing:', error);
    }
}



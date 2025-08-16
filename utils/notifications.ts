import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getEasProjectId } from '../config/firebase.config';

export interface PushNotificationToken {
    type: 'ios' | 'android';
}

/**
 * Enhanced Android notification channel setup
 */
async function setupAndroidNotificationChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
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

        // Create Miscellaneous channel
        await Notifications.setNotificationChannelAsync('finalpoint_misc', {
            name: 'Miscellaneous',
            description: 'Other notifications like league invites, admin messages, etc.',
            importance: Notifications.AndroidImportance.LOW,
            vibrationPattern: [0, 250],
            lightColor: '#1e3a8a',
            sound: 'default',
            enableVibrate: false,
            showBadge: false,
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

    let token = null;

    try {
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
                token = (await Notifications.getDevicePushTokenAsync()).data;
            } catch (error) {
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
    let projectId = getEasProjectId();

    if (!projectId) {
        throw new Error('EAS project ID not found in configuration');
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
export function addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Handle notification response (when user taps notification)
 */
export function addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
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
    trigger: Notifications.NotificationTriggerInput = null
): Promise<string> {
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
    await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Get badge count (iOS only)
 */
export async function getBadgeCountAsync(): Promise<number> {
    if (Platform.OS !== 'ios') return 0;
    return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count (iOS only)
 */
export async function setBadgeCountAsync(count: number): Promise<void> {
    if (Platform.OS !== 'ios') return;
    await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge count (iOS only)
 */
export async function clearBadgeAsync(): Promise<void> {
    if (Platform.OS !== 'ios') return;
    await Notifications.setBadgeCountAsync(0);
}

/**
 * Decrement badge count by 1 (iOS only)
 */
export async function decrementBadgeAsync(): Promise<void> {
    if (Platform.OS !== 'ios') return;
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

    try {
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

    try {
        const currentCount = await Notifications.getBadgeCountAsync();
        if (currentCount > 0) {
            await Notifications.setBadgeCountAsync(0);
            // console.log(`Force badge clearing: cleared ${currentCount} badges`);
        }
    } catch (error) {
        console.error('Error in force badge clearing:', error);
    }
}



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
            lightColor: '#FF6B35',
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
            lightColor: '#4CAF50',
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
            lightColor: '#9E9E9E',
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
            lightColor: '#F44336',
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



import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is running
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface PushNotificationToken {
    token: string;
    type: 'ios' | 'android';
}

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    console.log('🔔 Starting push notification registration...');
    console.log('📱 Platform:', Platform.OS);
    console.log('📱 Is Device:', Device.isDevice);

    if (Platform.OS === 'android') {
        console.log('🤖 Setting up Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
        console.log('✅ Android notification channel created');
    }

    if (Device.isDevice) {
        console.log('📱 Physical device detected, checking permissions...');

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('📱 Current permission status:', existingStatus);

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            console.log('📱 Requesting notification permissions...');
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log('📱 Permission request result:', finalStatus);
        }

        if (finalStatus !== 'granted') {
            console.log('❌ Notification permission denied');
            alert('Failed to get push token for push notification!');
            return null;
        }

        try {
            console.log('🔑 Getting project ID...');
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
            console.log('🔑 Project ID:', projectId);

            if (!projectId) {
                throw new Error('Project ID not found in Expo configuration');
            }

            console.log('🎫 Requesting Expo push token...');
            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;

            console.log('✅ Expo Push Token received:', token);
        } catch (e) {
            console.error('❌ Error getting push token:', e);

            // Provide more specific error messages
            if (e instanceof Error) {
                if (e.message.includes('Project ID not found')) {
                    console.error('❌ Make sure your app.json has the correct EAS project ID');
                } else if (e.message.includes('network')) {
                    console.error('❌ Network error - check your internet connection');
                } else if (e.message.includes('permission')) {
                    console.error('❌ Permission error - user may have denied notifications');
                }
            }

            token = null;
        }
    } else {
        console.log('❌ Not a physical device - push notifications require physical device');
        alert('Must use physical device for Push Notifications');
    }

    return token;
}

/**
 * Send push token to your backend server
 */
export async function sendPushTokenToServer(token: string, userId?: string): Promise<void> {
    try {
        console.log('🌐 Sending push token to server...');
        // Use the actual FinalPoint API endpoint
        const { notificationsAPI } = await import('../src/services/apiService');

        await notificationsAPI.registerPushToken(token, Platform.OS as 'ios' | 'android');

        console.log(`✅ Push token sent to server successfully for platform: ${Platform.OS}`);
    } catch (error) {
        console.error('❌ Error sending push token to server:', error);
        throw error;
    }
}

/**
 * Handle notification received while app is running
 */
export function addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Handle notification response (when user taps notification)
 */
export function addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
        },
        trigger: trigger || null, // null means show immediately
    });

    return notificationId;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.requestPermissionsAsync();
}

/**
 * Test if the device actually supports notifications by attempting to schedule one
 */
export async function testNotificationSupport(): Promise<boolean> {
    try {
        console.log('🧪 Testing notification support...');

        // Try to schedule a test notification
        const testId = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Test',
                body: 'Testing notification support',
            },
            trigger: null, // Show immediately
        });

        console.log('✅ Test notification scheduled successfully, ID:', testId);

        // Cancel it immediately so user doesn't see it
        await Notifications.cancelScheduledNotificationAsync(testId);
        console.log('✅ Test notification cancelled');

        return true;
    } catch (error) {
        console.error('❌ Notification support test failed:', error);
        return false;
    }
}

/**
 * Get detailed notification support information
 */
export async function getNotificationSupportInfo(): Promise<{
    deviceSupported: boolean;
    permissionsGranted: boolean;
    canScheduleNotifications: boolean;
    platform: string;
    isPhysicalDevice: boolean;
}> {
    const deviceSupported = Device.isDevice;
    const permissionsGranted = (await Notifications.getPermissionsAsync()).status === 'granted';
    const canScheduleNotifications = await testNotificationSupport();

    return {
        deviceSupported,
        permissionsGranted,
        canScheduleNotifications,
        platform: Platform.OS,
        isPhysicalDevice: Device.isDevice,
    };
}

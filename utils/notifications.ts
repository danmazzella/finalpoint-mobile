import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getEasProjectId, getFirebaseProjectId, isFirebaseConfigured } from '../config/firebase.config';

// Import expo-notifications (will be available but we'll check before using)
import * as Notifications from 'expo-notifications';

// Check if we should enable notifications before importing expo-notifications
const shouldEnableNotifications = () => {
    return Constants.appOwnership !== 'expo';
};

// Helper function to check if notifications are available
const isNotificationsAvailable = () => {
    return shouldEnableNotifications();
};

// Configure how notifications are handled when the app is running
if (isNotificationsAvailable()) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

export interface PushNotificationToken {
    token: string;
    type: 'ios' | 'android';
}

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    // Check if notifications are enabled
    if (!isNotificationsAvailable()) {
        console.log('🚫 Notifications disabled in Expo Go');
        return null;
    }

    let token = null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return null;
        }

        try {
            // Use EAS project ID for Expo push notifications (not Firebase project ID)
            let projectId = getEasProjectId();

            if (!projectId) {
                throw new Error('EAS project ID not found in configuration');
            }

            console.log('🔑 Using EAS project ID for push notifications:', projectId);

            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;

            console.log('✅ Successfully obtained push token:', token);

            // Store the token and check if it has changed
            try {
                const AsyncStorage = await import('@react-native-async-storage/async-storage');
                await AsyncStorage.default.setItem('pushToken', token);
                console.log('💾 Push token stored locally');
            } catch (storageError) {
                console.log('⚠️ Could not store push token locally:', storageError);
            }

        } catch (e) {
            console.error('❌ Error getting push token:', e);

            // Provide more specific error messages
            if (e instanceof Error) {
                if (e.message.includes('Firebase project ID not found')) {
                    console.error('🔑 Firebase project ID issue - check environment variables');
                } else if (e.message.includes('network')) {
                    console.error('🌐 Network issue - check internet connection');
                } else {
                    console.error('❌ Unknown error during push token registration');
                }
            }

            token = null;
        }
    } else {
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
    if (!isNotificationsAvailable()) {
        console.log('🚫 Add notification received listener disabled in Expo Go');
        // Return a mock subscription for Expo Go
        return {
            remove: () => { },
        } as Notifications.Subscription;
    }
    return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Handle notification response (when user taps notification)
 */
export function addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
    if (!isNotificationsAvailable()) {
        console.log('🚫 Add notification response listener disabled in Expo Go');
        // Return a mock subscription for Expo Go
        return {
            remove: () => { },
        } as Notifications.Subscription;
    }
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
    if (!isNotificationsAvailable()) {
        console.log('🚫 Local notification disabled in Expo Go:', { title, body, data });
        return 'disabled';
    }

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
    if (!isNotificationsAvailable()) {
        console.log('🚫 Cancel notification disabled in Expo Go');
        return;
    }
    await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    if (!isNotificationsAvailable()) {
        console.log('🚫 Cancel all notifications disabled in Expo Go');
        return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    if (!isNotificationsAvailable()) {
        console.log('🚫 Get notification permissions disabled in Expo Go');
        // Return a mock response for Expo Go
        return {
            status: 'denied',
            canAskAgain: false,
            expires: 'never'
        } as Notifications.NotificationPermissionsStatus;
    }
    return await Notifications.getPermissionsAsync();
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    if (!isNotificationsAvailable()) {
        console.log('🚫 Request notification permissions disabled in Expo Go');
        // Return a mock response for Expo Go
        return {
            status: 'denied',
            canAskAgain: false,
            expires: 'never'
        } as Notifications.NotificationPermissionsStatus;
    }
    return await Notifications.requestPermissionsAsync();
}

/**
 * Test if the device actually supports notifications by attempting to schedule one
 */
export async function testNotificationSupport(): Promise<boolean> {
    if (!isNotificationsAvailable()) {
        return false;
    }

    try {
        // Simply check if we have permissions - no need to schedule test notifications
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    } catch (error) {
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

/**
 * Test the complete push notification flow
 * This function can be called manually to test the system
 */
export async function testPushNotificationFlow(): Promise<{
    success: boolean;
    token?: string;
    error?: string;
    details: {
        deviceSupported: boolean;
        permissionsGranted: boolean;
        canScheduleNotifications: boolean;
        platform: string;
        isPhysicalDevice: boolean;
    };
}> {
    try {
        console.log('🧪 Testing complete push notification flow...');

        // Get device support info
        const supportInfo = await getNotificationSupportInfo();

        if (!supportInfo.deviceSupported) {
            return {
                success: false,
                error: 'Device does not support notifications',
                details: supportInfo
            };
        }

        if (!supportInfo.permissionsGranted) {
            return {
                success: false,
                error: 'Notification permissions not granted',
                details: supportInfo
            };
        }

        // Try to get push token
        const token = await registerForPushNotificationsAsync();

        if (!token) {
            return {
                success: false,
                error: 'Failed to obtain push token',
                details: supportInfo
            };
        }

        console.log('✅ Push notification flow test successful');
        return {
            success: true,
            token,
            details: supportInfo
        };

    } catch (error) {
        console.error('❌ Push notification flow test failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: await getNotificationSupportInfo()
        };
    }
}

/**
 * Check if the current push token is different from the stored one
 * This can happen when the app is updated or the device changes
 */
export async function checkAndUpdatePushToken(
    currentToken: string,
    onTokenChange?: (newToken: string) => Promise<void>
): Promise<boolean> {
    try {
        // Get the stored token from AsyncStorage
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const storedToken = await AsyncStorage.default.getItem('pushToken');

        if (storedToken !== currentToken) {
            console.log('🔄 Push token has changed, updating...');

            // Store the new token
            await AsyncStorage.default.setItem('pushToken', currentToken);

            // Call the callback if provided
            if (onTokenChange) {
                await onTokenChange(currentToken);
            }

            return true; // Token was updated
        }

        return false; // Token is the same
    } catch (error) {
        console.error('❌ Error checking push token:', error);
        return false;
    }
}

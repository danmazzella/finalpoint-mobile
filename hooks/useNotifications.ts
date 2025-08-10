import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import {
    registerForPushNotificationsAsync,
    sendPushTokenToServer,
    addNotificationReceivedListener,
    addNotificationResponseReceivedListener,
    getNotificationSupportInfo,
} from '../utils/notifications';

export interface UseNotificationsOptions {
    /** Whether to automatically register for push notifications on mount */
    autoRegister?: boolean;
    /** User ID to associate with the push token */
    userId?: string;
    /** Callback when a notification is received while app is running */
    onNotificationReceived?: (notification: Notifications.Notification) => void;
    /** Callback when user taps on a notification */
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

export interface UseNotificationsReturn {
    /** Current push token */
    pushToken: string | null;
    /** Whether push notifications are supported on this device */
    isSupported: boolean;
    /** Whether we're currently registering for notifications */
    isRegistering: boolean;
    /** Any error that occurred during registration */
    error: string | null;
    /** Manually register for push notifications */
    register: () => Promise<void>;
    /** Send the current token to your server */
    sendTokenToServer: (userId?: string) => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
    const {
        autoRegister = true,
        userId,
        onNotificationReceived,
        onNotificationResponse,
    } = options;

    const [pushToken, setPushToken] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    // Check if device supports notifications at all
    const checkDeviceSupport = async () => {
        try {
            console.log('🔍 Checking device notification support...');
            const supportInfo = await getNotificationSupportInfo();

            console.log('📱 Device support info:', supportInfo);

            // Device supports notifications if it can schedule them
            return supportInfo.canScheduleNotifications;
        } catch (error) {
            console.error('❌ Error checking device support:', error);
            // Fallback to basic device check
            return Device.isDevice;
        }
    };

    const register = async () => {
        try {
            setIsRegistering(true);
            setError(null);

            // First check device support
            const deviceSupportsNotifications = await checkDeviceSupport();
            if (!deviceSupportsNotifications) {
                setIsSupported(false);
                setError('Device does not support notifications');
                return;
            }

            console.log('✅ Device supports notifications, proceeding with push registration...');
            const token = await registerForPushNotificationsAsync();

            if (token) {
                setPushToken(token);
                setIsSupported(true); // Successfully got token
                setError(null);

                // Automatically send to server if userId is provided
                if (userId) {
                    await sendPushTokenToServer(token, userId);
                }
            } else {
                // Token registration failed, but device supports local notifications
                // This is a common case - device supports notifications but push registration failed
                setIsSupported(false);
                setError('Failed to get push token - device supports notifications but push registration failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);

            // Don't immediately mark as unsupported - might be a temporary issue
            // Only mark as unsupported if it's a clear device limitation
            if (errorMessage.includes('Project ID not found') ||
                errorMessage.includes('Must use physical device')) {
                setIsSupported(false);
            }
        } finally {
            setIsRegistering(false);
        }
    };

    const sendTokenToServer = async (userIdParam?: string) => {
        if (!pushToken) {
            throw new Error('No push token available');
        }

        try {
            await sendPushTokenToServer(pushToken, userIdParam || userId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send token to server');
            throw err;
        }
    };

    useEffect(() => {
        // Set up notification listeners
        if (onNotificationReceived) {
            notificationListener.current = addNotificationReceivedListener(onNotificationReceived);
        }

        if (onNotificationResponse) {
            responseListener.current = addNotificationResponseReceivedListener(onNotificationResponse);
        }

        // Auto-register if enabled
        if (autoRegister) {
            register();
        }

        // Cleanup listeners on unmount
        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, [autoRegister]);

    // Update listeners when callbacks change
    useEffect(() => {
        if (notificationListener.current) {
            Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (onNotificationReceived) {
            notificationListener.current = addNotificationReceivedListener(onNotificationReceived);
        }
    }, [onNotificationReceived]);

    useEffect(() => {
        if (responseListener.current) {
            Notifications.removeNotificationSubscription(responseListener.current);
        }
        if (onNotificationResponse) {
            responseListener.current = addNotificationResponseReceivedListener(onNotificationResponse);
        }
    }, [onNotificationResponse]);

    return {
        pushToken,
        isSupported,
        isRegistering,
        error,
        register,
        sendTokenToServer,
    };
}

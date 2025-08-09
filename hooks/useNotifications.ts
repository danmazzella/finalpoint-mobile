import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
    registerForPushNotificationsAsync,
    sendPushTokenToServer,
    addNotificationReceivedListener,
    addNotificationResponseReceivedListener,
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

    const register = async () => {
        try {
            setIsRegistering(true);
            setError(null);

            const token = await registerForPushNotificationsAsync();

            if (token) {
                setPushToken(token);

                // Automatically send to server if userId is provided
                if (userId) {
                    await sendPushTokenToServer(token, userId);
                }
            } else {
                setIsSupported(false);
                setError('Failed to get push token');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            setIsSupported(false);
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

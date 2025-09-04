import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications, UseNotificationsOptions, UseNotificationsReturn } from '../hooks/useNotifications';
import { shouldEnableNotifications } from '../utils/environment';

interface NotificationContextValue extends UseNotificationsReturn {
    /** Show a local notification immediately */
    showLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
    /** Schedule a local notification for later */
    scheduleNotification: (
        title: string,
        body: string,
        trigger: any, // Using any to avoid importing Notifications type
        data?: any
    ) => Promise<string>;
    /** Manually register for push notifications */
    registerForNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface NotificationProviderProps extends UseNotificationsOptions {
    children: ReactNode;
}

export function NotificationProvider({ children, ...options }: NotificationProviderProps) {
    const notifications = useNotifications(options);

    const showLocalNotification = async (title: string, body: string, data?: any) => {
        if (!shouldEnableNotifications()) {
            console.log('🚫 Local notification disabled in Expo Go');
            return;
        }

        try {
            const Notifications = await import('expo-notifications');
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                },
                trigger: null, // Show immediately
            });
        } catch (error) {
            console.error('❌ Error showing local notification:', error);
        }
    };

    const scheduleNotification = async (
        title: string,
        body: string,
        trigger: any,
        data?: any
    ): Promise<string> => {
        if (!shouldEnableNotifications()) {
            console.log('🚫 Scheduled notification disabled in Expo Go');
            return 'disabled';
        }

        try {
            const Notifications = await import('expo-notifications');
            return await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                },
                trigger,
            });
        } catch (error) {
            console.error('❌ Error scheduling notification:', error);
            return 'error';
        }
    };

    const registerForNotifications = async () => {
        if (!shouldEnableNotifications()) {
            return;
        }

        await notifications.register();
    };

    const value: NotificationContextValue = {
        ...notifications,
        showLocalNotification,
        scheduleNotification,
        registerForNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext(): NotificationContextValue {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
}

// Export the hook for convenience
export { useNotifications } from '../hooks/useNotifications';

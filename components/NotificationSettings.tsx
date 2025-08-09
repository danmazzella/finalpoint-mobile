import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNotificationContext } from './NotificationProvider';

export function NotificationSettings() {
    const {
        pushToken,
        isSupported,
        isRegistering,
        error,
        register,
        sendTokenToServer,
        showLocalNotification,
    } = useNotificationContext();

    const [isSendingToServer, setIsSendingToServer] = useState(false);

    const handleRegister = async () => {
        try {
            await register();
            Alert.alert('Success', 'Successfully registered for push notifications!');
        } catch (err) {
            Alert.alert('Error', 'Failed to register for push notifications');
        }
    };

    const handleSendToServer = async () => {
        if (!pushToken) {
            Alert.alert('Error', 'No push token available');
            return;
        }

        try {
            setIsSendingToServer(true);
            // You might want to get the user ID from your auth context
            await sendTokenToServer('your-user-id'); // Replace with actual user ID
            Alert.alert('Success', 'Push token sent to server!');
        } catch (err) {
            Alert.alert('Error', 'Failed to send push token to server');
        } finally {
            setIsSendingToServer(false);
        }
    };

    const handleTestNotification = async () => {
        try {
            await showLocalNotification(
                'Test Notification',
                'This is a test notification from your app!',
                { test: true }
            );
        } catch (err) {
            Alert.alert('Error', 'Failed to show test notification');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Push Notifications</Text>

            <View style={styles.section}>
                <Text style={styles.label}>Status:</Text>
                <Text style={styles.value}>
                    {!isSupported
                        ? 'Not supported on this device'
                        : pushToken
                            ? 'Registered'
                            : 'Not registered'}
                </Text>
            </View>

            {pushToken && (
                <View style={styles.section}>
                    <Text style={styles.label}>Push Token:</Text>
                    <Text style={styles.tokenText} numberOfLines={3}>
                        {pushToken}
                    </Text>
                </View>
            )}

            {error && (
                <View style={styles.section}>
                    <Text style={styles.label}>Error:</Text>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleRegister}
                    disabled={isRegistering || !isSupported}
                >
                    <Text style={styles.buttonText}>
                        {isRegistering ? 'Registering...' : 'Register for Notifications'}
                    </Text>
                </TouchableOpacity>

                {pushToken && (
                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={handleSendToServer}
                        disabled={isSendingToServer}
                    >
                        <Text style={styles.buttonText}>
                            {isSendingToServer ? 'Sending...' : 'Send Token to Server'}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.button, styles.testButton]}
                    onPress={handleTestNotification}
                >
                    <Text style={styles.buttonText}>Test Local Notification</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
        color: '#333',
    },
    value: {
        fontSize: 14,
        color: '#666',
    },
    tokenText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 5,
    },
    errorText: {
        fontSize: 14,
        color: '#d32f2f',
    },
    buttonContainer: {
        marginTop: 20,
    },
    button: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    secondaryButton: {
        backgroundColor: '#34C759',
    },
    testButton: {
        backgroundColor: '#FF9500',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

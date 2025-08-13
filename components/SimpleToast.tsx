import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SimpleToastProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
    onHide: () => void;
    duration?: number;
}

const SimpleToast: React.FC<SimpleToastProps> = ({
    message,
    type,
    isVisible,
    onHide,
    duration = 10000
}) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(-100));

    useEffect(() => {
        if (isVisible && message) {
            // Slide in and fade in
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after duration
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, message, duration]);

    const hideToast = () => {
        // Slide out and fade out
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    };

    if (!isVisible || !message) {
        return null;
    }

    const getToastStyles = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: '#d4edda',
                    borderColor: '#28a745',
                    iconColor: '#28a745',
                    textColor: '#155724',
                };
            case 'error':
                return {
                    backgroundColor: '#f8d7da',
                    borderColor: '#dc3545',
                    iconColor: '#dc3545',
                    textColor: '#721c24',
                };
            case 'warning':
                return {
                    backgroundColor: '#fff3cd',
                    borderColor: '#ffc107',
                    iconColor: '#ffc107',
                    textColor: '#856404',
                };
            case 'info':
                return {
                    backgroundColor: '#d1ecf1',
                    borderColor: '#17a2b8',
                    iconColor: '#17a2b8',
                    textColor: '#0c5460',
                };
            default:
                return {
                    backgroundColor: '#e2e3e5',
                    borderColor: '#6c757d',
                    iconColor: '#6c757d',
                    textColor: '#383d41',
                };
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return 'checkmark-circle';
            case 'error':
                return 'close-circle';
            case 'warning':
                return 'warning';
            case 'info':
                return 'information-circle';
            default:
                return 'information-circle';
        }
    };

    const styles = getToastStyles();

    return (
        <Animated.View
            style={[
                toastStyles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <View
                style={[
                    toastStyles.toast,
                    {
                        backgroundColor: styles.backgroundColor,
                        borderColor: styles.borderColor,
                    },
                ]}
            >
                <View style={toastStyles.content}>
                    <View style={toastStyles.iconContainer}>
                        <Ionicons
                            name={getIcon() as any}
                            size={24}
                            color={styles.iconColor}
                        />
                    </View>
                    <View style={toastStyles.messageContainer}>
                        <Text
                            style={[
                                toastStyles.message,
                                { color: styles.textColor },
                            ]}
                        >
                            {message}
                        </Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const toastStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        zIndex: 9999,
    },
    toast: {
        borderRadius: 12,
        borderWidth: 2,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        marginRight: 12,
    },
    messageContainer: {
        flex: 1,
    },
    message: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 22,
    },
});

export default SimpleToast;

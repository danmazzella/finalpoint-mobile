import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useScreenSize } from '../hooks/useScreenSize';
import Colors from '../constants/Colors';
import { spacing, borderRadius } from '../utils/styles';

const TabletTestIndicator = () => {
    const screenSize = useScreenSize();
    const { width, height } = require('react-native').Dimensions.get('window');

    // Only show in development
    if (!__DEV__) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Screen Size Test</Text>
            <Text style={styles.info}>Detected: {screenSize}</Text>
            <Text style={styles.info}>Dimensions: {width} × {height}</Text>
            <Text style={styles.info}>Breakpoint: 768px</Text>
            <Text style={[
                styles.status,
                { color: screenSize === 'tablet' ? Colors.light.success : Colors.light.primary }
            ]}>
                Status: {screenSize === 'tablet' ? '✅ Tablet Mode' : '📱 Phone Mode'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100,
        right: 16,
        backgroundColor: Colors.light.cardBackground,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        zIndex: 1000,
        maxWidth: 200,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    info: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginBottom: spacing.xs,
    },
    status: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: spacing.sm,
    },
});

export default TabletTestIndicator;

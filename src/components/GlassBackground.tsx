import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function GlassBackground({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0f0f0f' : '#dbeafe' }]}>
            <View style={[styles.base, { backgroundColor: isDark ? '#0f0f0f' : '#dbeafe' }]} />
            <LinearGradient
                colors={
                    isDark
                        ? ['rgba(37, 99, 235, 0.12)', 'transparent']
                        : ['rgba(37, 99, 235, 0.10)', 'transparent']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 0.6 }}
                style={styles.topLeft}
            />
            <LinearGradient
                colors={
                    isDark
                        ? ['rgba(99, 102, 241, 0.08)', 'transparent']
                        : ['rgba(99, 102, 241, 0.07)', 'transparent']
                }
                start={{ x: 1, y: 1 }}
                end={{ x: 0.4, y: 0.4 }}
                style={styles.bottomRight}
            />
            <View style={styles.content}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    base: {
        ...StyleSheet.absoluteFillObject,
    },
    topLeft: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomRight: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
    },
});

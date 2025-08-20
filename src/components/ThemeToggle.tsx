import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useTheme, useThemeColors } from '../context/ThemeContext';

interface ThemeToggleProps {
    showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabels = true }) => {
    const { resolvedTheme, toggleTheme } = useTheme();
    const colors = useThemeColors();

    const handleToggle = () => {
        toggleTheme();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {showLabels && (
                <View style={styles.labelContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Switch between light and dark mode
                    </Text>
                </View>
            )}

            <View style={styles.toggleContainer}>
                {showLabels && (
                    <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Light</Text>
                )}

                <Switch
                    value={resolvedTheme === 'dark'}
                    onValueChange={handleToggle}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={resolvedTheme === 'dark' ? colors.primaryForeground : colors.input}
                    ios_backgroundColor={colors.border}
                    style={styles.switch}
                />

                {showLabels && (
                    <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>Dark</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    labelContainer: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleLabel: {
        fontSize: 14,
    },
    switch: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
    },
});

export default ThemeToggle;

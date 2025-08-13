import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatusBarWrapper from './StatusBarWrapper';
import { useStatusBar } from '../hooks/useStatusBar';
import Colors from '../constants/Colors';

/**
 * Example component demonstrating how to use the status bar components
 * 
 * This shows different ways to configure the status bar and how to
 * handle edge-to-edge displays on Android.
 */
const StatusBarExample: React.FC = () => {
    const { statusBarHeight, isEdgeToEdge, topInset } = useStatusBar();

    return (
        <StatusBarWrapper style="light">
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Status Bar Example</Text>

                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Status Bar Information:</Text>
                        <Text style={styles.infoText}>Height: {statusBarHeight}px</Text>
                        <Text style={styles.infoText}>Edge-to-Edge: {isEdgeToEdge ? 'Yes' : 'No'}</Text>
                        <Text style={styles.infoText}>Top Inset: {topInset}px</Text>
                    </View>

                    <View style={styles.buttonSection}>
                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>Light Status Bar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>Dark Status Bar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>Auto Status Bar</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.description}>
                        This screen demonstrates the StatusBarWrapper component.
                        On Android edge-to-edge displays, you'll see a FinalPoint blue
                        background under the status bar to ensure text visibility.
                    </Text>
                </View>
            </SafeAreaView>
        </StatusBarWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundPrimary,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },
    infoSection: {
        backgroundColor: Colors.light.cardBackground,
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginBottom: 8,
    },
    buttonSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    button: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: '500',
    },
    description: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        lineHeight: 20,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default StatusBarExample;

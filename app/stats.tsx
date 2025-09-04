import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { statsAPI } from '../src/services/apiService';
import { lightColors, darkColors } from '../src/constants/Colors';
// import { createThemeStyles } from '../src/styles/universalStyles';

interface DriverPositionStats {
    driverId: number;
    driverName: string;
    driverTeam: string;
    timesInPosition: number;
    totalRaces: number;
    percentageInPosition: number;
}

const StatsScreen = () => {
    const { resolvedTheme } = useTheme();
    const { showToast } = useSimpleToast();

    // Get current theme colors
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors (for future use)
    // const universalStyles = createThemeStyles(currentColors);

    // Create stats-specific styles with current theme colors
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentColors.backgroundPrimary,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 100, // Add padding to prevent content from being hidden by the tab bar
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
        },
        backButton: {
            padding: 8,
            marginRight: 8,
        },
        headerContent: {
            flex: 1,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        headerSubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginTop: 2,
        },
        content: {
            padding: 16,
        },
        positionSelector: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        selectorTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 8,
        },
        selectorDescription: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 16,
            lineHeight: 20,
        },
        positionGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        positionButton: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            minWidth: 50,
            alignItems: 'center',
        },
        positionButtonActive: {
            backgroundColor: currentColors.primary,
        },
        positionButtonInactive: {
            backgroundColor: currentColors.backgroundSecondary,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        positionButtonText: {
            fontSize: 14,
            fontWeight: '600',
        },
        positionButtonTextActive: {
            color: currentColors.textInverse,
        },
        positionButtonTextInactive: {
            color: currentColors.textSecondary,
        },
        resultsContainer: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        resultsHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        resultsTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
        },
        loadingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        loadingText: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginLeft: 8,
        },
        driverCard: {
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
        },
        driverCardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8,
        },
        driverInfo: {
            flex: 1,
        },
        driverName: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
        },
        driverTeam: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginTop: 2,
        },
        statsBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        statsBadgeActive: {
            backgroundColor: currentColors.successLight,
        },
        statsBadgeInactive: {
            backgroundColor: currentColors.backgroundTertiary,
        },
        statsBadgeText: {
            fontSize: 12,
            fontWeight: '600',
        },
        statsBadgeTextActive: {
            color: currentColors.success,
        },
        statsBadgeTextInactive: {
            color: currentColors.textSecondary,
        },
        successRateRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        successRateLabel: {
            fontSize: 12,
            color: currentColors.textSecondary,
        },
        successRateBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        successRateBadgeActive: {
            backgroundColor: currentColors.primary + '20', // Add transparency
        },
        successRateBadgeInactive: {
            backgroundColor: currentColors.backgroundTertiary,
        },
        successRateBadgeText: {
            fontSize: 12,
            fontWeight: '600',
        },
        successRateBadgeTextActive: {
            color: currentColors.primary,
        },
        successRateBadgeTextInactive: {
            color: currentColors.textSecondary,
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: 32,
        },
        emptyStateText: {
            fontSize: 16,
            color: currentColors.textSecondary,
        },
        errorContainer: {
            alignItems: 'center',
            paddingVertical: 32,
        },
        errorText: {
            fontSize: 16,
            color: currentColors.error,
            textAlign: 'center',
            marginBottom: 16,
        },
        retryButton: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
        },
        retryButtonText: {
            color: currentColors.textInverse,
            fontSize: 14,
            fontWeight: '600',
        },
    });

    const [selectedPosition, setSelectedPosition] = useState<number>(1);
    const [driverStats, setDriverStats] = useState<DriverPositionStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDriverStats = useCallback(async (position: number) => {
        try {
            setLoading(true);
            setError(null);

            console.log(`Loading driver stats for position ${position}...`);
            const response = await statsAPI.getDriverPositionStats(position);
            console.log('Full API Response:', JSON.stringify(response, null, 2));

            // Handle the API response structure: { success: true, data: { position: 1, drivers: [...] } }
            if (response.data && response.data.success && response.data.data && response.data.data.drivers) {
                console.log(`Found ${response.data.data.drivers.length} drivers for position ${position}`);
                setDriverStats(response.data.data.drivers);
            } else if (response.data && response.data.drivers) {
                // Fallback: direct drivers array
                console.log(`Found ${response.data.drivers.length} drivers (direct format) for position ${position}`);
                setDriverStats(response.data.drivers);
            } else {
                console.error('Unexpected API response structure:', response.data);
                setError(`Unexpected data format received from server. Response: ${JSON.stringify(response.data)}`);
            }
        } catch (err: any) {
            console.error('Error loading driver stats:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                url: err.config?.url
            });

            let errorMessage = 'Failed to load driver statistics. Please try again.';
            if (err.response?.status === 404) {
                errorMessage = 'Stats endpoint not found. Please check if the API server is running.';
            } else if (err.code === 'NETWORK_ERROR') {
                errorMessage = 'Network error. Please check your connection and try again.';
            }

            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDriverStats(selectedPosition);
        setRefreshing(false);
    };

    const handlePositionChange = (position: number) => {
        setSelectedPosition(position);
    };

    const handleRetry = () => {
        loadDriverStats(selectedPosition);
    };

    useEffect(() => {
        // Debug: Log the API base URL being used
        console.log('API Base URL:', process.env.EXPO_PUBLIC_API_URL || 'http://localhost:6075/api (fallback)');
        loadDriverStats(selectedPosition);
    }, [selectedPosition, loadDriverStats]);

    const renderDriverCard = (driver: DriverPositionStats) => (
        <View key={driver.driverId} style={styles.driverCard}>
            <View style={styles.driverCardHeader}>
                <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{driver.driverName}</Text>
                    <Text style={styles.driverTeam}>{driver.driverTeam}</Text>
                </View>
                <View style={[
                    styles.statsBadge,
                    driver.timesInPosition > 0 ? styles.statsBadgeActive : styles.statsBadgeInactive
                ]}>
                    <Text style={[
                        styles.statsBadgeText,
                        driver.timesInPosition > 0 ? styles.statsBadgeTextActive : styles.statsBadgeTextInactive
                    ]}>
                        {driver.timesInPosition}/{driver.totalRaces}
                    </Text>
                </View>
            </View>
            <View style={styles.successRateRow}>
                <Text style={styles.successRateLabel}>Success Rate</Text>
                <View style={[
                    styles.successRateBadge,
                    driver.percentageInPosition > 0 ? styles.successRateBadgeActive : styles.successRateBadgeInactive
                ]}>
                    <Text style={[
                        styles.successRateBadgeText,
                        driver.percentageInPosition > 0 ? styles.successRateBadgeTextActive : styles.successRateBadgeTextInactive
                    ]}>
                        {driver.percentageInPosition || 0}%
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>F1 Statistics</Text>
                    <Text style={styles.headerSubtitle}>Driver finishing positions and performance data</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={currentColors.primary}
                        colors={[currentColors.primary]}
                    />
                }
            >
                <View style={styles.content}>
                    {/* Position Selector */}
                    <View style={styles.positionSelector}>
                        <Text style={styles.selectorTitle}>Driver Finishing Positions</Text>
                        <Text style={styles.selectorDescription}>
                            Select a position to see how many times each driver has finished in that position this season.
                        </Text>

                        <View style={styles.positionGrid}>
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((position) => (
                                <TouchableOpacity
                                    key={position}
                                    style={[
                                        styles.positionButton,
                                        selectedPosition === position ? styles.positionButtonActive : styles.positionButtonInactive
                                    ]}
                                    onPress={() => handlePositionChange(position)}
                                >
                                    <Text style={[
                                        styles.positionButtonText,
                                        selectedPosition === position ? styles.positionButtonTextActive : styles.positionButtonTextInactive
                                    ]}>
                                        P{position}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Results */}
                    <View style={styles.resultsContainer}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>
                                Drivers who finished in P{selectedPosition}
                            </Text>
                            {loading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color={currentColors.primary} />
                                    <Text style={styles.loadingText}>Loading...</Text>
                                </View>
                            )}
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : driverStats.length > 0 ? (
                            driverStats.map(renderDriverCard)
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>No data available for this position.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default StatsScreen;

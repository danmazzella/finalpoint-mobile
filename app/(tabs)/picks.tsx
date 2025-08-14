import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import { useAuth } from '../../src/context/AuthContext';
import { picksAPI, driversAPI, leaguesAPI, f1racesAPI } from '../../src/services/apiService';
import { Driver, League, UserPickV2, PickV2, F1Race } from '../../src/types';
import Colors from '../../constants/Colors';
import { spacing, borderRadius, shadows } from '../../utils/styles';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useScreenSize } from '../../hooks/useScreenSize';
import { router } from 'expo-router';

const PicksScreen = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
    const [currentWeek, setCurrentWeek] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [currentRace, setCurrentRace] = useState<F1Race | null>(null);
    const [userPicks, setUserPicks] = useState<UserPickV2[]>([]);
    const [leaguePositions, setLeaguePositions] = useState<number[]>([]);
    const [selectedPicks, setSelectedPicks] = useState<PickV2[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only load data when auth is complete and user is authenticated
        if (!authLoading && user) {
            loadData();
        }
    }, [authLoading, user]);

    useEffect(() => {
        if (selectedLeague) {
            loadUserPicks();
            loadLeaguePositions();
        }
    }, [selectedLeague, currentWeek]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [driversResponse, leaguesResponse, currentRaceResponse] = await Promise.all([
                driversAPI.getDrivers(),
                leaguesAPI.getLeagues(),
                f1racesAPI.getCurrentRace()
            ]);

            if (driversResponse.data.success) {
                setDrivers(driversResponse.data.data);
            }

            if (leaguesResponse.data.success) {
                setLeagues(leaguesResponse.data.data);
                // If no league is selected and we have leagues, select the first one
                if (!selectedLeague && leaguesResponse.data.data.length > 0) {
                    setSelectedLeague(leaguesResponse.data.data[0].id);
                }
            }

            if (currentRaceResponse.data.success) {
                setCurrentRace(currentRaceResponse.data.data);
                setCurrentWeek(currentRaceResponse.data.data.weekNumber);
            }
        } catch (error: any) {
            console.error('Error loading data:', error);
            if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                setError('Unable to connect to server. Please check your internet connection.');
            } else {
                setError('Failed to load data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadUserPicks = async () => {
        if (!selectedLeague) return;

        try {
            const response = await picksAPI.getUserPicksV2(selectedLeague);
            if (response.data.success) {
                setUserPicks(response.data.data);
                // Convert existing picks to selectedPicks format
                const picks = response.data.data.map((pick: UserPickV2) => ({
                    position: pick.position,
                    driverId: pick.driverId
                }));
                setSelectedPicks(picks);
            }
        } catch (error: any) {
            console.error('Error loading user picks:', error);
        }
    };

    const loadLeaguePositions = async () => {
        if (!selectedLeague) return;

        try {
            const response = await picksAPI.getLeaguePositions(selectedLeague);
            if (response.data.success) {
                setLeaguePositions(response.data.data);
            }
        } catch (error: any) {
            console.error('Error loading league positions:', error);
            // Default to P10 if there's an error
            setLeaguePositions([10]);
        }
    };

    const handleLeagueChange = (leagueId: number) => {
        setSelectedLeague(leagueId);
        setSelectedPicks([]);
        setUserPicks([]);
    };

    const handleDriverSelect = (position: number, driverId: number) => {
        setSelectedPicks(prev => {
            const existing = prev.find(pick => pick.position === position);
            if (existing) {
                return prev.map(pick =>
                    pick.position === position ? { ...pick, driverId } : pick
                );
            } else {
                return [...prev, { position, driverId }];
            }
        });
    };

    const getSelectedDriver = (position: number) => {
        const pick = selectedPicks.find(p => p.position === position);
        return pick ? drivers.find(d => d.id === pick.driverId) : null;
    };

    const getDriverName = (driverId: number) => {
        const driver = drivers.find(d => d.id === driverId);
        return driver ? driver.name : 'Unknown Driver';
    };

    const submitPicks = async () => {
        if (!selectedLeague || selectedPicks.length === 0) {
            showToast('Please select a league and make your picks', 'error');
            return;
        }

        if (selectedPicks.length !== leaguePositions.length) {
            showToast(`Please make picks for all ${leaguePositions.length} required positions`, 'error');
            return;
        }

        try {
            setSubmitting(true);
            const response = await picksAPI.makePickV2(selectedLeague, currentWeek, selectedPicks);
            if (response.data.success) {
                showToast('Picks submitted successfully!', 'success');
                loadUserPicks();
            } else {
                showToast(response.data.message || 'Failed to submit picks', 'error');
            }
        } catch (error: any) {
            console.error('Error submitting picks:', error);
            showToast('Failed to submit picks. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    if (authLoading || loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.buttonPrimary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Connection Error</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (leagues.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No Leagues Found</Text>
                    <Text style={styles.emptyMessage}>
                        You need to join a league before you can make picks.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => router.push('/(tabs)/leagues')}
                    >
                        <Text style={styles.emptyButtonText}>Go to Leagues</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveContainer>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Make Your Picks</Text>
                        <Text style={styles.subtitle}>
                            Select drivers for your league&apos;s required positions
                        </Text>
                    </View>

                    {/* Current Race Info */}
                    {currentRace && (
                        <View style={styles.raceInfo}>
                            <Text style={styles.raceName}>{currentRace.raceName}</Text>
                            <Text style={styles.raceDetails}>
                                Week {currentRace.weekNumber} • {currentRace.circuitName}
                            </Text>
                            <Text style={styles.raceDate}>
                                {new Date(currentRace.raceDate).toLocaleDateString()}
                            </Text>
                        </View>
                    )}

                    {/* Main Content - Responsive Layout */}
                    {screenSize === 'tablet' ? (
                        <View style={styles.tabletLayout}>
                            {/* Left Column - League Selection & Picks */}
                            <View style={styles.tabletLeftColumn}>
                                {/* League Selection */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Select League</Text>
                                    <View style={styles.leagueSelector}>
                                        {leagues.map((league) => (
                                            <TouchableOpacity
                                                key={league.id}
                                                style={[
                                                    styles.leagueOption,
                                                    selectedLeague === league.id && styles.leagueOptionSelected
                                                ]}
                                                onPress={() => handleLeagueChange(league.id)}
                                            >
                                                <Text style={[
                                                    styles.leagueOptionText,
                                                    selectedLeague === league.id && styles.leagueOptionTextSelected
                                                ]}>
                                                    {league.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Picks Form */}
                                {selectedLeague && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Your Picks</Text>
                                        <View style={styles.picksForm}>
                                            {leaguePositions.map((position) => (
                                                <View key={position} style={styles.pickRow}>
                                                    <Text style={styles.positionLabel}>P{position}</Text>
                                                    <View style={styles.driverSelector}>
                                                        <TouchableOpacity
                                                            style={styles.driverButton}
                                                            onPress={() => {
                                                                // Show driver selection modal or navigate to driver picker
                                                                showToast(`Select driver for P${position}`, 'info');
                                                            }}
                                                        >
                                                            <Text style={styles.driverButtonText}>
                                                                {getSelectedDriver(position)
                                                                    ? getDriverName(getSelectedDriver(position)!.id)
                                                                    : 'Select Driver'
                                                                }
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Right Column - Drivers List & Submit */}
                            <View style={styles.tabletRightColumn}>
                                {/* Drivers List */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Available Drivers</Text>
                                    <View style={styles.driversGrid}>
                                        {drivers.map((driver) => (
                                            <TouchableOpacity
                                                key={driver.id}
                                                style={styles.driverCard}
                                                onPress={() => {
                                                    // Handle driver selection
                                                    showToast(`Selected ${driver.name}`, 'info');
                                                }}
                                            >
                                                <Text style={styles.driverName}>
                                                    {driver.name}
                                                </Text>
                                                <Text style={styles.driverTeam}>{driver.team}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Submit Button */}
                                {selectedLeague && (
                                    <View style={styles.section}>
                                        <TouchableOpacity
                                            style={[
                                                styles.submitButton,
                                                (selectedPicks.length !== leaguePositions.length) && styles.submitButtonDisabled
                                            ]}
                                            onPress={submitPicks}
                                            disabled={selectedPicks.length !== leaguePositions.length || submitting}
                                        >
                                            {submitting ? (
                                                <ActivityIndicator color={Colors.light.textInverse} />
                                            ) : (
                                                <Text style={styles.submitButtonText}>
                                                    Submit Picks ({selectedPicks.length}/{leaguePositions.length})
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    ) : (
                        /* Mobile Layout (existing code) */
                        <>
                            {/* League Selection */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Select League</Text>
                                <View style={styles.leagueSelector}>
                                    {leagues.map((league) => (
                                        <TouchableOpacity
                                            key={league.id}
                                            style={[
                                                styles.leagueOption,
                                                selectedLeague === league.id && styles.leagueOptionSelected
                                            ]}
                                            onPress={() => handleLeagueChange(league.id)}
                                        >
                                            <Text style={[
                                                styles.leagueOptionText,
                                                selectedLeague === league.id && styles.leagueOptionTextSelected
                                            ]}>
                                                {league.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Picks Form */}
                            {selectedLeague && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Your Picks</Text>
                                    <View style={styles.picksForm}>
                                        {leaguePositions.map((position) => (
                                            <View key={position} style={styles.pickRow}>
                                                <Text style={styles.positionLabel}>P{position}</Text>
                                                <View style={styles.driverSelector}>
                                                    <TouchableOpacity
                                                        style={styles.driverButton}
                                                        onPress={() => {
                                                            // Show driver selection modal or navigate to driver picker
                                                            showToast(`Select driver for P${position}`, 'info');
                                                        }}
                                                    >
                                                        <Text style={styles.driverButtonText}>
                                                            {getSelectedDriver(position)
                                                                ? getDriverName(getSelectedDriver(position)!.id)
                                                                : 'Select Driver'
                                                            }
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Drivers List */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Available Drivers</Text>
                                <View style={styles.driversGrid}>
                                    {drivers.map((driver) => (
                                        <TouchableOpacity
                                            key={driver.id}
                                            style={styles.driverCard}
                                            onPress={() => {
                                                // Handle driver selection
                                                showToast(`Selected ${driver.name}`, 'info');
                                            }}
                                        >
                                            <Text style={styles.driverName}>
                                                {driver.name}
                                            </Text>
                                            <Text style={styles.driverTeam}>{driver.team}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Submit Button */}
                            {selectedLeague && (
                                <View style={styles.section}>
                                    <TouchableOpacity
                                        style={[
                                            styles.submitButton,
                                            (selectedPicks.length !== leaguePositions.length) && styles.submitButtonDisabled
                                        ]}
                                        onPress={submitPicks}
                                        disabled={selectedPicks.length !== leaguePositions.length || submitting}
                                    >
                                        {submitting ? (
                                            <ActivityIndicator color={Colors.light.textInverse} />
                                        ) : (
                                            <Text style={styles.submitButtonText}>
                                                Submit Picks ({selectedPicks.length}/{leaguePositions.length})
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </ResponsiveContainer>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.error,
        marginBottom: spacing.sm,
    },
    errorMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    retryButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    retryButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    emptyMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    emptyButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    emptyButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    raceInfo: {
        backgroundColor: Colors.light.cardBackground,
        marginHorizontal: spacing.md,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        ...shadows.md,
    },
    raceName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    raceDetails: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    raceDate: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    section: {
        backgroundColor: Colors.light.cardBackground,
        marginHorizontal: spacing.md,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.md,
    },
    leagueSelector: {
        gap: spacing.sm,
    },
    leagueOption: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        backgroundColor: Colors.light.backgroundPrimary,
    },
    leagueOptionSelected: {
        backgroundColor: Colors.light.buttonPrimary,
        borderColor: Colors.light.buttonPrimary,
    },
    leagueOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    leagueOptionTextSelected: {
        color: Colors.light.textInverse,
    },
    picksForm: {
        gap: spacing.md,
    },
    pickRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    positionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        minWidth: 40,
    },
    driverSelector: {
        flex: 1,
    },
    driverButton: {
        backgroundColor: Colors.light.backgroundPrimary,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
    },
    driverButtonText: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    driversGrid: {
        gap: spacing.sm,
    },
    driverCard: {
        backgroundColor: Colors.light.backgroundPrimary,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    driverTeam: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    submitButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: Colors.light.gray500,
    },
    submitButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    // Tablet-specific styles
    tabletLayout: {
        flexDirection: 'row',
        gap: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    tabletLeftColumn: {
        flex: 2,
        gap: spacing.lg,
    },
    tabletRightColumn: {
        flex: 1,
        gap: spacing.lg,
    },
});

export default PicksScreen;

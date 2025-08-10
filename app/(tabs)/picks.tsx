import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../../src/context/ToastContext';
import { useAuth } from '../../src/context/AuthContext';
import { picksAPI, driversAPI, leaguesAPI, f1racesAPI } from '../../src/services/apiService';
import { Driver, League, UserPickV2, PickV2, F1Race } from '../../src/types';
import Colors from '../../constants/Colors';
import { spacing } from '../../utils/styles';

const PicksScreen = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { showToast } = useToast();
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
        } catch (error) {
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
        } catch (error) {
            console.error('Error loading league positions:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        if (selectedLeague) {
            await loadUserPicks();
            await loadLeaguePositions();
        }
        setRefreshing(false);
    };

    const makePick = async (position: number, driverId: number) => {
        if (!selectedLeague) {
            Alert.alert('Error', 'Please select a league first');
            return;
        }

        try {
            setSubmitting(true);

            // Update local state first
            const newPick: PickV2 = { position, driverId };
            const updatedPicks = selectedPicks.filter(pick => pick.position !== position);
            updatedPicks.push(newPick);
            setSelectedPicks(updatedPicks);

            // Submit to API
            const response = await picksAPI.makePickV2(selectedLeague, currentWeek, [newPick]);
            if (response.data.success) {
                Alert.alert('Success', `P${position} pick submitted successfully!`);
                await loadUserPicks(); // Refresh picks
            } else {
                // Revert local state if API call failed
                setSelectedPicks(selectedPicks);
                Alert.alert('Error', 'Failed to submit pick. Please try again.');
            }
        } catch (error) {
            console.error('Error making pick:', error);
            Alert.alert('Error', 'Failed to submit pick. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const removePick = async (position: number) => {
        if (!selectedLeague) {
            Alert.alert('Error', 'Please select a league first');
            return;
        }

        try {
            setSubmitting(true);

            // Update local state first
            const updatedPicks = selectedPicks.filter(pick => pick.position !== position);
            setSelectedPicks(updatedPicks);

            // Submit to API
            const response = await picksAPI.removePickV2(selectedLeague, currentWeek, position);
            if (response.data.success) {
                Alert.alert('Success', `P${position} pick removed successfully!`);
                await loadUserPicks(); // Refresh picks
            } else {
                // Revert local state if API call failed
                setSelectedPicks(selectedPicks);
                Alert.alert('Error', 'Failed to remove pick. Please try again.');
            }
        } catch (error) {
            console.error('Error removing pick:', error);
            Alert.alert('Error', 'Failed to remove pick. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getCurrentPickForPosition = (position: number) => {
        return userPicks.find(pick => pick.position === position);
    };

    const getSelectedDriverForPosition = (position: number) => {
        return selectedPicks.find(pick => pick.position === position)?.driverId;
    };

    const isPositionLocked = (position: number) => {
        const pick = getCurrentPickForPosition(position);
        return pick?.isLocked || false;
    };

    const isRaceLocked = () => {
        return currentRace?.isLocked || false;
    };

    if (authLoading || loading) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color="#007bff" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer} edges={['top', 'left', 'right']}>
                <Text style={styles.errorTitle}>Connection Error</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Make Your Picks</Text>
                </View>

                <Text style={styles.description}>Week {currentWeek} - 2025 F1 Season</Text>

                {/* League Selection */}
                <View style={styles.leagueSection}>
                    <Text style={styles.sectionTitle}>Select League</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leagueScroll}>
                        {leagues.map((league) => (
                            <TouchableOpacity
                                key={league.id}
                                style={[
                                    styles.leagueCard,
                                    selectedLeague === league.id && styles.selectedLeagueCard
                                ]}
                                onPress={() => setSelectedLeague(league.id)}
                            >
                                <View style={styles.leagueCardContent}>
                                    <View style={styles.leagueNameContainer}>
                                        <Text style={[
                                            styles.leagueName,
                                            selectedLeague === league.id && styles.selectedLeagueName
                                        ]}>
                                            {league.name}
                                        </Text>
                                    </View>
                                    <Text style={styles.leagueDetails}>
                                        {league.memberCount || 1} member{league.memberCount !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Current Race Info */}
                {currentRace && (
                    <View style={styles.raceInfoSection}>
                        <Text style={styles.sectionTitle}>Current Race</Text>
                        <View style={styles.raceCard}>
                            <Text style={styles.raceName}>{currentRace.raceName}</Text>
                            <Text style={styles.raceDate}>
                                {new Date(currentRace.raceDate).toLocaleDateString()}
                            </Text>
                            <Text style={[styles.raceStatus, isRaceLocked() && styles.lockedStatus]}>
                                Status: {isRaceLocked() ? 'Locked' : currentRace.status}
                            </Text>
                        </View>
                    </View>
                )}

                {/* League Positions */}
                {selectedLeague && leaguePositions.length > 0 && (
                    <View style={styles.positionsSection}>
                        <Text style={styles.sectionTitle}>League Positions</Text>
                        <Text style={styles.positionsSubtitle}>
                            This league requires picks for positions: {leaguePositions.map(p => `P${p}`).join(', ')}
                        </Text>
                    </View>
                )}

                {/* Position Picks */}
                {selectedLeague && leaguePositions.length > 0 && (
                    <View style={styles.picksSection}>
                        <Text style={styles.sectionTitle}>Your Picks</Text>
                        {leaguePositions.map((position) => {
                            const currentPick = getCurrentPickForPosition(position);
                            const selectedDriverId = getSelectedDriverForPosition(position);
                            const isLocked = isPositionLocked(position);
                            const isRaceLockedNow = isRaceLocked();

                            return (
                                <View key={position} style={styles.positionCard}>
                                    <View style={styles.positionHeader}>
                                        <Text style={styles.positionTitle}>P{position}</Text>
                                        {isLocked && <Text style={styles.lockedBadge}>Locked</Text>}
                                    </View>

                                    {currentPick ? (
                                        <View style={styles.currentPickCard}>
                                            <Text style={styles.currentPickDriver}>{currentPick.driverName}</Text>
                                            <Text style={styles.currentPickTeam}>{currentPick.driverTeam}</Text>
                                            {!isLocked && !isRaceLockedNow && (
                                                <TouchableOpacity
                                                    style={styles.removePickIcon}
                                                    onPress={() => removePick(position)}
                                                    disabled={submitting}
                                                >
                                                    <Text style={styles.removePickIconText}>✕</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ) : (
                                        <Text style={styles.noPickText}>No pick made yet</Text>
                                    )}

                                    {!isLocked && !isRaceLockedNow && (
                                        <View style={styles.driverSelection}>
                                            <Text style={styles.selectionTitle}>Select Driver for P{position}</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                {drivers.map((driver) => (
                                                    <TouchableOpacity
                                                        key={driver.id}
                                                        style={[
                                                            styles.driverOption,
                                                            selectedDriverId === driver.id && styles.selectedDriverOption
                                                        ]}
                                                        onPress={() => makePick(position, driver.id)}
                                                        disabled={submitting}
                                                    >
                                                        <Text style={styles.driverOptionNumber}>#{driver.driverNumber}</Text>
                                                        <Text style={styles.driverOptionName} numberOfLines={1}>{driver.name}</Text>
                                                        <Text style={styles.driverOptionTeam} numberOfLines={1}>{driver.team}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}


                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Legacy Single Pick Support */}
                {selectedLeague && leaguePositions.length === 0 && (
                    <View style={styles.legacySection}>
                        <Text style={styles.sectionTitle}>Make Your P10 Pick</Text>
                        <Text style={styles.legacySubtitle}>
                            This league uses the legacy single-pick system
                        </Text>
                        <ScrollView style={styles.driversList}>
                            {drivers.map((driver) => (
                                <TouchableOpacity
                                    key={driver.id}
                                    style={[
                                        styles.driverCard,
                                        getSelectedDriverForPosition(10) === driver.id && styles.selectedDriverCard
                                    ]}
                                    onPress={() => makePick(10, driver.id)}
                                    disabled={submitting || isRaceLocked()}
                                >
                                    <View style={styles.driverInfo}>
                                        <Text style={styles.driverNumber}>#{driver.driverNumber}</Text>
                                        <View style={styles.driverDetails}>
                                            <Text style={styles.driverName}>{driver.name}</Text>
                                            <Text style={styles.driverTeam}>{driver.team}</Text>
                                            <Text style={styles.driverCountry}>{driver.country}</Text>
                                        </View>
                                    </View>
                                    {getSelectedDriverForPosition(10) === driver.id && (
                                        <View style={styles.selectedIndicator}>
                                            <Text style={styles.selectedIndicatorText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: Platform.OS === 'android' ? 0 : 0,
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
        backgroundColor: '#f5f5f5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#dc3545',
        marginBottom: 10,
    },
    errorMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 12,
        paddingHorizontal: 20,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        minHeight: 64,
        backgroundColor: Colors.light.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: spacing.lg,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    leagueSection: {
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    leagueScroll: {
        paddingVertical: 5,
    },
    leagueCard: {
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 10,
        marginRight: 10,
        width: 150,
        height: 80,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedLeagueCard: {
        backgroundColor: '#e0e0e0',
        borderColor: '#ccc',
    },
    leagueCardContent: {
        flex: 1,
        alignItems: 'center',
    },
    leagueNameContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leagueName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    selectedLeagueName: {
        color: '#007bff',
    },
    leagueDetails: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    raceInfoSection: {
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    raceCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 15,
        marginTop: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
    },
    raceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    raceDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    raceStatus: {
        fontSize: 14,
        color: '#007bff',
    },
    lockedStatus: {
        color: '#ff4444',
    },
    positionsSection: {
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    positionsSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    picksSection: {
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    positionCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    positionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    positionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    lockedBadge: {
        backgroundColor: '#ff4444',
        color: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    currentPickCard: {
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    currentPickDriver: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    currentPickTeam: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    currentPickPoints: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
    },
    noPickText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    driverSelection: {
        marginBottom: 10,
    },
    selectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    driverOption: {
        backgroundColor: 'white',
        borderRadius: 6,
        padding: 12,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        minWidth: 120,
        maxWidth: 140,
        alignItems: 'center',
    },
    selectedDriverOption: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
    },
    driverOptionNumber: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 2,
    },
    driverOptionName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
        textAlign: 'center',
    },
    driverOptionTeam: {
        fontSize: 9,
        color: '#666',
        textAlign: 'center',
    },
    removePickIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#dc3545',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    removePickIconText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    legacySection: {
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    legacySubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    driversList: {
        maxHeight: 400,
    },
    driverCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedDriverCard: {
        backgroundColor: '#e3f2fd',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    driverDetails: {
        marginLeft: 10,
    },
    driverNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginRight: 10,
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    driverTeam: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    driverCountry: {
        fontSize: 12,
        color: '#999',
    },
    selectedIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#4caf50',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    selectedIndicatorText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default PicksScreen;

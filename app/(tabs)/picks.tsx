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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import { useAuth } from '../../src/context/AuthContext';
import { picksAPI, driversAPI, leaguesAPI, f1racesAPI } from '../../src/services/apiService';
import { Driver, League, UserPickV2, PickV2, F1Race } from '../../src/types';
import DriverSelectionModal from '../../components/DriverSelectionModal';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PicksScreen = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { showToast } = useSimpleToast();
    const { leagueId: urlLeagueId } = useLocalSearchParams();
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
    const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const insets = useSafeAreaInsets();

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

    // Handle URL parameter changes for league selection
    useEffect(() => {
        if (urlLeagueId && leagues.length > 0) {
            const urlLeagueIdNum = Number(urlLeagueId);
            const urlLeague = leagues.find((league: League) => league.id === urlLeagueIdNum);
            if (urlLeague && urlLeague.id !== selectedLeague) {
                setSelectedLeague(urlLeague.id);
            }
        }
    }, [urlLeagueId, leagues, selectedLeague]);

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
                // If we have a leagueId from URL, select that league
                if (urlLeagueId && leaguesResponse.data.data.length > 0) {
                    const urlLeagueIdNum = Number(urlLeagueId);
                    const urlLeague = leaguesResponse.data.data.find((league: League) => league.id === urlLeagueIdNum);
                    if (urlLeague) {
                        setSelectedLeague(urlLeague.id);
                    } else if (!selectedLeague) {
                        // Fallback to first league if URL league not found
                        setSelectedLeague(leaguesResponse.data.data[0].id);
                    }
                } else if (!selectedLeague && leaguesResponse.data.data.length > 0) {
                    // If no league is selected and we have leagues, select the first one
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
            showToast('Please select a league first', 'error');
            return;
        }

        // Check if picks are locked
        if (currentRace?.picksLocked) {
            showToast('Picks are currently locked for this race. Picks lock 1 hour before qualifying starts.', 'warning');
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
                showToast(`P${position} pick submitted successfully!`, 'success', 2000);
                await loadUserPicks(); // Refresh picks
            } else {
                // Revert local state if API call failed
                setSelectedPicks(selectedPicks);
                showToast('Failed to submit pick. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error making pick:', error);
            showToast('Failed to submit pick. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const removePick = async (position: number) => {
        if (!selectedLeague) {
            showToast('Please select a league first', 'error');
            return;
        }

        // Check if picks are locked
        if (currentRace?.picksLocked) {
            showToast('Picks are currently locked for this race. Picks lock 1 hour before qualifying starts.', 'warning');
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
                showToast(`P${position} pick removed successfully!`, 'success', 2000);
                await loadUserPicks(); // Refresh picks
            } else {
                // Revert local state if API call failed
                setSelectedPicks(selectedPicks);
                showToast('Failed to remove pick. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error removing pick:', error);
            showToast('Failed to remove pick. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePositionPress = (position: number) => {
        if (currentRace?.picksLocked || isRaceLocked()) {
            showToast('Picks are currently locked for this race.', 'warning');
            return;
        }
        setSelectedPosition(position);
        setShowDriverModal(true);
    };

    const handleDriverSelect = (driver: Driver) => {
        if (selectedPosition) {
            makePick(selectedPosition, driver.id);
        }
    };

    const closeDriverModal = () => {
        setShowDriverModal(false);
        setSelectedPosition(null);
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Connection Error</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top }
                ]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Show unauthenticated view for users who are not logged in */}
                {!user ? (
                    <>
                        {/* Picks Page Preview Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="calendar" size={24} color="#6b7280" />
                                <Text style={styles.cardTitle}>Picks Page Preview</Text>
                            </View>
                            <Text style={styles.cardSubtitle}>
                                This is what the picks page looks like. Log in to make your own picks!
                            </Text>
                            <View style={styles.authButtons}>
                                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/login')}>
                                    <Text style={styles.secondaryButtonText}>Log In</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/signup')}>
                                    <Text style={styles.primaryButtonText}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Current Race Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="flag" size={24} color="#6b7280" />
                                <Text style={styles.cardTitle}>Current Race</Text>
                            </View>
                            <View style={[styles.raceCard, { marginTop: 0 }]}>
                                <Text style={styles.raceName}>Dutch Grand Prix</Text>
                                <Text style={styles.raceDate}>Circuit Zandvoort, Netherlands</Text>
                                <Text style={styles.raceWeek}>Week 15 • 8/31/2025</Text>
                                <View style={styles.upcomingBadge}>
                                    <Text style={styles.upcomingBadgeText}>upcoming</Text>
                                </View>
                            </View>
                        </View>

                        {/* League Selection Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="people" size={24} color="#6b7280" />
                                <Text style={styles.cardTitle}>League Selection</Text>
                            </View>
                            <Text style={styles.cardSubtitle}>
                                Log in to see your leagues and make picks.
                            </Text>
                            <View style={styles.leagueSelectionPlaceholder}>
                                <Ionicons name="people" size={48} color="#9ca3af" />
                                <Text style={styles.leagueSelectionTitle}>League Selection</Text>
                                <Text style={styles.leagueSelectionDescription}>
                                    Choose from your leagues to make position predictions.
                                </Text>
                            </View>
                        </View>

                        {/* Position Selection Preview Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="grid" size={24} color="#6b7280" />
                                <Text style={styles.cardTitle}>Position Selection Preview</Text>
                            </View>
                            <Text style={styles.cardSubtitle}>
                                See how position predictions work.
                            </Text>
                            <View style={styles.positionPreviewGrid}>
                                <View style={styles.positionPreviewCard}>
                                    <Text style={styles.positionPreviewNumber}>P1</Text>
                                    <Text style={styles.positionPreviewLabel}>Position 1</Text>
                                    <Text style={styles.positionPreviewAction}>Select driver</Text>
                                </View>
                                <View style={styles.positionPreviewCard}>
                                    <Text style={styles.positionPreviewNumber}>P3</Text>
                                    <Text style={styles.positionPreviewLabel}>Position 3</Text>
                                    <Text style={styles.positionPreviewAction}>Select driver</Text>
                                </View>
                                <View style={styles.positionPreviewCard}>
                                    <Text style={styles.positionPreviewNumber}>P10</Text>
                                    <Text style={styles.positionPreviewLabel}>Position 10</Text>
                                    <Text style={styles.positionPreviewAction}>Select driver</Text>
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    <>
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

                                {/* Pick Locking Status Banner */}
                                {currentRace.picksLocked && (
                                    <View style={styles.lockedBanner}>
                                        <Text style={styles.lockedBannerTitle}>🔒 Picks are Locked</Text>
                                        <Text style={styles.lockedBannerMessage}>{currentRace.lockMessage}</Text>
                                    </View>
                                )}

                                {/* Pick Locking Countdown */}
                                {!currentRace.picksLocked && currentRace.showCountdown && (
                                    <View style={styles.countdownBanner}>
                                        <Text style={styles.countdownBannerTitle}>⏰ Picks Lock Soon</Text>
                                        <Text style={styles.countdownBannerMessage}>{currentRace.lockMessage}</Text>
                                    </View>
                                )}

                                <View style={styles.raceCard}>
                                    <Text style={styles.raceName}>{currentRace.raceName}</Text>
                                    <Text style={styles.raceDate}>
                                        {new Date(currentRace.raceDate).toLocaleDateString()}
                                    </Text>
                                    {currentRace.qualifyingDate && (
                                        <Text style={styles.qualifyingDate}>
                                            Qualifying: {new Date(currentRace.qualifyingDate).toLocaleDateString()}
                                        </Text>
                                    )}
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
                                        <TouchableOpacity
                                            key={position}
                                            style={[
                                                styles.positionCard,
                                                !isLocked && !isRaceLockedNow && styles.clickablePositionCard
                                            ]}
                                            onPress={() => handlePositionPress(position)}
                                            disabled={isLocked || isRaceLockedNow || submitting}
                                            activeOpacity={isLocked || isRaceLockedNow ? 1 : 0.7}
                                        >
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
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                removePick(position);
                                                            }}
                                                            disabled={submitting}
                                                        >
                                                            <Text style={styles.removePickIconText}>×</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            ) : (
                                                <View style={styles.noPickContainer}>
                                                    <Text style={styles.noPickText}>No pick made yet</Text>
                                                    {!isLocked && !isRaceLockedNow && (
                                                        <Text style={styles.tapToSelectText}>Tap to select driver</Text>
                                                    )}
                                                </View>
                                            )}
                                        </TouchableOpacity>
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

                                {/* Show pick locking message for legacy picks */}
                                {currentRace?.picksLocked && (
                                    <View style={styles.lockedBanner}>
                                        <Text style={styles.lockedBannerTitle}>🔒 Picks are Locked</Text>
                                        <Text style={styles.lockedBannerMessage}>{currentRace.lockMessage}</Text>
                                    </View>
                                )}

                                <ScrollView style={styles.driversList}>
                                    {drivers.map((driver) => (
                                        <TouchableOpacity
                                            key={driver.id}
                                            style={[
                                                styles.driverCard,
                                                getSelectedDriverForPosition(10) === driver.id && styles.selectedDriverCard
                                            ]}
                                            onPress={() => makePick(10, driver.id)}
                                            disabled={submitting || isRaceLocked() || currentRace?.picksLocked}
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
                    </>
                )}
            </ScrollView>

            {/* Driver Selection Modal */}
            <DriverSelectionModal
                visible={showDriverModal}
                onClose={closeDriverModal}
                position={selectedPosition || 0}
                drivers={drivers}
                selectedDriverId={selectedPosition ? getSelectedDriverForPosition(selectedPosition) : undefined}
                onDriverSelect={handleDriverSelect}
                disabled={currentRace?.picksLocked || isRaceLocked()}
                submitting={submitting}
                userPicks={new Map(selectedPicks.map(pick => [pick.position, pick.driverId]))}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9fafb',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#dc2626',
        marginBottom: 10,
    },
    errorMessage: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#2563eb',
        borderRadius: 6,
        padding: 12,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 64,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    description: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 24,
        marginTop: 8,
        textAlign: 'center',
    },
    leagueSection: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    leagueScroll: {
        paddingVertical: 5,
    },
    leagueCard: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
        width: 150,
        height: 80,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    selectedLeagueCard: {
        backgroundColor: '#dbeafe',
        borderColor: '#2563eb',
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
        color: '#111827',
        textAlign: 'center',
    },
    selectedLeagueName: {
        color: '#2563eb',
    },
    leagueDetails: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    raceInfoSection: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        marginBottom: 16,
    },
    raceCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 16,
        marginTop: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
    },
    raceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    raceDate: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 5,
    },
    raceWeek: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 5,
    },
    raceStatus: {
        fontSize: 14,
        color: '#2563eb',
    },
    lockedStatus: {
        color: '#dc2626',
    },
    positionsSection: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        marginBottom: 16,
    },
    positionsSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    picksSection: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        marginBottom: 16,
    },
    positionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    clickablePositionCard: {
        borderColor: '#2563eb',
        borderWidth: 2,
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
        color: '#111827',
    },
    lockedBadge: {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    currentPickCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    currentPickDriver: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    currentPickTeam: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    currentPickPoints: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    noPickText: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
        marginBottom: 4,
    },
    noPickContainer: {
        alignItems: 'center',
    },
    tapToSelectText: {
        fontSize: 12,
        color: '#2563eb',
        fontWeight: '600',
    },

    removePickIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#dc2626',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        overflow: 'hidden',
        display: 'flex',
    },
    removePickIconText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        lineHeight: 24,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        flex: 1,
    },
    legacySection: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        marginBottom: 16,
    },
    legacySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 15,
    },
    driversList: {
        maxHeight: 400,
    },
    driverCard: {
        backgroundColor: '#ffffff',
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
        backgroundColor: '#eff6ff',
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
        color: '#6b7280',
        marginRight: 10,
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    driverTeam: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    driverCountry: {
        fontSize: 12,
        color: '#9ca3af',
    },
    selectedIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#059669',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffffff',
    },
    selectedIndicatorText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    lockedBanner: {
        backgroundColor: '#dc2626',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    lockedBannerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    lockedBannerMessage: {
        fontSize: 12,
        color: '#ffffff',
        textAlign: 'center',
    },
    countdownBanner: {
        backgroundColor: '#d97706',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    countdownBannerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    countdownBannerMessage: {
        fontSize: 12,
        color: '#ffffff',
        textAlign: 'center',
    },
    qualifyingDate: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    // New styles for unauthenticated view
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 4,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginLeft: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        paddingHorizontal: 24,
        lineHeight: 20,
    },
    authButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    primaryButton: {
        backgroundColor: '#2563eb',
        borderRadius: 6,
        padding: 12,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 12,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    secondaryButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    leagueSelectionPlaceholder: {
        alignItems: 'center',
        padding: 32,
        paddingHorizontal: 24,
    },
    leagueSelectionIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    leagueSelectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 5,
    },
    leagueSelectionDescription: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    positionPreviewGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    positionPreviewCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 16,
        width: '30%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        opacity: 0.7,
    },
    positionPreviewNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#9ca3af',
        marginBottom: 5,
    },
    positionPreviewLabel: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 5,
    },
    positionPreviewAction: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '400',
        fontStyle: 'italic',
    },
    upcomingBadge: {
        backgroundColor: '#059669',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    upcomingBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default PicksScreen;


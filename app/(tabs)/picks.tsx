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
import { useTheme } from '../../src/context/ThemeContext';
import { picksAPI, driversAPI, leaguesAPI, f1racesAPI } from '../../src/services/apiService';
import { Driver, League, UserPickV2, PickV2, F1Race } from '../../src/types';
import DriverSelectionModal from '../../components/DriverSelectionModal';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors } from '../../src/constants/Colors';
import { createThemeStyles } from '../../src/styles/universalStyles';
import { formatTimeRemainingLocal } from '../../utils/timeUtils';

const PicksScreen = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { showToast } = useSimpleToast();
    const { resolvedTheme } = useTheme();

    // Get current theme colors from universal palette
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors
    const universalStyles = createThemeStyles(currentColors);

    // Create picks-specific styles with current theme colors
    const styles = StyleSheet.create({
        scrollContent: {
            padding: 16,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        errorTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: 8,
        },
        errorMessage: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginBottom: 20,
        },
        retryButton: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
        },
        retryButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: '600',
        },
        card: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        cardTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginLeft: 8,
        },
        cardSubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 16,
            lineHeight: 20,
        },
        authButtons: {
            flexDirection: 'row',
            gap: 8,
        },
        primaryButton: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        primaryButtonText: {
            color: currentColors.textInverse,
            fontSize: 14,
            fontWeight: '500',
        },
        secondaryButton: {
            backgroundColor: currentColors.cardBackground,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        secondaryButtonText: {
            color: currentColors.textSecondary,
            fontSize: 14,
            fontWeight: '500',
        },
        raceCard: {
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: 8,
            padding: 16,
            marginTop: 12,
        },
        raceName: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 4,
        },
        raceDate: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 4,
        },
        raceWeek: {
            fontSize: 12,
            color: currentColors.textTertiary,
        },
        upcomingBadge: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            alignSelf: 'flex-start',
            marginTop: 8,
        },
        upcomingBadgeText: {
            color: currentColors.textInverse,
            fontSize: 10,
            fontWeight: '500',
            textTransform: 'uppercase',
        },
        leagueSelectionPlaceholder: {
            alignItems: 'center',
            paddingVertical: 24,
        },
        leagueSelectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginTop: 12,
            marginBottom: 8,
        },
        leagueSelectionDescription: {
            fontSize: 14,
            color: currentColors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
        },
        positionPreviewGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        positionPreviewCard: {
            width: '48%',
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: 8,
            padding: 12,
            alignItems: 'center',
        },
        positionPreviewTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 4,
        },
        positionPreviewSubtitle: {
            fontSize: 12,
            color: currentColors.textSecondary,
            textAlign: 'center',
        },
        header: {
            paddingHorizontal: 0,
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
            minHeight: 64,
            flexDirection: 'row',
            alignItems: 'center',
        },
        leagueSelector: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
        },
        leagueSelectorText: {
            fontSize: 16,
            color: currentColors.textPrimary,
            marginLeft: 8,
            flex: 1,
        },
        leagueSelectorIcon: {
            marginLeft: 8,
        },
        raceInfo: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        raceInfoTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 8,
        },
        raceInfoDetails: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
        },
        raceInfoLabel: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        raceInfoValue: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textPrimary,
        },
        positionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        positionCard: {
            width: '48%',
            backgroundColor: currentColors.cardBackground,
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        clickablePositionCard: {
            borderColor: currentColors.primary,
        },
        positionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        positionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
        },
        currentPickCard: {
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: 6,
            padding: 8,
            position: 'relative',
        },
        currentPickDriver: {
            fontSize: 14,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 2,
        },
        currentPickTeam: {
            fontSize: 12,
            color: currentColors.textSecondary,
        },
        removePickIcon: {
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: currentColors.error,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
        },
        noPickContainer: {
            alignItems: 'center',
            paddingVertical: 16,
        },
        noPickText: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 4,
        },
        tapToSelectText: {
            fontSize: 12,
            color: currentColors.textTertiary,
            fontStyle: 'italic',
        },
        legacySection: {
            marginTop: 16,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 8,
        },
        legacySubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 16,
            lineHeight: 20,
        },
        lockedBanner: {
            backgroundColor: currentColors.warningLight,
            borderColor: currentColors.warning,
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
        },
        lockedBannerTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.warning,
            marginBottom: 4,
        },
        lockedBannerMessage: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        driversList: {
            maxHeight: 300,
        },
        driverCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: currentColors.cardBackground,
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        selectedDriverCard: {
            borderColor: currentColors.primary,
            backgroundColor: currentColors.primary + '20', // Use primary with 20% opacity
        },
        driverInfo: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
        },
        driverNumber: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.primary,
            marginRight: 12,
            minWidth: 30,
        },
        driverDetails: {
            flex: 1,
        },
        driverName: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 2,
        },
        driverTeam: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 2,
        },
        driverCountry: {
            fontSize: 12,
            color: currentColors.textTertiary,
        },
        selectedIndicator: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: currentColors.success,
            justifyContent: 'center',
            alignItems: 'center',
        },
        selectedIndicatorText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: 'bold',
        },
        // Missing styles that are used in JSX
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            paddingHorizontal: 16,
        },
        description: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginBottom: 16,
            textAlign: 'center',
        },
        leagueSection: {
            marginBottom: 24,
        },
        leagueScroll: {
            marginTop: 12,
        },
        leagueCard: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 8,
            padding: 16,
            marginRight: 12,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            minWidth: 120,
        },
        selectedLeagueCard: {
            borderColor: currentColors.primary,
            borderWidth: 2,
            shadowColor: currentColors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        },
        leagueCardContent: {
            alignItems: 'center',
        },
        leagueNameContainer: {
            marginBottom: 8,
        },
        leagueName: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
            textAlign: 'center',
        },
        selectedLeagueName: {
            color: currentColors.primary,
            fontWeight: '700',
        },
        leagueDetails: {
            fontSize: 12,
            color: currentColors.textSecondary,
            textAlign: 'center',
        },
        raceInfoSection: {
            marginBottom: 24,
        },
        positionsSection: {
            marginBottom: 24,
        },
        positionsSubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 16,
            textAlign: 'center',
        },
        picksSection: {
            marginBottom: 24,
        },
        // Missing styles that are used in JSX
        positionPreviewNumber: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.primary,
            marginBottom: 4,
        },
        positionPreviewLabel: {
            fontSize: 12,
            color: currentColors.textSecondary,
            marginBottom: 2,
            textAlign: 'center',
        },
        positionPreviewAction: {
            fontSize: 10,
            color: currentColors.textTertiary,
            textAlign: 'center',
            fontStyle: 'italic',
        },
        countdownBanner: {
            backgroundColor: currentColors.info + '20',
            borderColor: currentColors.info,
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
        },
        countdownBannerTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.info,
            marginBottom: 4,
        },
        countdownBannerMessage: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        countdownBannerSubtext: {
            fontSize: 12,
            color: currentColors.textTertiary,
            marginTop: 4,
        },
        qualifyingDate: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 4,
        },
        raceStatus: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        lockedStatus: {
            color: currentColors.warning,
        },
        // Sprint race styles
        sprintSection: {
            marginBottom: 24,
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: 12,
            padding: 16,
        },
        sprintHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        raceSection: {
            marginBottom: 24,
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: 12,
            padding: 16,
        },
        raceHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        sectionSubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 16,
        },
        lockedBadge: {
            backgroundColor: currentColors.error,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        lockedBadgeText: {
            color: currentColors.textInverse,
            fontSize: 12,
            fontWeight: '600',
        },
        eventTypeSelector: {
            flexDirection: 'row',
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: 8,
            padding: 4,
        },
        eventTypeButton: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
        },
        selectedEventTypeButton: {
            backgroundColor: currentColors.primary,
        },
        eventTypeButtonText: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textSecondary,
        },
        selectedEventTypeButtonText: {
            color: currentColors.textInverse,
        },
        // Additional sprint race styles
        positionNumber: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        removePickButton: {
            backgroundColor: currentColors.error,
            borderRadius: 12,
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
        },
        pickContainer: {
            marginTop: 8,
        },
        pickDriverName: {
            fontSize: 14,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 2,
        },
        pickDriverTeam: {
            fontSize: 12,
            color: currentColors.textSecondary,
        },
    });

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
    const [sprintPicks, setSprintPicks] = useState<UserPickV2[]>([]);
    const [leaguePositions, setLeaguePositions] = useState<number[]>([]);
    const [selectedPicks, setSelectedPicks] = useState<PickV2[]>([]);
    const [selectedSprintPicks, setSelectedSprintPicks] = useState<PickV2[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
    const [selectedEventType, setSelectedEventType] = useState<'race' | 'sprint'>('race');
    const [defaultEventTypeSet, setDefaultEventTypeSet] = useState(false);
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
            if (currentRace?.hasSprint) {
                loadSprintPicks();
            }
        }
    }, [selectedLeague, currentWeek, currentRace?.hasSprint]);

    // Set default event type based on whether it's a sprint weekend (only once when race is first loaded)
    useEffect(() => {
        if (currentRace && !defaultEventTypeSet) {
            if (currentRace.hasSprint) {
                setSelectedEventType('sprint');
            } else {
                setSelectedEventType('race');
            }
            setDefaultEventTypeSet(true);
        }
    }, [currentRace, defaultEventTypeSet]);

    // Handle URL parameter changes for league selection
    useEffect(() => {
        if (urlLeagueId && leagues.length > 0) {
            const urlLeagueIdNum = Number(urlLeagueId);
            const urlLeague = leagues.find((league: League) => league.id === urlLeagueIdNum);
            if (urlLeague && !selectedLeague) {
                // Only set from URL if no league is currently selected
                setSelectedLeague(urlLeague.id);
            }
        }
    }, [urlLeagueId, leagues]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [driversResponse, leaguesResponse, currentRaceResponse] = await Promise.all([
                driversAPI.getDrivers(),
                leaguesAPI.getLeagues(),
                f1racesAPI.getCurrentRace()
            ]);

            if (driversResponse.data.success && driversResponse.data.data) {
                const validDrivers = Array.isArray(driversResponse.data.data)
                    ? driversResponse.data.data.filter((driver: any) => driver && driver.id && driver.name)
                    : [];
                setDrivers(validDrivers);
            } else {
                setDrivers([]);
            }

            if (leaguesResponse.data.success && leaguesResponse.data.data) {
                const validLeagues = Array.isArray(leaguesResponse.data.data)
                    ? leaguesResponse.data.data.filter((league: any) => league && league.id)
                    : [];
                setLeagues(validLeagues);

                // If we have a leagueId from URL, select that league
                if (urlLeagueId && validLeagues.length > 0) {
                    const urlLeagueIdNum = Number(urlLeagueId);
                    const urlLeague = validLeagues.find((league: League) => league.id === urlLeagueIdNum);
                    if (urlLeague) {
                        setSelectedLeague(urlLeague.id);
                    } else if (!selectedLeague) {
                        // Fallback to first league if URL league not found
                        setSelectedLeague(validLeagues[0].id);
                    }
                } else if (!selectedLeague && validLeagues.length > 0) {
                    // If no league is selected and we have leagues, select the first one
                    setSelectedLeague(validLeagues[0].id);
                }
            } else {
                setLeagues([]);
            }

            if (currentRaceResponse.data.success && currentRaceResponse.data.data) {
                setCurrentRace(currentRaceResponse.data.data);
                setCurrentWeek(currentRaceResponse.data.data.weekNumber || 1);
                setDefaultEventTypeSet(false); // Reset flag when week changes
            } else {
                setCurrentRace(null);
                setCurrentWeek(1);
                setDefaultEventTypeSet(false); // Reset flag when week changes
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
            if (response.data.success && response.data.data) {
                // Ensure data is an array and filter out any invalid entries
                const validPicks = Array.isArray(response.data.data)
                    ? response.data.data.filter((pick: any) => pick && typeof pick.position === 'number' && pick.driverId)
                    : [];

                // Filter picks by current week
                const currentWeekPicks = validPicks.filter((pick: UserPickV2) => pick.weekNumber === currentWeek);

                setUserPicks(currentWeekPicks);

                // Convert existing picks to selectedPicks format
                const picks = currentWeekPicks.map((pick: UserPickV2) => ({
                    position: pick.position,
                    driverId: pick.driverId
                }));
                setSelectedPicks(picks);
            } else {
                setUserPicks([]);
                setSelectedPicks([]);
            }
        } catch (error) {
            console.error('Error loading user picks:', error);
            setUserPicks([]);
            setSelectedPicks([]);
        }
    };

    const loadSprintPicks = async () => {
        if (!selectedLeague) return;

        try {
            const response = await picksAPI.getUserPicksForEvent(selectedLeague, 'sprint');
            if (response.data.success && response.data.data) {
                // Ensure data is an array and filter out any invalid entries
                const validPicks = Array.isArray(response.data.data)
                    ? response.data.data.filter((pick: any) => pick && typeof pick.position === 'number' && pick.driverId)
                    : [];

                // Filter picks by current week
                const currentWeekPicks = validPicks.filter((pick: UserPickV2) => pick.weekNumber === currentWeek);

                setSprintPicks(currentWeekPicks);

                // Convert existing picks to selectedSprintPicks format
                const picks = currentWeekPicks.map((pick: UserPickV2) => ({
                    position: pick.position,
                    driverId: pick.driverId
                }));
                setSelectedSprintPicks(picks);
            } else {
                setSprintPicks([]);
                setSelectedSprintPicks([]);
            }
        } catch (error) {
            console.error('Error loading sprint picks:', error);
            setSprintPicks([]);
            setSelectedSprintPicks([]);
        }
    };

    const loadLeaguePositions = async () => {
        if (!selectedLeague) return;

        try {
            const response = await picksAPI.getLeaguePositions(selectedLeague);
            if (response.data.success && response.data.data) {
                // Ensure data is an array and filter out any invalid entries
                const validPositions = Array.isArray(response.data.data)
                    ? response.data.data.filter((pos: any) => pos && typeof pos === 'number')
                    : [];
                setLeaguePositions(validPositions);
            } else {
                setLeaguePositions([]);
            }
        } catch (error) {
            console.error('Error loading league positions:', error);
            setLeaguePositions([]);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        if (selectedLeague) {
            await loadUserPicks();
            await loadLeaguePositions();
            if (currentRace?.hasSprint) {
                await loadSprintPicks();
            }
        }
        setRefreshing(false);
    };

    const makePick = async (position: number, driverId: number, eventType: 'race' | 'sprint' = 'race') => {
        if (!selectedLeague) {
            showToast('Please select a league first', 'error');
            return;
        }

        // Check if picks are locked
        if (currentRace && Boolean(currentRace.picksLocked)) {
            showToast('Picks are currently locked for this race. Picks lock 5 minutes before qualifying starts.', 'warning');
            return;
        }

        try {
            setSubmitting(true);

            // Update local state first
            const newPick: PickV2 = { position, driverId };

            if (eventType === 'race') {
                const updatedPicks = selectedPicks.filter(pick => pick.position !== position);
                updatedPicks.push(newPick);
                setSelectedPicks(updatedPicks);
            } else {
                const updatedPicks = selectedSprintPicks.filter(pick => pick.position !== position);
                updatedPicks.push(newPick);
                setSelectedSprintPicks(updatedPicks);
            }

            // Submit to API
            const response = eventType === 'race'
                ? await picksAPI.makePickV2(selectedLeague, currentWeek, [newPick])
                : await picksAPI.makeSprintPickV2(selectedLeague, currentWeek, [newPick]);

            if (response.data.success) {
                showToast(`${eventType === 'race' ? 'Race' : 'Sprint'} P${position} pick submitted successfully!`, 'success', 2000);
                await loadUserPicks(); // Refresh picks
                if (eventType === 'sprint') {
                    await loadSprintPicks(); // Refresh sprint picks
                }
            } else {
                // Revert local state if API call failed
                if (eventType === 'race') {
                    setSelectedPicks(selectedPicks);
                } else {
                    setSelectedSprintPicks(selectedSprintPicks);
                }
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
        if (currentRace && Boolean(currentRace.picksLocked)) {
            showToast('Picks are currently locked for this race. Picks lock 5 minutes before qualifying starts.', 'warning');
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

    const removeSprintPick = async (position: number) => {
        if (!selectedLeague) {
            showToast('Please select a league first', 'error');
            return;
        }

        // Check if picks are locked
        if (currentRace && Boolean(currentRace.picksLocked)) {
            showToast('Picks are currently locked for this race. Picks lock 5 minutes before qualifying starts.', 'warning');
            return;
        }

        try {
            setSubmitting(true);

            // Update local state first
            const updatedPicks = selectedSprintPicks.filter(pick => pick.position !== position);
            setSelectedSprintPicks(updatedPicks);

            // Submit to API
            const response = await picksAPI.removeSprintPickV2(selectedLeague, currentWeek, position);
            if (response.data.success) {
                showToast(`Sprint P${position} pick removed successfully!`, 'success', 2000);
                await loadSprintPicks(); // Refresh sprint picks
            } else {
                // Revert local state if API call failed
                setSelectedSprintPicks(selectedSprintPicks);
                showToast('Failed to remove sprint pick. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error removing sprint pick:', error);
            // Revert local state if API call failed
            setSelectedSprintPicks(selectedSprintPicks);
            showToast('Failed to remove sprint pick. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePositionPress = (position: number) => {
        if ((currentRace && Boolean(currentRace.picksLocked)) || isRaceLocked()) {
            showToast('Picks are currently locked for this race.', 'warning');
            return;
        }
        setSelectedPosition(position);
        setShowDriverModal(true);
    };

    const handleDriverSelect = (driver: Driver) => {
        if (selectedPosition) {
            makePick(selectedPosition, driver.id, selectedEventType);
        }
    };

    const closeDriverModal = () => {
        setShowDriverModal(false);
        setSelectedPosition(null);
    };

    const getCurrentPickForPosition = (position: number, eventType: 'race' | 'sprint' = 'race') => {
        const picks = eventType === 'race' ? userPicks : sprintPicks;
        if (!picks || !Array.isArray(picks)) return null;
        return picks.find(pick => pick && pick.position === position);
    };

    const getSelectedDriverForPosition = (position: number, eventType: 'race' | 'sprint' = 'race') => {
        const picks = eventType === 'race' ? selectedPicks : selectedSprintPicks;
        if (!picks || !Array.isArray(picks)) return null;
        const pick = picks.find(pick => pick && pick.position === position);
        return pick ? pick.driverId : null;
    };

    const isPositionLocked = (position: number) => {
        const pick = getCurrentPickForPosition(position);
        return pick && Boolean(pick.isLocked);
    };

    const isRaceLocked = () => {
        if (!currentRace || currentRace.picksLocked === undefined || currentRace.picksLocked === null) {
            return false;
        }
        // Handle both boolean and number types from API
        const picksLocked = currentRace.picksLocked;
        return Boolean(picksLocked);
    };

    // Time formatting is now handled by the imported utility function

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
        <View style={universalStyles.container}>
            {/* Header - outside ScrollView for edge-to-edge */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Text style={styles.title}>Make Your Picks</Text>
            </View>

            <ScrollView
                style={universalStyles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 70 }
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
                                    <Text style={styles.positionPreviewNumber}>P10</Text>
                                    <Text style={styles.positionPreviewLabel}>Position 10</Text>
                                    <Text style={styles.positionPreviewAction}>Select driver</Text>
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    <>
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
                                {currentRace.picksLocked && Boolean(currentRace.picksLocked) && (
                                    <View style={styles.lockedBanner}>
                                        <Text style={styles.lockedBannerTitle}>🔒 Picks are Locked</Text>
                                        <Text style={styles.lockedBannerMessage}>{currentRace.lockMessage || 'Picks are locked for this race'}</Text>
                                    </View>
                                )}

                                {/* Pick Locking Countdown */}
                                {!Boolean(currentRace.picksLocked) && Boolean(currentRace.showCountdown) && (
                                    <View style={styles.countdownBanner}>
                                        <Text style={styles.countdownBannerTitle}>⏰ Picks Lock Soon</Text>
                                        <Text style={styles.countdownBannerMessage}>
                                            {currentRace.lockTime ? (
                                                <>
                                                    Picks will lock in {(() => {
                                                        try {
                                                            return formatTimeRemainingLocal(currentRace.lockTime, { compact: true });
                                                        } catch (e) {
                                                            return 'soon';
                                                        }
                                                    })()} for {currentRace.raceName || 'this race'}
                                                    {'\n'}
                                                    <Text style={styles.countdownBannerSubtext}>
                                                        Lock time: {(() => {
                                                            try {
                                                                return new Date(currentRace.lockTime).toLocaleString();
                                                            } catch (e) {
                                                                return 'Invalid date';
                                                            }
                                                        })()}
                                                    </Text>
                                                </>
                                            ) : (
                                                currentRace.lockMessage || 'Picks will lock soon'
                                            )}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.raceCard}>
                                    <Text style={styles.raceName}>{currentRace.raceName || 'Race'}</Text>
                                    <Text style={styles.raceDate}>
                                        {currentRace.raceDate ? (() => {
                                            try {
                                                return new Date(currentRace.raceDate).toLocaleDateString();
                                            } catch (e) {
                                                return 'Invalid date';
                                            }
                                        })() : 'Date TBD'}
                                    </Text>
                                    {currentRace.qualifyingDate && (
                                        <Text style={styles.qualifyingDate}>
                                            Qualifying: {(() => {
                                                try {
                                                    return new Date(currentRace.qualifyingDate).toLocaleDateString();
                                                } catch (e) {
                                                    return 'Invalid date';
                                                }
                                            })()}
                                        </Text>
                                    )}
                                    <Text style={[styles.raceStatus, isRaceLocked() && styles.lockedStatus]}>
                                        Status: {isRaceLocked() ? 'Locked' : (currentRace.status || 'Unknown')}
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


                        {/* Legacy Single Pick Support */}
                        {selectedLeague && leaguePositions.length === 0 && (
                            <View style={styles.legacySection}>
                                <Text style={styles.sectionTitle}>Make Your P10 Pick</Text>
                                <Text style={styles.legacySubtitle}>
                                    This league uses the legacy single-pick system
                                </Text>

                                {/* Show pick locking message for legacy picks */}
                                {currentRace && Boolean(currentRace.picksLocked) && (
                                    <View style={styles.lockedBanner}>
                                        <Text style={styles.lockedBannerTitle}>🔒 Picks are Locked</Text>
                                        <Text style={styles.lockedBannerMessage}>{currentRace.lockMessage || 'Picks are locked for this race'}</Text>
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
                                            disabled={submitting || isRaceLocked() || (currentRace ? Boolean(currentRace.picksLocked) : false)}
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

                        {/* Sprint Race Picks Section */}
                        {selectedLeague && currentRace?.hasSprint && (
                            <View style={styles.sprintSection}>
                                <View style={styles.sprintHeader}>
                                    <Text style={styles.sectionTitle}>Sprint Race Picks</Text>
                                    {currentRace?.picksLocked && (
                                        <View style={styles.lockedBadge}>
                                            <Text style={styles.lockedBadgeText}>Picks Locked</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.sectionSubtitle}>
                                    Week {currentWeek} - {currentRace?.raceName}
                                </Text>

                                <View style={styles.positionsGrid}>
                                    {leaguePositions.map((position) => {
                                        const currentPick = getCurrentPickForPosition(position, 'sprint');
                                        const isLocked = isPositionLocked(position);
                                        const isRaceLockedNow = isRaceLocked();

                                        return (
                                            <TouchableOpacity
                                                key={`sprint-${position}`}
                                                style={[
                                                    styles.positionCard,
                                                    !isLocked && !isRaceLockedNow && styles.clickablePositionCard
                                                ]}
                                                onPress={() => {
                                                    if (!isLocked && !isRaceLockedNow) {
                                                        setSelectedPosition(position);
                                                        setSelectedEventType('sprint');
                                                        setShowDriverModal(true);
                                                    }
                                                }}
                                                disabled={isLocked || isRaceLockedNow}
                                            >
                                                <View style={styles.positionHeader}>
                                                    <Text style={styles.positionNumber}>P{position}</Text>
                                                    {currentPick && !isLocked && !isRaceLockedNow && (
                                                        <TouchableOpacity
                                                            style={styles.removePickButton}
                                                            onPress={() => removeSprintPick(position)}
                                                            disabled={submitting}
                                                        >
                                                            <Ionicons name="close" size={16} color={currentColors.textInverse} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>

                                                {currentPick ? (
                                                    <View style={styles.pickContainer}>
                                                        <Text style={styles.pickDriverName}>{currentPick.driverName}</Text>
                                                        <Text style={styles.pickDriverTeam}>{currentPick.driverTeam}</Text>
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
                            </View>
                        )}

                        {/* Main Race Picks Section */}
                        {selectedLeague && (
                            <View style={styles.raceSection}>
                                <View style={styles.raceHeader}>
                                    <Text style={styles.sectionTitle}>Grand Prix Picks</Text>
                                    {currentRace?.picksLocked && (
                                        <View style={styles.lockedBadge}>
                                            <Text style={styles.lockedBadgeText}>Picks Locked</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.sectionSubtitle}>
                                    Week {currentWeek} - {currentRace?.raceName}
                                </Text>

                                <View style={styles.positionsGrid}>
                                    {leaguePositions.map((position) => {
                                        const currentPick = getCurrentPickForPosition(position, 'race');
                                        const isLocked = isPositionLocked(position);
                                        const isRaceLockedNow = isRaceLocked();

                                        return (
                                            <TouchableOpacity
                                                key={`race-${position}`}
                                                style={[
                                                    styles.positionCard,
                                                    !isLocked && !isRaceLockedNow && styles.clickablePositionCard
                                                ]}
                                                onPress={() => {
                                                    if (!isLocked && !isRaceLockedNow) {
                                                        setSelectedPosition(position);
                                                        setSelectedEventType('race');
                                                        setShowDriverModal(true);
                                                    }
                                                }}
                                                disabled={isLocked || isRaceLockedNow}
                                            >
                                                <View style={styles.positionHeader}>
                                                    <Text style={styles.positionNumber}>P{position}</Text>
                                                    {currentPick && !isLocked && !isRaceLockedNow && (
                                                        <TouchableOpacity
                                                            style={styles.removePickButton}
                                                            onPress={() => removePick(position)}
                                                            disabled={submitting}
                                                        >
                                                            <Ionicons name="close" size={16} color={currentColors.textInverse} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>

                                                {currentPick ? (
                                                    <View style={styles.pickContainer}>
                                                        <Text style={styles.pickDriverName}>{currentPick.driverName}</Text>
                                                        <Text style={styles.pickDriverTeam}>{currentPick.driverTeam}</Text>
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
                selectedDriverId={selectedPosition ? getSelectedDriverForPosition(selectedPosition) || undefined : undefined}
                onDriverSelect={handleDriverSelect}
                disabled={(currentRace ? Boolean(currentRace.picksLocked) : false) || isRaceLocked()}
                submitting={submitting}
                userPicks={new Map(selectedPicks.map(pick => [pick.position, pick.driverId]))}
            />
        </View>
    );
};

export default PicksScreen;


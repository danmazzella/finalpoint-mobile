import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { picksAPI, f1racesAPI, leaguesAPI } from '../src/services/apiService';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { spacing, borderRadius, shadows } from '../utils/styles';
import Avatar from '../src/components/Avatar';

interface RaceResultV2 {
    userId: number;
    userName: string;
    userAvatar?: string;
    picks: {
        position: number;
        driverId: number | null;
        driverName: string | null;
        driverTeam: string | null;
        actualDriverId: number;
        actualDriverName: string;
        actualDriverTeam: string;
        positionDifference: number | null;
        isCorrect: boolean;
        points: number;
    }[];
    totalPoints: number;
    totalCorrect: number;
    hasMadeAllPicks: boolean;
}

interface Race {
    id: number;
    weekNumber: number;
    raceName: string;
    status: string;
}

interface League {
    id: number;
    name: string;
    description?: string;
    ownerId: number;
    joinCode: string;
    memberCount: number;
    requiredPositions?: number[];
}

const RaceResultsScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useSimpleToast();
    const { user } = useAuth();
    const { resolvedTheme } = useTheme();
    const leagueId = Number(params.leagueId);
    const weekNumber = Number(params.weekNumber);

    // Get current theme colors from universal palette
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors
    const universalStyles = createThemeStyles(currentColors);

    const [results, setResults] = useState<RaceResultV2[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekLoading, setWeekLoading] = useState(false);
    const [races, setRaces] = useState<Race[]>([]);
    const [selectedWeek, setSelectedWeek] = useState(weekNumber || 0);
    const [showWeekSelector, setShowWeekSelector] = useState(false);
    const [league, setLeague] = useState<League | null>(null);
    const [requiredPositions, setRequiredPositions] = useState<number[]>([10]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [leagueId, selectedWeek]);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentColors.backgroundPrimary,
        },
        scrollView: {
            flex: 1,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            marginTop: spacing.md,
            fontSize: 16,
            color: currentColors.textSecondary,
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
            color: currentColors.textPrimary,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
        },
        errorMessage: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.lg,
        },
        retryButton: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
        },
        retryButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: '600',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: spacing.lg,
            paddingVertical: spacing.md,
            minHeight: 64,
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
        },
        backButton: {
            paddingLeft: spacing.md,
            paddingRight: spacing.sm,
            paddingVertical: spacing.sm,
            marginRight: spacing.sm,
        },
        headerContent: {
            flex: 1,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: spacing.xs,
        },
        subtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        weekNavigation: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.xs,
        },
        navButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: currentColors.backgroundSecondary,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        navButtonDisabled: {
            backgroundColor: currentColors.backgroundTertiary,
            borderColor: currentColors.borderMedium,
        },
        navButtonText: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textPrimary,
            marginHorizontal: spacing.xs,
        },
        navButtonTextDisabled: {
            color: currentColors.textSecondary,
        },
        weekSelector: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: currentColors.backgroundSecondary,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
            marginHorizontal: spacing.sm,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        weekNumber: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textSecondary,
            marginRight: spacing.sm,
        },
        raceName: {
            fontSize: 14,
            color: currentColors.textSecondary,
            flex: 1,
            marginHorizontal: spacing.sm,
        },
        weekSelectorButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: currentColors.backgroundSecondary,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
            marginHorizontal: spacing.sm,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        weekSelectorContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        weekDropdown: {
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: borderRadius.md,
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            ...shadows.md,
        },
        weekOption: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
        },
        weekOptionSelected: {
            backgroundColor: currentColors.primary + '20',
        },
        weekOptionContent: {
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
        },
        weekOptionText: {
            fontSize: 16,
            fontWeight: '500',
            color: currentColors.textPrimary,
            includeFontPadding: false,
            textAlignVertical: 'center',
        },
        weekOptionTextSelected: {
            color: currentColors.primary,
            fontWeight: '600',
            includeFontPadding: false,
            textAlignVertical: 'center',
        },
        weekOptionSubtext: {
            fontSize: 14,
            color: currentColors.textSecondary,
            flex: 1,
            marginLeft: spacing.sm,
            includeFontPadding: false,
            textAlignVertical: 'center',
        },
        weekOptionSubtextSelected: {
            color: currentColors.primary,
            includeFontPadding: false,
            textAlignVertical: 'center',
        },
        summaryContainer: {
            flexDirection: 'row',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            gap: spacing.md,
            justifyContent: 'space-between',
        },
        unscoredSummaryContainer: {
            flexDirection: 'row',
            paddingVertical: spacing.xs,
            gap: spacing.md,
            justifyContent: 'space-between',
        },
        summaryCard: {
            flex: 1,
            backgroundColor: currentColors.cardBackground,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 60,
            maxWidth: '32%',
            ...shadows.sm,
        },
        summaryCardGrid: {
            flex: 1,
            backgroundColor: currentColors.cardBackground,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 60,
            width: '45%',
            maxWidth: '45%',
            flexBasis: '45%',
            ...shadows.sm,
        },
        summaryLabel: {
            fontSize: 12,
            fontWeight: '500',
            color: currentColors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: spacing.xs,
            textAlign: 'center',
            flexWrap: 'wrap',
        },
        summaryValue: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            textAlign: 'center',
        },
        section: {
            marginBottom: spacing.sm,
            marginTop: spacing.lg,
        },
        unscoredSection: {
            marginBottom: spacing.sm,
            marginTop: 0,
            marginHorizontal: spacing.md,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: spacing.xs,
            paddingHorizontal: spacing.md,
        },
        raceStatusTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: spacing.xs,
            marginTop: spacing.lg,
            paddingHorizontal: 0,
        },
        unscoredSectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: spacing.sm,
            paddingHorizontal: 0,
        },
        resultsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
            justifyContent: 'space-between',
        },
        actualResultsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
            justifyContent: 'space-between',
        },
        actualResultCard: {
            width: '48%',
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            ...shadows.sm,
        },
        actualPositionLabel: {
            fontSize: 11,
            fontWeight: '500',
            color: currentColors.textSecondary,
            marginBottom: spacing.xs,
            textAlign: 'center',
        },
        resultCard: {
            width: '48%',
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
            marginHorizontal: '1%',
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            ...shadows.sm,
        },
        positionLabel: {
            fontSize: 11,
            fontWeight: '500',
            color: currentColors.textSecondary,
            marginBottom: spacing.xs,
            textAlign: 'center',
        },
        driverName: {
            fontSize: 14,
            fontWeight: '600',
            color: currentColors.textPrimary,
            textAlign: 'center',
        },
        driverTeam: {
            fontSize: 12,
            color: currentColors.textSecondary,
            textAlign: 'center',
        },
        noResult: {
            fontSize: 12,
            color: currentColors.textSecondary,
            fontStyle: 'italic',
        },
        memberResultsGrid: {
            paddingHorizontal: spacing.md,
        },
        memberCard: {
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
            ...shadows.sm,
        },

        memberCardGuest: {
            // This style is for the non-interactive part of the member card
            opacity: 0.7,
            pointerEvents: 'none', // Disable touch events for guests
        },
        memberContent: {
            // Container for authenticated user member card content
        },
        memberHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        memberScoreRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
        },
        scoreItem: {
            flex: 1,
            alignItems: 'center',
        },
        scoreLabel: {
            fontSize: 11,
            fontWeight: '500',
            color: currentColors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: spacing.xs,
            textAlign: 'center',
        },
        scoreValue: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            textAlign: 'center',
        },
        memberInfo: {
            flex: 1,
        },
        avatarContainer: {
            position: 'relative',
            marginRight: spacing.sm,
        },
        rankOverlay: {
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: currentColors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: currentColors.cardBackground,
        },
        firstPlace: {
            backgroundColor: '#FFD700', // Gold
        },
        secondPlace: {
            backgroundColor: '#C0C0C0', // Silver
        },
        thirdPlace: {
            backgroundColor: '#CD7F32', // Bronze
        },
        rankOverlayText: {
            fontSize: 10,
            fontWeight: 'bold',
            color: currentColors.textInverse,
        },
        memberStatus: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing.xs,
            gap: spacing.xs,
        },
        memberName: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: spacing.xs,
        },
        memberStats: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        scoreInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing.md,
        },
        pointsText: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.success,
            marginRight: spacing.xs,
        },
        correctText: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textSecondary,
        },
        picksContainer: {
            backgroundColor: currentColors.backgroundTertiary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
        },
        pickItem: {
            marginBottom: spacing.md,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
        },
        pickHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        pickPosition: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textPrimary,
        },
        pickDifference: {
            fontSize: 12,
            fontWeight: '500',
        },
        pickDetails: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: borderRadius.sm,
            padding: spacing.sm,
        },
        pickDriver: {
            flex: 1,
        },
        pickDriverName: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textPrimary,
        },
        pickDriverTeam: {
            fontSize: 12,
            color: currentColors.textSecondary,
        },
        actualDriver: {
            flex: 1,
            alignItems: 'flex-end',
        },
        actualDriverName: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textPrimary,
        },
        actualDriverTeam: {
            fontSize: 12,
            color: currentColors.textSecondary,
        },
        correctBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: currentColors.successLight,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
            alignSelf: 'flex-start',
            marginTop: spacing.xs,
        },

        picksSummary: {
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: currentColors.borderLight,
        },
        pickPoints: {
            fontSize: 12,
            fontWeight: '500',
            color: currentColors.success,
            marginLeft: spacing.sm,
        },
        positionCard: {
            width: '48%',
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            ...shadows.sm,
            alignItems: 'center',
            justifyContent: 'center',
        },
        positionNumber: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentColors.primary,
            marginBottom: spacing.xs,
        },
        viewResultsText: {
            fontSize: 12,
            fontWeight: '500',
            color: currentColors.textSecondary,
            textDecorationLine: 'underline',
        },
        warningSection: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.lg,
            backgroundColor: currentColors.warningLight,
            borderRadius: borderRadius.md,
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            ...shadows.sm,
        },
        warningContent: {
            marginLeft: spacing.md,
        },
        warningTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.warning,
            marginBottom: spacing.xs,
        },
        warningText: {
            fontSize: 14,
            color: currentColors.textSecondary,
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
            color: currentColors.textPrimary,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
        },
        emptyMessage: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: spacing.lg,
        },
        emptyActions: {
            flexDirection: 'row',
            gap: spacing.md,
        },
        emptyButton: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: currentColors.borderMedium,
            backgroundColor: currentColors.backgroundSecondary,
        },
        emptyButtonText: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textPrimary,
        },
        emptyButtonPrimary: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
            backgroundColor: currentColors.primary,
        },
        emptyButtonPrimaryText: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textInverse,
        },
        positionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
            justifyContent: 'space-between',
        },
        description: {
            fontSize: 14,
            color: currentColors.textSecondary,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
            marginTop: spacing.sm,
        },
        statusCard: {
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.xs,
            ...shadows.sm,
        },
        statusHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        statusTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.warning,
            marginLeft: spacing.sm,
        },
        statusDescription: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.lg,
        },
        statCard: {
            width: '45%',
            backgroundColor: currentColors.backgroundTertiary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            alignItems: 'center',
            marginVertical: spacing.sm,
        },
        statValue: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: spacing.xs,
        },
        statLabel: {
            fontSize: 12,
            color: currentColors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        unscoredPositionsSection: {
            marginTop: spacing.lg,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        subsectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginLeft: spacing.sm,
        },
        subsectionDescription: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: spacing.lg,
            lineHeight: 20,
        },
        unscoredPositionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: spacing.sm,
        },
        guestPrompt: {
            backgroundColor: 'transparent',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            borderWidth: 0,
            marginHorizontal: 0,
        },
        guestPromptText: {
            fontSize: 14,
            color: currentColors.textSecondary,
            textAlign: 'right',
            marginBottom: spacing.sm,
            lineHeight: 20,
            alignSelf: 'flex-end',
        },
        loginButton: {
            backgroundColor: currentColors.backgroundSecondary,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            minWidth: 120,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            alignSelf: 'flex-end',
            marginTop: spacing.sm,
        },
        loginButtonText: {
            color: currentColors.textSecondary,
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center',
        },
        viewPicksButtonContainer: {
            marginTop: spacing.sm,
            alignSelf: 'flex-end',
        },
        viewPicksButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: currentColors.backgroundSecondary,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        viewPicksButtonText: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textSecondary,
            marginRight: spacing.xs,
        },
    });

    // Function to find the current week (most recent race with results or current date)
    const findCurrentWeek = (races: Race[]): number => {
        if (!races || races.length === 0) return 1;

        // Find the most recent race that has happened (status !== 'upcoming')
        const completedRaces = races.filter(race => race.status !== 'upcoming');
        if (completedRaces.length > 0) {
            // Return the most recent completed race
            return Math.max(...completedRaces.map(race => race.weekNumber));
        }

        // If no completed races, return the first race
        return races[0]?.weekNumber || 1;
    };

    const loadData = async () => {
        try {
            // Only show full loading on initial load or league change
            if (results.length === 0) {
                setLoading(true);
            } else {
                setWeekLoading(true);
            }
            setError(null);

            const [leagueResponse, racesResponse, resultsResponse, positionsResponse] = await Promise.all([
                leaguesAPI.getLeague(leagueId),
                f1racesAPI.getAllRaces(),
                picksAPI.getRaceResultsV2(leagueId, selectedWeek),
                picksAPI.getLeaguePositions(leagueId)
            ]);

            if (leagueResponse.data.success) {
                setLeague(leagueResponse.data.data);
            }

            if (racesResponse.data.success) {
                const racesData = racesResponse.data.data;
                setRaces(racesData);

                // If no week was specified in URL, set to current week
                if (!weekNumber || isNaN(weekNumber)) {
                    const currentWeek = findCurrentWeek(racesData);
                    setSelectedWeek(currentWeek);
                }
            }

            if (resultsResponse.data.success) {
                setResults(resultsResponse.data.data.results || []);
            }

            if (positionsResponse.data.success) {
                setRequiredPositions(positionsResponse.data.data);
            }
        } catch (error: any) {
            console.error('Error loading race results:', error);
            setError('Failed to load race results. Please try again.');
            showToast('Failed to load race results', 'error');
        } finally {
            setLoading(false);
            setWeekLoading(false);
        }
    };

    const handleWeekChange = (week: number) => {
        // Prevent rapid changes that could cause fontsize errors
        if (weekLoading || week === selectedWeek) {
            return;
        }

        // Set loading state to prevent rapid updates
        setWeekLoading(true);

        // Optimistically update the week immediately
        setSelectedWeek(week);
        setShowWeekSelector(false);

        // Use a small delay to prevent rapid style changes
        setTimeout(() => {
            router.replace(`/race-results?leagueId=${leagueId}&weekNumber=${week}` as any);
        }, 100);
    };

    const getCurrentRace = () => {
        return races.find(race => race.weekNumber === selectedWeek);
    };

    const getCurrentRaceIndex = () => {
        return races.findIndex(race => race.weekNumber === selectedWeek);
    };

    const goToPreviousWeek = () => {
        const currentIndex = getCurrentRaceIndex();
        if (currentIndex > 0) {
            const prevRace = races[currentIndex - 1];
            handleWeekChange(prevRace.weekNumber);
        }
    };

    const goToNextWeek = () => {
        const currentIndex = getCurrentRaceIndex();
        if (currentIndex < races.length - 1) {
            const nextRace = races[currentIndex + 1];
            handleWeekChange(nextRace.weekNumber);
        }
    };

    const getPositionLabel = (position: number) => {
        const labels: { [key: number]: string } = {
            1: 'P1',
            2: 'P2',
            3: 'P3',
            4: 'P4',
            5: 'P5',
            6: 'P6',
            7: 'P7',
            8: 'P8',
            9: 'P9',
            10: 'P10',
            11: 'P11',
            12: 'P12',
            13: 'P13',
            14: 'P14',
            15: 'P15',
            16: 'P16',
            17: 'P17',
            18: 'P18',
            19: 'P19',
            20: 'P20'
        };
        return labels[position] || `P${position}`;
    };

    const getPositionDifferenceColor = (difference: number | null) => {
        if (difference === null) return currentColors.textSecondary;
        if (difference === 0) return currentColors.success;
        if (difference <= 2) return currentColors.warning;
        return currentColors.error;
    };

    const getPositionDifferenceText = (difference: number | null) => {
        if (difference === null) return 'No pick';
        if (difference === 0) return 'Perfect!';
        if (difference === 1) return '1 off';
        return `${difference} off`;
    };

    const navigateToPositionResults = (position: number) => {
        router.push(`/position-results?leagueId=${leagueId}&weekNumber=${selectedWeek}&position=${position}&leagueName=${league?.name}` as any);
    };

    const navigateToUnscoredPositionPicks = (position: number) => {
        router.push(`/unscored-position-picks?leagueId=${leagueId}&weekNumber=${selectedWeek}&position=${position}&leagueName=${league?.name}` as any);
    };

    const navigateToMemberPicks = (userId: number, userName: string, memberIndex?: number) => {
        const baseUrl = `/member-picks?leagueId=${leagueId}&weekNumber=${selectedWeek}&userId=${userId}&userName=${userName}&leagueName=${league?.name}`;
        const finalUrl = memberIndex !== undefined ? `${baseUrl}&memberIndex=${memberIndex}` : baseUrl;
        router.push(finalUrl as any);
    };

    const getParticipantStats = () => {
        const totalParticipants = results.length;
        const participantsWithPicks = results.filter(result =>
            result.picks.some(pick => pick.driverName)
        ).length;
        const totalPicksMade = results.reduce((total, result) =>
            total + result.picks.filter(pick => pick.driverName).length, 0
        );
        const totalPossiblePicks = totalParticipants * requiredPositions.length;
        const picksRemaining = totalPossiblePicks - totalPicksMade;

        return {
            totalParticipants,
            participantsWithPicks,
            totalPicksMade,
            totalPossiblePicks,
            picksRemaining
        };
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={currentColors.primary} />
                    <Text style={styles.loadingText}>Loading race results...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={currentColors.error} />
                    <Text style={styles.errorTitle}>Error Loading Results</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentRace = getCurrentRace();
    const currentIndex = getCurrentRaceIndex();
    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < races.length - 1;

    // Calculate summary stats
    const totalParticipants = results.length;
    const totalPoints = results.reduce((sum, result) => sum + result.totalPoints, 0);
    const totalCorrect = results.reduce((sum, result) => sum + result.totalCorrect, 0);
    const hasScoredResults = results.some(result => result.picks.some(pick => pick.actualDriverName));

    if (results.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <ScrollView style={styles.scrollView}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>Race Results</Text>
                            <Text style={styles.subtitle}>
                                {league?.name || 'Loading...'} • {currentRace ? currentRace.raceName : `Week ${selectedWeek}`}
                            </Text>
                        </View>
                    </View>

                    {/* Empty State */}
                    <View style={styles.emptyContainer}>
                        <Ionicons name="trophy-outline" size={64} color={currentColors.textSecondary} />
                        <Text style={styles.emptyTitle}>No Results Available</Text>
                        <Text style={styles.emptyMessage}>
                            {currentRace ? (
                                `No results are available for ${currentRace.raceName} (Week ${selectedWeek}). The race may not have finished yet or results haven't been entered.`
                            ) : (
                                `No results are available for Week ${selectedWeek}. The race may not have finished yet or results haven't been entered.`
                            )}
                        </Text>
                        <View style={styles.emptyActions}>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => router.back()}
                            >
                                <Text style={styles.emptyButtonText}>Back to League</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.emptyButtonPrimary}
                                onPress={() => handleWeekChange(1)}
                            >
                                <Text style={styles.emptyButtonPrimaryText}>View Week 1</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Race Results</Text>
                    </View>
                </View>

                <Text style={styles.description}>
                    {league?.name || 'Loading...'} • {currentRace ? currentRace.raceName : `Week ${selectedWeek}`}
                </Text>

                {/* Week Navigation */}
                <View style={styles.weekNavigation}>
                    <TouchableOpacity
                        style={[styles.navButton, (!canGoPrevious || weekLoading) && styles.navButtonDisabled]}
                        onPress={goToPreviousWeek}
                        disabled={!canGoPrevious || weekLoading}
                    >
                        <Ionicons name="chevron-back" size={16} color={canGoPrevious && !weekLoading ? currentColors.textPrimary : currentColors.textSecondary} />
                        <Text style={[styles.navButtonText, (!canGoPrevious || weekLoading) && styles.navButtonTextDisabled]}>Prev</Text>
                    </TouchableOpacity>

                    {/* Week Selector Button */}
                    <TouchableOpacity
                        style={styles.weekSelectorButton}
                        onPress={() => {
                            // Prevent rapid dropdown toggles that could cause fontsize errors
                            if (weekLoading) return;

                            // Use a small delay to prevent rapid state changes
                            setTimeout(() => {
                                setShowWeekSelector(!showWeekSelector);
                            }, 50);
                        }}
                        disabled={weekLoading}
                        activeOpacity={0.7}
                    >
                        <View style={styles.weekSelectorContent}>
                            <Text style={styles.weekNumber}>Week {selectedWeek}</Text>
                            <Text style={styles.raceName} numberOfLines={1}>
                                {currentRace?.raceName || 'Unknown Race'}
                            </Text>
                        </View>
                        {weekLoading ? (
                            <ActivityIndicator size="small" color={currentColors.primary} />
                        ) : (
                            <Ionicons
                                name={showWeekSelector ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={currentColors.textSecondary}
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, (!canGoNext || weekLoading) && styles.navButtonDisabled]}
                        onPress={goToNextWeek}
                        disabled={!canGoNext || weekLoading}
                    >
                        <Text style={[styles.navButtonText, (!canGoNext || weekLoading) && styles.navButtonTextDisabled]}>Next</Text>
                        <Ionicons name="chevron-forward" size={16} color={canGoNext && !weekLoading ? currentColors.textPrimary : currentColors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Week Selector Dropdown */}
                {showWeekSelector && races.length > 0 && (
                    <View style={styles.weekDropdown}>
                        {races.map((race) => (
                            <TouchableOpacity
                                key={race.weekNumber}
                                style={[
                                    styles.weekOption,
                                    race.weekNumber === selectedWeek && styles.weekOptionSelected
                                ]}
                                onPress={() => handleWeekChange(race.weekNumber)}
                                disabled={weekLoading}
                                activeOpacity={0.7}
                            >
                                <View style={styles.weekOptionContent}>
                                    <Text style={[
                                        styles.weekOptionText,
                                        race.weekNumber === selectedWeek && styles.weekOptionTextSelected
                                    ]}>
                                        Week {race.weekNumber}
                                    </Text>
                                    <Text style={[
                                        styles.weekOptionSubtext,
                                        race.weekNumber === selectedWeek && styles.weekOptionSubtextSelected
                                    ]}>
                                        {race.raceName}
                                    </Text>
                                </View>
                                {race.weekNumber === selectedWeek && (
                                    <Ionicons name="checkmark" size={16} color={currentColors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Summary Stats */}
                <View style={styles.summaryContainer}>
                    {hasScoredResults && (
                        <>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Members</Text>
                                <Text style={styles.summaryValue}>{results.length}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Correct Picks</Text>
                                <Text style={styles.summaryValue}>{totalCorrect}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Total Points</Text>
                                <Text style={styles.summaryValue}>{totalPoints}</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Position Results Grid */}
                {hasScoredResults && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>View Results by Position</Text>
                        <View style={styles.positionsGrid}>
                            {requiredPositions.map((position) => (
                                <TouchableOpacity
                                    key={position}
                                    style={styles.positionCard}
                                    onPress={() => navigateToPositionResults(position)}
                                >
                                    <Text style={styles.positionNumber}>P{position}</Text>

                                    <Text style={styles.viewResultsText}>View Results</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Not Scored Warning */}
                {!hasScoredResults && results.length > 0 && (
                    <View style={styles.unscoredSection}>
                        {/* Participant Statistics */}
                        {(() => {
                            const stats = getParticipantStats();
                            return (
                                <View style={styles.unscoredSummaryContainer}>
                                    <View style={styles.summaryCard}>
                                        <Text style={styles.summaryLabel}>Members</Text>
                                        <Text style={styles.summaryValue}>{stats.totalParticipants}</Text>
                                    </View>
                                    <View style={styles.summaryCard}>
                                        <Text style={styles.summaryLabel}>Made Picks</Text>
                                        <Text style={styles.summaryValue}>{stats.participantsWithPicks}</Text>
                                    </View>
                                    <View style={styles.summaryCard}>
                                        <Text style={styles.summaryLabel}>Picks Made</Text>
                                        <Text style={styles.summaryValue}>{stats.totalPicksMade}</Text>
                                    </View>
                                </View>
                            );
                        })()}

                        {/* Position Picks Grid for Unscored Events */}
                        {requiredPositions.length > 1 && (
                            <View style={styles.unscoredPositionsSection}>
                                <Text style={styles.unscoredSectionTitle}>View Picks by Position</Text>

                                <View style={styles.unscoredPositionsGrid}>
                                    {requiredPositions.map((position) => (
                                        <TouchableOpacity
                                            key={position}
                                            style={styles.positionCard}
                                            onPress={() => navigateToUnscoredPositionPicks(position)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.positionNumber}>P{position}</Text>
                                            <Text style={styles.viewResultsText}>View Picks</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        <Text style={styles.raceStatusTitle}>Race Status</Text>
                        <View style={styles.statusCard}>
                            <View style={styles.statusHeader}>
                                <Ionicons name="time-outline" size={24} color={currentColors.warning} />
                                <Text style={styles.statusTitle}>Race not scored yet</Text>
                            </View>
                            <Text style={styles.statusDescription}>
                                The race results haven&apos;t been entered yet. Picks will be scored once the race finishes.
                            </Text>
                        </View>


                    </View>
                )}

                {/* Actual Race Results */}
                {hasScoredResults && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Actual Race Results</Text>
                        <View style={styles.actualResultsGrid}>
                            {requiredPositions.map((position, index) => {
                                const positionResult = results.find(result =>
                                    result.picks.some(pick =>
                                        pick.position === position && pick.actualDriverName
                                    )
                                );
                                const actualPick = positionResult?.picks.find(pick => pick.position === position);

                                return (
                                    <View key={`position-${position}-${index}`} style={styles.actualResultCard}>
                                        <Text style={styles.actualPositionLabel}>
                                            {getPositionLabel(position)}
                                        </Text>
                                        {actualPick?.actualDriverName ? (
                                            <View>
                                                <Text style={styles.actualDriverName}>
                                                    {actualPick.actualDriverName}
                                                </Text>
                                                <Text style={styles.actualDriverTeam}>
                                                    {actualPick.actualDriverTeam}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.noResult}>No result available</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Member Results */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {hasScoredResults ? 'All Results' : 'All Picks'}
                    </Text>
                    <View style={styles.memberResultsGrid}>
                        {results.map((result, index) => (
                            <View
                                key={`${result.userId}-${index}`}
                                style={[
                                    styles.memberCard,
                                    !user && styles.memberCardGuest
                                ]}
                            >
                                {user ? (
                                    <View style={styles.memberContent}>
                                        <View style={styles.memberHeader}>
                                            <View style={styles.avatarContainer}>
                                                <Avatar
                                                    src={result.userAvatar}
                                                    size="sm"
                                                    fallback={result.userName?.charAt(0).toUpperCase() || 'U'}
                                                />
                                                {hasScoredResults && (
                                                    <View style={[
                                                        styles.rankOverlay,
                                                        index === 0 && styles.firstPlace,
                                                        index === 1 && styles.secondPlace,
                                                        index === 2 && styles.thirdPlace
                                                    ]}>
                                                        <Text style={styles.rankOverlayText}>{index + 1}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.memberInfo}>
                                                <Text style={styles.memberName}>{result.userName}</Text>
                                                <View style={styles.memberStatus}>
                                                    <Ionicons name="checkmark-circle" size={16} color={currentColors.success} />
                                                    <Text style={styles.memberStats}>
                                                        All {result.picks.filter(p => p.driverName).length} picks made
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {hasScoredResults && (
                                            <View style={styles.memberScoreRow}>
                                                <View style={styles.scoreItem}>
                                                    <Text style={styles.scoreLabel}>CORRECT PICKS</Text>
                                                    <Text style={styles.scoreValue}>{result.totalCorrect}</Text>
                                                </View>
                                                <View style={styles.scoreItem}>
                                                    <Text style={styles.scoreLabel}>POINTS</Text>
                                                    <Text style={styles.scoreValue}>{result.totalPoints}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {/* View Picks Button for Authenticated Users */}
                                        <View style={styles.viewPicksButtonContainer}>
                                            <TouchableOpacity
                                                style={styles.viewPicksButton}
                                                onPress={() => navigateToMemberPicks(result.userId, result.userName, index)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.viewPicksButtonText}>View Picks</Text>
                                                <Ionicons name="chevron-forward" size={16} color={currentColors.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.memberHeader}>
                                            <View style={styles.avatarContainer}>
                                                <Avatar
                                                    src={result.userAvatar}
                                                    size="sm"
                                                    fallback={result.userName?.charAt(0).toUpperCase() || 'U'}
                                                />
                                                {hasScoredResults && (
                                                    <View style={[
                                                        styles.rankOverlay,
                                                        index === 0 && styles.firstPlace,
                                                        index === 1 && styles.secondPlace,
                                                        index === 2 && styles.thirdPlace
                                                    ]}>
                                                        <Text style={styles.rankOverlayText}>{index + 1}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.memberInfo}>
                                                <Text style={styles.memberName}>{result.userName}</Text>
                                                <View style={styles.memberStatus}>
                                                    <Ionicons name="alert-circle" size={16} color={currentColors.warning} />
                                                    <Text style={styles.memberStats}>
                                                        {result.picks.filter(p => p.driverName).length} of {result.picks.length} picks made
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {hasScoredResults && (
                                            <View style={styles.memberScoreRow}>
                                                <View style={styles.scoreItem}>
                                                    <Text style={styles.scoreLabel}>CORRECT PICKS</Text>
                                                    <Text style={styles.scoreValue}>{result.totalCorrect}</Text>
                                                </View>
                                                <View style={styles.scoreItem}>
                                                    <Text style={styles.scoreLabel}>POINTS</Text>
                                                    <Text style={styles.scoreValue}>{result.totalPoints}</Text>
                                                </View>
                                            </View>
                                        )}

                                        <View style={styles.guestPrompt}>
                                            <TouchableOpacity
                                                style={styles.loginButton}
                                                onPress={() => {
                                                    console.log('Login button pressed'); // Debug log
                                                    router.push('/login');
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.loginButtonText}>Login to View Picks</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};


export default RaceResultsScreen;

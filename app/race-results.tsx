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
import Colors from '../constants/Colors';
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
    const leagueId = Number(params.leagueId);
    const weekNumber = Number(params.weekNumber);

    const [results, setResults] = useState<RaceResultV2[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekLoading, setWeekLoading] = useState(false);
    const [races, setRaces] = useState<Race[]>([]);
    const [selectedWeek, setSelectedWeek] = useState(weekNumber);
    const [showWeekSelector, setShowWeekSelector] = useState(false);
    const [league, setLeague] = useState<League | null>(null);
    const [requiredPositions, setRequiredPositions] = useState<number[]>([10]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [leagueId, selectedWeek]);

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
                setRaces(racesResponse.data.data);
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
        // Optimistically update the week immediately
        setSelectedWeek(week);
        setShowWeekSelector(false);
        router.replace(`/race-results?leagueId=${leagueId}&weekNumber=${week}` as any);
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
        if (difference === null) return Colors.light.textSecondary;
        if (difference === 0) return Colors.light.success;
        if (difference <= 2) return Colors.light.warning;
        return Colors.light.error;
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
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>Loading race results...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
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
                            <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
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
                        <Ionicons name="trophy-outline" size={64} color={Colors.light.textSecondary} />
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
                        <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
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
                        <Ionicons name="chevron-back" size={16} color={canGoPrevious && !weekLoading ? Colors.light.textPrimary : Colors.light.textSecondary} />
                        <Text style={[styles.navButtonText, (!canGoPrevious || weekLoading) && styles.navButtonTextDisabled]}>Prev</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.weekSelector}
                        onPress={() => setShowWeekSelector(!showWeekSelector)}
                        disabled={weekLoading}
                    >
                        <Text style={styles.weekNumber}>Week {selectedWeek}</Text>
                        <Text style={styles.raceName} numberOfLines={1}>
                            {currentRace?.raceName || 'Unknown Race'}
                        </Text>
                        {weekLoading ? (
                            <ActivityIndicator size="small" color={Colors.light.primary} />
                        ) : (
                            <Ionicons name="chevron-down" size={16} color={Colors.light.textSecondary} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, (!canGoNext || weekLoading) && styles.navButtonDisabled]}
                        onPress={goToNextWeek}
                        disabled={!canGoNext || weekLoading}
                    >
                        <Text style={[styles.navButtonText, (!canGoNext || weekLoading) && styles.navButtonTextDisabled]}>Next</Text>
                        <Ionicons name="chevron-forward" size={16} color={canGoNext && !weekLoading ? Colors.light.textPrimary : Colors.light.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Week Selector Dropdown */}
                {showWeekSelector && (
                    <View style={styles.weekDropdown}>
                        {races.map((race) => (
                            <TouchableOpacity
                                key={race.weekNumber}
                                style={[styles.weekOption, race.weekNumber === selectedWeek && styles.weekOptionSelected]}
                                onPress={() => handleWeekChange(race.weekNumber)}
                                disabled={weekLoading}
                            >
                                <Text style={[styles.weekOptionText, race.weekNumber === selectedWeek && styles.weekOptionTextSelected]}>
                                    Week {race.weekNumber}
                                </Text>
                                <Text style={[styles.weekOptionSubtext, race.weekNumber === selectedWeek && styles.weekOptionSubtextSelected]}>
                                    {race.raceName}
                                </Text>
                                {race.weekNumber === selectedWeek && (
                                    <Ionicons name="checkmark" size="16" color={Colors.light.primary} />
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
                                <Ionicons name="time-outline" size={24} color={Colors.light.warning} />
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
                            <TouchableOpacity
                                key={`${result.userId}-${index}`}
                                style={styles.memberCard}
                                onPress={() => navigateToMemberPicks(result.userId, result.userName, index)}
                            >
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
                                            <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
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

                                <View style={styles.viewPicksButton}>
                                    <Text style={styles.viewPicksText}>View All Picks</Text>
                                    <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
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
        color: Colors.light.textPrimary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    errorMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    retryButton: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    retryButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 64,
        backgroundColor: Colors.light.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
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
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
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
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    navButtonDisabled: {
        backgroundColor: Colors.light.backgroundTertiary,
        borderColor: Colors.light.borderMedium,
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
        marginHorizontal: spacing.xs,
    },
    navButtonTextDisabled: {
        color: Colors.light.textSecondary,
    },
    weekSelector: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.light.backgroundSecondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    weekNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.primary,
    },
    raceName: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        flex: 1,
        marginHorizontal: spacing.sm,
    },
    weekDropdown: {
        backgroundColor: Colors.light.backgroundSecondary,
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
        borderBottomColor: Colors.light.borderLight,
    },
    weekOptionSelected: {
        backgroundColor: Colors.light.primaryLight,
    },
    weekOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    weekOptionTextSelected: {
        color: Colors.light.primary,
        fontWeight: '600',
    },
    weekOptionSubtext: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        flex: 1,
        marginLeft: spacing.sm,
    },
    weekOptionSubtextSelected: {
        color: Colors.light.primary,
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
        backgroundColor: Colors.light.cardBackground,
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
        backgroundColor: Colors.light.cardBackground,
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
        color: Colors.light.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
        textAlign: 'center',
        flexWrap: 'wrap',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
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
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    raceStatusTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
        marginTop: spacing.lg,
        paddingHorizontal: 0,
    },
    unscoredSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
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
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        ...shadows.sm,
    },
    actualPositionLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.light.textSecondary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    resultCard: {
        width: '48%',
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        marginHorizontal: '1%',
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        ...shadows.sm,
    },
    positionLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.light.textSecondary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    driverName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        textAlign: 'center',
    },
    driverTeam: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    noResult: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        fontStyle: 'italic',
    },
    memberResultsGrid: {
        paddingHorizontal: spacing.md,
    },
    memberCard: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
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
        color: Colors.light.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        textAlign: 'center',
    },
    viewPicksButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.light.borderLight,
    },
    viewPicksText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.primary,
        marginRight: spacing.xs,
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
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.cardBackground,
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
        color: Colors.light.textInverse,
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
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    memberStats: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    scoreInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    pointsText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.success,
        marginRight: spacing.xs,
    },
    correctText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textSecondary,
    },
    picksContainer: {
        backgroundColor: Colors.light.backgroundTertiary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    pickItem: {
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
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
        color: Colors.light.textPrimary,
    },
    pickDifference: {
        fontSize: 12,
        fontWeight: '500',
    },
    pickDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
    },
    pickDriver: {
        flex: 1,
    },
    pickDriverName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    pickDriverTeam: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    actualDriver: {
        flex: 1,
        alignItems: 'flex-end',
    },
    actualDriverName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    actualDriverTeam: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    correctBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.successLight,
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
        borderTopColor: Colors.light.borderLight,
    },
    pickPoints: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.light.success,
        marginLeft: spacing.sm,
    },
    positionCard: {
        width: '48%',
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        ...shadows.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    positionNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.primary,
        marginBottom: spacing.xs,
    },
    viewResultsText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.light.textSecondary,
        textDecorationLine: 'underline',
    },
    warningSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: Colors.light.warningLight,
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
        color: Colors.light.warning,
        marginBottom: spacing.xs,
    },
    warningText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
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
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    emptyMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
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
        borderColor: Colors.light.borderMedium,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    emptyButtonPrimary: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: Colors.light.primary,
    },
    emptyButtonPrimaryText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textInverse,
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
        color: Colors.light.textSecondary,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    statusCard: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xs,
        ...shadows.sm,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.warning,
        marginLeft: spacing.sm,
    },
    statusDescription: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        marginTop: spacing.md,
        width: '100%',
        alignItems: 'flex-start',
    },
    statCard: {
        width: '45%',
        backgroundColor: Colors.light.backgroundTertiary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        marginVertical: spacing.sm,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
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
        color: Colors.light.textPrimary,
        marginLeft: spacing.sm,
    },
    subsectionDescription: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    unscoredPositionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },

});

export default RaceResultsScreen;

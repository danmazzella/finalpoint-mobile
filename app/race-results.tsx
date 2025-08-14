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
import ResponsiveContainer from '../components/ResponsiveContainer';
import { useScreenSize } from '../hooks/useScreenSize';

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
    const screenSize = useScreenSize();
    const leagueId = Number(params.leagueId);
    const weekNumber = Number(params.weekNumber);

    const [results, setResults] = useState<RaceResultV2[]>([]);
    const [loading, setLoading] = useState(true);
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
            setLoading(true);
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
            console.error('Error loading data:', error);
            if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                setError('Unable to connect to server. Please check your internet connection.');
            } else {
                setError('Failed to load race results. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleWeekChange = (week: number) => {
        setSelectedWeek(week);
        setShowWeekSelector(false);
    };

    const getCurrentRace = () => {
        return races.find(race => race.weekNumber === selectedWeek);
    };

    const getPositionLabel = (position: number) => {
        return `P${position}`;
    };

    const getPositionColor = (position: number) => {
        const colors = [
            '#FFD700',      // P1 - Gold
            '#C0C0C0',      // P2 - Silver  
            '#CD7F32',      // P3 - Bronze
            Colors.light.primary,   // P4
            Colors.light.primary,   // P5
            Colors.light.primary,   // P6
            Colors.light.primary,   // P7
            Colors.light.primary,   // P8
            Colors.light.primary,   // P9
            Colors.light.primary,   // P10
        ];
        return colors[position - 1] || Colors.light.primary;
    };

    const getPointsColor = (points: number) => {
        if (points >= 10) return Colors.light.success;
        if (points >= 5) return Colors.light.warning;
        return Colors.light.textSecondary;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.buttonPrimary} />
                    <Text style={styles.loadingText}>Loading race results...</Text>
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

    if (!league) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>League Not Found</Text>
                    <Text style={styles.errorMessage}>The requested league could not be found.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentRace = getCurrentRace();

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveContainer>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={Colors.light.buttonPrimary} />
                            <Text style={styles.backButtonText}>Back to League</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>Race Results</Text>
                        <Text style={styles.subtitle}>{league.name}</Text>
                    </View>

                    {/* Race Info & Week Selector */}
                    <View style={styles.raceInfo}>
                        <View style={styles.raceHeader}>
                            <Text style={styles.raceName}>
                                {currentRace ? currentRace.raceName : `Week ${selectedWeek}`}
                            </Text>
                            <TouchableOpacity
                                style={styles.weekSelector}
                                onPress={() => setShowWeekSelector(!showWeekSelector)}
                            >
                                <Text style={styles.weekSelectorText}>Week {selectedWeek}</Text>
                                <Ionicons
                                    name={showWeekSelector ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color={Colors.light.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {showWeekSelector && (
                            <View style={styles.weekDropdown}>
                                {races.map((race) => (
                                    <TouchableOpacity
                                        key={race.weekNumber}
                                        style={[
                                            styles.weekOption,
                                            selectedWeek === race.weekNumber && styles.weekOptionSelected
                                        ]}
                                        onPress={() => handleWeekChange(race.weekNumber)}
                                    >
                                        <Text style={[
                                            styles.weekOptionText,
                                            selectedWeek === race.weekNumber && styles.weekOptionTextSelected
                                        ]}>
                                            Week {race.weekNumber}: {race.raceName}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Main Content - Responsive Layout */}
                    {screenSize === 'tablet' ? (
                        <View style={styles.tabletLayout}>
                            {/* Left Column - Results Summary */}
                            <View style={styles.tabletLeftColumn}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Results Summary</Text>
                                    <View style={styles.summaryStats}>
                                        <View style={styles.summaryStat}>
                                            <Text style={styles.summaryStatNumber}>{results.length}</Text>
                                            <Text style={styles.summaryStatLabel}>Participants</Text>
                                        </View>
                                        <View style={styles.summaryStat}>
                                            <Text style={styles.summaryStatNumber}>
                                                {Math.max(...results.map(r => r.totalPoints), 0)}
                                            </Text>
                                            <Text style={styles.summaryStatLabel}>Highest Score</Text>
                                        </View>
                                        <View style={styles.summaryStat}>
                                            <Text style={styles.summaryStatNumber}>
                                                {Math.round(results.reduce((sum, r) => sum + r.totalPoints, 0) / results.length)}
                                            </Text>
                                            <Text style={styles.summaryStatLabel}>Average Score</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Top Performers */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Top Performers</Text>
                                    <View style={styles.topPerformers}>
                                        {results
                                            .sort((a, b) => b.totalPoints - a.totalPoints)
                                            .slice(0, 3)
                                            .map((result, index) => (
                                                <View key={result.userId} style={styles.topPerformer}>
                                                    <View style={styles.topPerformerRank}>
                                                        <Text style={styles.rankText}>{index + 1}</Text>
                                                    </View>
                                                    <Avatar
                                                        size="md"
                                                        src={result.userAvatar}
                                                        fallback={result.userName.charAt(0).toUpperCase()}
                                                    />
                                                    <View style={styles.topPerformerInfo}>
                                                        <Text style={styles.topPerformerName}>{result.userName}</Text>
                                                        <Text style={styles.topPerformerScore}>
                                                            {result.totalPoints} pts • {result.totalCorrect} correct
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                    </View>
                                </View>
                            </View>

                            {/* Right Column - Detailed Results */}
                            <View style={styles.tabletRightColumn}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>All Results</Text>
                                    <View style={styles.resultsList}>
                                        {results
                                            .sort((a, b) => b.totalPoints - a.totalPoints)
                                            .map((result, index) => (
                                                <View key={result.userId} style={styles.resultCard}>
                                                    <View style={styles.resultHeader}>
                                                        <View style={styles.resultRank}>
                                                            <Text style={styles.resultRankText}>{index + 1}</Text>
                                                        </View>
                                                        <Avatar
                                                            size="sm"
                                                            src={result.userAvatar}
                                                            fallback={result.userName.charAt(0).toUpperCase()}
                                                        />
                                                        <View style={styles.resultUserInfo}>
                                                            <Text style={styles.resultUserName}>{result.userName}</Text>
                                                            <Text style={styles.resultUserStats}>
                                                                {result.totalPoints} pts • {result.totalCorrect} correct
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    <View style={styles.resultPicks}>
                                                        {requiredPositions.map((position) => {
                                                            const pick = result.picks.find(p => p.position === position);
                                                            return (
                                                                <View key={position} style={styles.pickItem}>
                                                                    <Text style={styles.pickPosition}>
                                                                        {getPositionLabel(position)}
                                                                    </Text>
                                                                    <View style={styles.pickDetails}>
                                                                        <Text style={styles.pickDriver}>
                                                                            {pick?.driverName || 'No Pick'}
                                                                        </Text>
                                                                        <Text style={styles.pickTeam}>
                                                                            {pick?.driverTeam || ''}
                                                                        </Text>
                                                                    </View>
                                                                    <View style={styles.pickResult}>
                                                                        <Text style={styles.actualDriver}>
                                                                            {pick?.actualDriverName}
                                                                        </Text>
                                                                        <Text style={[
                                                                            styles.pickPoints,
                                                                            { color: getPointsColor(pick?.points || 0) }
                                                                        ]}>
                                                                            {pick?.points || 0} pts
                                                                        </Text>
                                                                    </View>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* Mobile Layout (existing code) */
                        <>
                            {/* Results Summary */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Results Summary</Text>
                                <View style={styles.summaryStats}>
                                    <View style={styles.summaryStat}>
                                        <Text style={styles.summaryStatNumber}>{results.length}</Text>
                                        <Text style={styles.summaryStatLabel}>Participants</Text>
                                    </View>
                                    <View style={styles.summaryStat}>
                                        <Text style={styles.summaryStatNumber}>
                                            {Math.max(...results.map(r => r.totalPoints), 0)}
                                        </Text>
                                        <Text style={styles.summaryStatLabel}>Highest Score</Text>
                                    </View>
                                    <View style={styles.summaryStat}>
                                        <Text style={styles.summaryStatNumber}>
                                            {Math.round(results.reduce((sum, r) => sum + r.totalPoints, 0) / results.length)}
                                        </Text>
                                        <Text style={styles.summaryStatLabel}>Average Score</Text>
                                    </View>
                                </View>
                            </View>

                            {/* All Results */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>All Results</Text>
                                <View style={styles.resultsList}>
                                    {results
                                        .sort((a, b) => b.totalPoints - a.totalPoints)
                                        .map((result, index) => (
                                            <View key={result.userId} style={styles.resultCard}>
                                                <View style={styles.resultHeader}>
                                                    <View style={styles.resultRank}>
                                                        <Text style={styles.resultRankText}>{index + 1}</Text>
                                                    </View>
                                                    <Avatar
                                                        size="sm"
                                                        src={result.userAvatar}
                                                        fallback={result.userName.charAt(0).toUpperCase()}
                                                    />
                                                    <View style={styles.resultUserInfo}>
                                                        <Text style={styles.resultUserName}>{result.userName}</Text>
                                                        <Text style={styles.resultUserStats}>
                                                            {result.totalPoints} pts • {result.totalCorrect} correct
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={styles.resultPicks}>
                                                    {requiredPositions.map((position) => {
                                                        const pick = result.picks.find(p => p.position === position);
                                                        return (
                                                            <View key={position} style={styles.pickItem}>
                                                                <Text style={styles.pickPosition}>
                                                                    {getPositionLabel(position)}
                                                                </Text>
                                                                <View style={styles.pickDetails}>
                                                                    <Text style={styles.pickDriver}>
                                                                        {pick?.driverName || 'No Pick'}
                                                                    </Text>
                                                                    <Text style={styles.pickTeam}>
                                                                        {pick?.driverTeam || ''}
                                                                    </Text>
                                                                </View>
                                                                <View style={styles.pickResult}>
                                                                    <Text style={styles.actualDriver}>
                                                                        {pick?.actualDriverName}
                                                                    </Text>
                                                                    <Text style={[
                                                                        styles.pickPoints,
                                                                        { color: getPointsColor(pick?.points || 0) }
                                                                    ]}>
                                                                        {pick?.points || 0} pts
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        ))}
                                </View>
                            </View>
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
    header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    backButtonText: {
        fontSize: 16,
        color: Colors.light.buttonPrimary,
        fontWeight: '600',
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
        marginBottom: spacing.lg,
    },
    raceInfo: {
        backgroundColor: Colors.light.cardBackground,
        marginHorizontal: spacing.md,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
    },
    raceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    raceName: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        flex: 1,
    },
    weekSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: Colors.light.backgroundPrimary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    weekSelectorText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    weekDropdown: {
        marginTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.light.borderLight,
        paddingTop: spacing.md,
    },
    weekOption: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
    },
    weekOptionSelected: {
        backgroundColor: Colors.light.primaryLight,
    },
    weekOptionText: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    weekOptionTextSelected: {
        color: Colors.light.buttonPrimary,
        fontWeight: '600',
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
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryStat: {
        alignItems: 'center',
    },
    summaryStatNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.buttonPrimary,
        marginBottom: spacing.xs,
    },
    summaryStatLabel: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    topPerformers: {
        gap: spacing.md,
    },
    topPerformer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
    },
    topPerformerRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.light.buttonPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    topPerformerInfo: {
        flex: 1,
    },
    topPerformerName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    topPerformerScore: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    resultsList: {
        gap: spacing.md,
    },
    resultCard: {
        backgroundColor: Colors.light.backgroundPrimary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    resultRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.light.buttonPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultRankText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: 'bold',
    },
    resultUserInfo: {
        flex: 1,
    },
    resultUserName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    resultUserStats: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    resultPicks: {
        gap: spacing.sm,
    },
    pickItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
    },
    pickPosition: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        minWidth: 30,
    },
    pickDetails: {
        flex: 1,
    },
    pickDriver: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    pickTeam: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    pickResult: {
        alignItems: 'flex-end',
    },
    actualDriver: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    pickPoints: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Tablet-specific styles
    tabletLayout: {
        flexDirection: 'row',
        gap: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    tabletLeftColumn: {
        flex: 1,
        gap: spacing.lg,
    },
    tabletRightColumn: {
        flex: 2,
        gap: spacing.lg,
    },
});

export default RaceResultsScreen;

import React, { useState, useEffect, useCallback } from 'react';
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
import { picksAPI } from '../src/services/apiService';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';
import Avatar from '../src/components/Avatar';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { useScreenSize } from '../hooks/useScreenSize';

interface PositionResultV2 {
    leagueId: number;
    weekNumber: number;
    position: number;
    picks: {
        userId: number;
        userName: string;
        userAvatar?: string;
        driverId: number;
        driverName: string;
        driverTeam: string;
        position: number;
        isCorrect: boolean | null;
        points: number | null;
        actualDriverId: number | null;
        actualDriverName: string | null;
        actualDriverTeam: string | null;
        actualFinishPosition: number | null;
    }[];
    actualResult: {
        driverId: number;
        driverName: string;
        driverTeam: string;
    } | null;
    totalParticipants: number;
    correctPicks: number;
}

const PositionResultsScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();
    const leagueId = Number(params.leagueId);
    const weekNumber = Number(params.weekNumber);
    const position = Number(params.position);
    const leagueName = params.leagueName as string;

    const [results, setResults] = useState<PositionResultV2 | null>(null);
    const [availablePositions, setAvailablePositions] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadResults = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await picksAPI.getResultsByPositionV2(
                leagueId,
                weekNumber,
                position
            );

            if (response.data.success) {
                setResults(response.data.data);
            } else {
                setError('Failed to load position results');
            }
        } catch (error: any) {
            console.error('Error loading position results:', error);
            setError('Failed to load position results');
            showToast('Failed to load position results', 'error');
        } finally {
            setLoading(false);
        }
    }, [leagueId, weekNumber, position, showToast]);

    const loadAvailablePositions = useCallback(async () => {
        try {
            const response = await picksAPI.getLeaguePositions(leagueId);
            if (response.data.success) {
                // Sort positions in ascending order (P1, P2, P3, etc.)
                const sortedPositions = response.data.data.sort((a: number, b: number) => a - b);
                setAvailablePositions(sortedPositions);
            }
        } catch (error: any) {
            console.error('Error loading available positions:', error);
        }
    }, [leagueId]);

    const navigateToPosition = (newPosition: number) => {
        router.push(`/position-results?leagueId=${leagueId}&weekNumber=${weekNumber}&position=${newPosition}&leagueName=${leagueName}` as any);
    };

    const navigateToMemberPicks = (userId: number, userName: string) => {
        router.push(`/member-picks?leagueId=${leagueId}&weekNumber=${weekNumber}&userId=${userId}&userName=${userName}&leagueName=${leagueName}` as any);
    };

    const getPositionLabel = (pos: number) => {
        return `P${pos}`;
    };

    const getPositionColor = (pos: number) => {
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
        return colors[pos - 1] || Colors.light.primary;
    };

    const getPickStatus = (pick: PositionResultV2['picks'][0]) => {
        if (pick.isCorrect === null) return { text: 'Not Scored', color: Colors.light.textSecondary };
        if (pick.isCorrect) return { text: 'Correct!', color: Colors.light.success };
        return { text: 'Incorrect', color: Colors.light.error };
    };

    useEffect(() => {
        loadResults();
        loadAvailablePositions();
    }, [loadResults, loadAvailablePositions]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.buttonPrimary} />
                    <Text style={styles.loadingText}>Loading position results...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !results) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Error Loading Results</Text>
                    <Text style={styles.errorMessage}>{error || 'Position results not found'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadResults}>
                        <Text style={styles.retryButtonText}>Retry</Text>
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
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={Colors.light.buttonPrimary} />
                            <Text style={styles.backButtonText}>Back to Results</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>Position Results</Text>
                        <Text style={styles.subtitle}>{leagueName} • Week {weekNumber}</Text>
                        <Text style={styles.positionInfo}>Position {getPositionLabel(position)}</Text>
                    </View>

                    {/* Main Content - Responsive Layout */}
                    {screenSize === 'tablet' ? (
                        <View style={styles.tabletLayout}>
                            {/* Left Column - Position Info & Navigation */}
                            <View style={styles.tabletLeftColumn}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Position Overview</Text>
                                    <View style={styles.positionOverview}>
                                        <View style={[
                                            styles.positionBadge,
                                            { backgroundColor: getPositionColor(position) }
                                        ]}>
                                            <Text style={styles.positionText}>
                                                {getPositionLabel(position)}
                                            </Text>
                                        </View>
                                        <Text style={styles.positionTitle}>
                                            Position {position} Results
                                        </Text>
                                    </View>

                                    <View style={styles.overviewStats}>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>Participants</Text>
                                            <Text style={styles.statValue}>{results.totalParticipants}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>Correct Picks</Text>
                                            <Text style={styles.statValue}>{results.correctPicks}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>Success Rate</Text>
                                            <Text style={styles.statValue}>
                                                {Math.round((results.correctPicks / results.totalParticipants) * 100)}%
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Position Navigation */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Other Positions</Text>
                                    <View style={styles.positionGrid}>
                                        {availablePositions
                                            .filter(pos => pos !== position)
                                            .map((pos) => (
                                                <TouchableOpacity
                                                    key={pos}
                                                    style={styles.positionCard}
                                                    onPress={() => navigateToPosition(pos)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[
                                                        styles.positionCardText,
                                                        { color: getPositionColor(pos) }
                                                    ]}>
                                                        {getPositionLabel(pos)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                </View>
                            </View>

                            {/* Right Column - Results & Actual Result */}
                            <View style={styles.tabletRightColumn}>
                                {/* Actual Result */}
                                {results.actualResult && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Actual Result</Text>
                                        <View style={styles.actualResultCard}>
                                            <View style={[
                                                styles.actualResultBadge,
                                                { backgroundColor: getPositionColor(position) }
                                            ]}>
                                                <Text style={styles.actualResultText}>
                                                    {getPositionLabel(position)}
                                                </Text>
                                            </View>
                                            <View style={styles.actualResultInfo}>
                                                <Text style={styles.actualDriverName}>
                                                    {results.actualResult.driverName}
                                                </Text>
                                                <Text style={styles.actualDriverTeam}>
                                                    {results.actualResult.driverTeam}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* All Picks */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>All Picks</Text>
                                    <View style={styles.picksList}>
                                        {results.picks.map((pick, index) => {
                                            const status = getPickStatus(pick);
                                            return (
                                                <TouchableOpacity
                                                    key={`${pick.userId}-${index}`}
                                                    style={styles.pickCard}
                                                    onPress={() => navigateToMemberPicks(pick.userId, pick.userName)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={styles.pickHeader}>
                                                        <Avatar
                                                            size="sm"
                                                            src={pick.userAvatar}
                                                            fallback={pick.userName.charAt(0).toUpperCase()}
                                                        />
                                                        <View style={styles.pickInfo}>
                                                            <Text style={styles.userName}>{pick.userName}</Text>
                                                            <Text style={styles.pickDriver}>
                                                                Picked: {pick.driverName}
                                                            </Text>
                                                            <Text style={styles.pickTeam}>{pick.driverTeam}</Text>
                                                        </View>
                                                        <View style={styles.pickStatus}>
                                                            <Text style={[styles.statusText, { color: status.color }]}>
                                                                {status.text}
                                                            </Text>
                                                            {pick.points !== null && (
                                                                <Text style={styles.pointsText}>
                                                                    {pick.points} pts
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </View>

                                                    {pick.actualDriverName && (
                                                        <View style={styles.actualResult}>
                                                            <Text style={styles.actualLabel}>Actual Result:</Text>
                                                            <Text style={styles.actualDriver}>
                                                                {pick.actualDriverName} ({pick.actualDriverTeam})
                                                            </Text>
                                                            {pick.actualFinishPosition && (
                                                                <Text style={styles.actualPosition}>
                                                                    Finished P{pick.actualFinishPosition}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* Mobile Layout (existing code) */
                        <>
                            {/* Position Overview */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Position Overview</Text>
                                <View style={styles.positionOverview}>
                                    <View style={[
                                        styles.positionBadge,
                                        { backgroundColor: getPositionColor(position) }
                                    ]}>
                                        <Text style={styles.positionText}>
                                            {getPositionLabel(position)}
                                        </Text>
                                    </View>
                                    <Text style={styles.positionTitle}>
                                        Position {position} Results
                                    </Text>
                                </View>

                                <View style={styles.overviewStats}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Participants</Text>
                                        <Text style={styles.statValue}>{results.totalParticipants}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Correct Picks</Text>
                                        <Text style={styles.statValue}>{results.correctPicks}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Success Rate</Text>
                                        <Text style={styles.statValue}>
                                            {Math.round((results.correctPicks / results.totalParticipants) * 100)}%
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Actual Result */}
                            {results.actualResult && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Actual Result</Text>
                                    <View style={styles.actualResultCard}>
                                        <View style={[
                                            styles.actualResultBadge,
                                            { backgroundColor: getPositionColor(position) }
                                        ]}>
                                            <Text style={styles.actualResultText}>
                                                {getPositionLabel(position)}
                                            </Text>
                                        </View>
                                        <View style={styles.actualResultInfo}>
                                            <Text style={styles.actualDriverName}>
                                                {results.actualResult.driverName}
                                            </Text>
                                            <Text style={styles.actualDriverTeam}>
                                                {results.actualResult.driverTeam}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* All Picks */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>All Picks</Text>
                                <View style={styles.picksList}>
                                    {results.picks.map((pick, index) => {
                                        const status = getPickStatus(pick);
                                        return (
                                            <TouchableOpacity
                                                key={`${pick.userId}-${index}`}
                                                style={styles.pickCard}
                                                onPress={() => navigateToMemberPicks(pick.userId, pick.userName)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.pickHeader}>
                                                    <Avatar
                                                        size="sm"
                                                        src={pick.userAvatar}
                                                        fallback={pick.userName.charAt(0).toUpperCase()}
                                                    />
                                                    <View style={styles.pickInfo}>
                                                        <Text style={styles.userName}>{pick.userName}</Text>
                                                        <Text style={styles.pickDriver}>
                                                            Picked: {pick.driverName}
                                                        </Text>
                                                        <Text style={styles.pickTeam}>{pick.driverTeam}</Text>
                                                    </View>
                                                    <View style={styles.pickStatus}>
                                                        <Text style={[styles.statusText, { color: status.color }]}>
                                                            {status.text}
                                                        </Text>
                                                        {pick.points !== null && (
                                                            <Text style={styles.pointsText}>
                                                                {pick.points} pts
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>

                                                {pick.actualDriverName && (
                                                    <View style={styles.actualResult}>
                                                        <Text style={styles.actualLabel}>Actual Result:</Text>
                                                        <Text style={styles.actualDriver}>
                                                            {pick.actualDriverName} ({pick.actualDriverTeam})
                                                        </Text>
                                                        {pick.actualFinishPosition && (
                                                            <Text style={styles.actualPosition}>
                                                                Finished P{pick.actualFinishPosition}
                                                            </Text>
                                                        )}
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Position Navigation */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Other Positions</Text>
                                <View style={styles.positionGrid}>
                                    {availablePositions
                                        .filter(pos => pos !== position)
                                        .map((pos) => (
                                            <TouchableOpacity
                                                key={pos}
                                                style={styles.positionCard}
                                                onPress={() => navigateToPosition(pos)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    styles.positionCardText,
                                                    { color: getPositionColor(pos) }
                                                ]}>
                                                    {getPositionLabel(pos)}
                                                </Text>
                                            </TouchableOpacity>
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
        marginBottom: spacing.xs,
    },
    positionInfo: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.lg,
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
    positionOverview: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    positionBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    positionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textInverse,
    },
    positionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        textAlign: 'center',
    },
    overviewStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.buttonPrimary,
    },
    actualResultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        backgroundColor: Colors.light.backgroundPrimary,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    actualResultBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actualResultText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.textInverse,
    },
    actualResultInfo: {
        flex: 1,
    },
    actualDriverName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    actualDriverTeam: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    picksList: {
        gap: spacing.md,
    },
    pickCard: {
        backgroundColor: Colors.light.backgroundPrimary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    pickHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    pickInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
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
    pickStatus: {
        alignItems: 'flex-end',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: spacing.xs,
    },
    pointsText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.success,
    },
    actualResult: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.light.primary,
    },
    actualLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.light.textSecondary,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
    },
    actualDriver: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    actualPosition: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    positionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        justifyContent: 'center',
    },
    positionCard: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.light.backgroundPrimary,
        borderWidth: 2,
        borderColor: Colors.light.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.sm,
    },
    positionCardText: {
        fontSize: 16,
        fontWeight: 'bold',
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

export default PositionResultsScreen;

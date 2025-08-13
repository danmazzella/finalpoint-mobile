import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { picksAPI } from '../src/services/apiService';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';
import Avatar from '../src/components/Avatar';

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

const UnscoredPositionPicksScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useSimpleToast();
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
                setError('Failed to load picks');
            }
        } catch (error: any) {
            console.error('Error loading position picks:', error);
            setError('Failed to load picks');
            showToast('Failed to load picks', 'error');
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
        // Use replace instead of push to avoid building up navigation stack
        router.replace({
            pathname: '/unscored-position-picks',
            params: {
                leagueId: leagueId.toString(),
                weekNumber: weekNumber.toString(),
                position: newPosition.toString(),
                leagueName: leagueName,
            },
        });
    };

    const getCurrentPositionIndex = () => {
        return availablePositions.findIndex(pos => pos === position);
    };

    const canNavigatePrevious = () => {
        return getCurrentPositionIndex() > 0;
    };

    const canNavigateNext = () => {
        return getCurrentPositionIndex() < availablePositions.length - 1;
    };

    const navigateToPrevious = () => {
        const currentIndex = getCurrentPositionIndex();
        if (currentIndex > 0) {
            navigateToPosition(availablePositions[currentIndex - 1]);
        }
    };

    const navigateToNext = () => {
        const currentIndex = getCurrentPositionIndex();
        if (currentIndex < availablePositions.length - 1) {
            navigateToPosition(availablePositions[currentIndex + 1]);
        }
    };

    useEffect(() => {
        loadResults();
        loadAvailablePositions();
    }, [loadResults, loadAvailablePositions]);

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

    const getPopularPicks = () => {
        if (!results) return [];

        // Count picks for each driver
        const driverCounts = results.picks.reduce((acc, pick) => {
            const key = `${pick.driverName} (${pick.driverTeam})`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Sort by count and get top 5
        return Object.entries(driverCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </SafeAreaView>
        );
    }

    if (error || !results) {
        return (
            <SafeAreaView style={styles.errorContainer} edges={['top', 'left', 'right']}>
                <View style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
                    <Text style={styles.errorTitle}>Error Loading Picks</Text>
                    <Text style={styles.errorMessage}>{error || 'No picks found'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                        <Text style={styles.retryButtonText}>Back to Results</Text>
                    </TouchableOpacity>
                </View>
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
                        <Text style={styles.title}>Picks By Position</Text>
                    </View>
                </View>

                <Text style={styles.description}>
                    {leagueName || 'Loading...'} • Week {weekNumber}
                </Text>

                {/* Position Context with Navigation */}
                <View style={styles.positionSection}>
                    <View style={styles.navigationContainer}>
                        {/* Previous Button */}
                        <TouchableOpacity
                            style={[
                                styles.navigationButton,
                                !canNavigatePrevious() && styles.navigationButtonDisabled
                            ]}
                            onPress={navigateToPrevious}
                            disabled={!canNavigatePrevious()}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={18}
                                color={canNavigatePrevious() ? Colors.light.textPrimary : Colors.light.textSecondary}
                            />
                        </TouchableOpacity>

                        {/* Position Context */}
                        <View style={styles.positionContext}>
                            <View style={styles.positionBadge}>
                                <Text style={styles.positionBadgeText}>{getPositionLabel(position)}</Text>
                            </View>
                            <Text style={styles.positionLabel}>Viewing picks for {getPositionLabel(position)}</Text>
                        </View>

                        {/* Next Button */}
                        <TouchableOpacity
                            style={[
                                styles.navigationButton,
                                !canNavigateNext() && styles.navigationButtonDisabled
                            ]}
                            onPress={navigateToNext}
                            disabled={!canNavigateNext()}
                        >
                            <Ionicons
                                name="chevron-forward"
                                size={18}
                                color={canNavigateNext() ? Colors.light.textPrimary : Colors.light.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Race Not Scored Notice */}
                <View style={styles.noticeSection}>
                    <View style={styles.statusCard}>
                        <Ionicons name="time-outline" size={16} color={Colors.light.warning} />
                        <Text style={styles.statusTitle}>Race not scored yet</Text>
                    </View>
                </View>

                {/* Summary Stats */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Participants</Text>
                        <Text style={styles.summaryValue}>{results.totalParticipants}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Race Status</Text>
                        <Text style={styles.summaryValue}>Not Scored</Text>
                    </View>
                </View>

                {/* All Picks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <Ionicons name="list" size={20} color={Colors.light.primary} />
                            <Text style={styles.sectionTitle}>All Picks</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>
                            {results.totalParticipants} participants made picks for this position
                        </Text>
                    </View>
                    <View style={styles.picksGrid}>
                        {results.picks.map((pick, index) => (
                            <View key={pick.userId} style={styles.pickCard}>
                                <View style={styles.pickCardHeader}>
                                    <View style={styles.avatarContainer}>
                                        <Avatar
                                            src={pick.userAvatar}
                                            size="sm"
                                            fallback={pick.userName.charAt(0).toUpperCase()}
                                        />
                                    </View>
                                    <Text style={styles.pickUser}>{pick.userName}</Text>
                                    <View style={styles.pickStatusContainer}>
                                        <View style={styles.awaitingBadge}>
                                            <Ionicons name="time-outline" size={10} color={Colors.light.warning} />
                                            <Text style={styles.pickStatusText}>Pending</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.pickDriverSection}>
                                    <View style={styles.pickDriverIcon}>
                                        <Ionicons name="flash" size={16} color={Colors.light.primary} />
                                    </View>
                                    <View style={styles.pickDriverInfo}>
                                        <Text style={styles.pickDriverName}>
                                            {pick.driverName}
                                        </Text>
                                        <Text style={styles.pickDriverTeam}>
                                            {pick.driverTeam}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Popular Picks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <Ionicons name="trending-up" size={20} color={Colors.light.primary} />
                            <Text style={styles.sectionTitle}>Popular Picks</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>
                            Most selected drivers for this position
                        </Text>
                    </View>
                    <View style={styles.popularPicksGrid}>
                        {getPopularPicks().map(([driver, count], index) => (
                            <View key={driver} style={styles.popularPickCard}>
                                <View style={styles.popularPickContent}>
                                    <View style={styles.popularPickRank}>
                                        <Text style={styles.popularPickRankText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.popularPickInfo}>
                                        <Text style={styles.popularPickDriver}>{driver}</Text>
                                        <View style={styles.popularPickStatsRow}>
                                            <Text style={styles.popularPickCount}>
                                                {count} pick{count !== 1 ? 's' : ''}
                                            </Text>
                                            <Text style={styles.popularPickPercentage}>
                                                {Math.round((count / results.totalParticipants) * 100)}%
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.popularPickBar}>
                                    <View
                                        style={[
                                            styles.popularPickBarFill,
                                            { width: `${(count / results.totalParticipants) * 100}%` }
                                        ]}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Bottom spacing for mobile to account for safe area */}
                <View style={styles.bottomSpacing} />
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
        backgroundColor: Colors.light.backgroundPrimary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: Colors.light.backgroundPrimary,
    },
    errorCard: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        width: '100%',
        ...shadows.md,
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
        marginRight: spacing.md,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
    },
    description: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    positionContext: {
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: spacing.sm,
    },
    positionBadge: {
        backgroundColor: Colors.light.primary,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.xs,
    },
    positionBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.textInverse,
    },
    positionLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        fontWeight: '500',
        textAlign: 'center',
    },
    positionSection: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
    },
    navigationButton: {
        backgroundColor: Colors.light.backgroundSecondary,
        padding: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    navigationButtonDisabled: {
        backgroundColor: Colors.light.borderLight,
        borderColor: Colors.light.borderLight,
    },
    section: {
        backgroundColor: Colors.light.cardBackground,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
    },
    noticeSection: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    statusCard: {
        backgroundColor: Colors.light.warningLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: Colors.light.warning,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginLeft: spacing.sm,
    },
    sectionHeader: {
        marginBottom: spacing.md,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.light.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.textPrimary,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: Colors.light.textPrimary,
        marginLeft: spacing.sm,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.md,
    },
    picksGrid: {
        gap: spacing.sm,
    },
    pickCard: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        ...shadows.sm,
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    pickCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    avatarContainer: {
        marginRight: spacing.md,
    },
    pickUser: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.textPrimary,
        flex: 1,
    },
    pickStatusContainer: {
        marginLeft: spacing.md,
    },
    pickDriverSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickDriverIcon: {
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: Colors.light.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    pickDriverInfo: {
        flex: 1,
    },
    pickDriverName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    pickDriverTeam: {
        fontSize: 13,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },
    awaitingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.warning + '15',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: Colors.light.warning + '30',
    },
    pickStatusText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.light.warning,
        marginLeft: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    popularPicksGrid: {
        gap: spacing.sm,
    },
    popularPickCard: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        ...shadows.sm,
    },
    popularPickContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    popularPickRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
        flexShrink: 0,
    },
    popularPickRankText: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.light.textInverse,
    },
    popularPickInfo: {
        flex: 1,
    },
    popularPickDriver: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    popularPickStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    popularPickCount: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },
    popularPickPercentage: {
        fontSize: 12,
        color: Colors.light.primary,
        fontWeight: '700',
    },
    popularPickBar: {
        width: '100%',
        height: 4,
        backgroundColor: Colors.light.gray200,
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: spacing.xs,
    },
    popularPickBarFill: {
        height: '100%',
        backgroundColor: Colors.light.primary,
        borderRadius: 2,
    },
    bottomSpacing: {
        height: spacing.xl,
    },
});

export default UnscoredPositionPicksScreen;

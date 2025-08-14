import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSimpleToast } from '../../../src/context/SimpleToastContext';
import Colors from '../../../constants/Colors';
import { spacing, borderRadius, shadows } from '../../../utils/styles';
import { leaguesAPI } from '../../../src/services/apiService';
import Avatar from '../../../src/components/Avatar';
import ResponsiveContainer from '../../../components/ResponsiveContainer';
import { useScreenSize } from '../../../hooks/useScreenSize';

interface DetailedStanding {
    id: number;
    name: string;
    isOwner: number;
    totalPicks: number;
    correctPicks: number;
    totalPoints: number;
    averagePoints: number;
    accuracy: number;
    racesParticipated: number;
    averageDistanceFromCorrect: number;
    perfectPicks: number;
    averagePointsPerRace: number;
    avatar: string;
}

interface League {
    id: number;
    name: string;
    seasonYear: number;
    memberCount: number;
    isMember: boolean;
    userRole: string;
}

// Types for potential future sorting functionality

export default function StandingsPage() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();
    const leagueId = params.id as string;

    const [league, setLeague] = useState<League | null>(null);
    const [standings, setStandings] = useState<DetailedStanding[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [leagueResponse, standingsResponse] = await Promise.all([
                leaguesAPI.getLeague(parseInt(leagueId)),
                leaguesAPI.getDetailedLeagueStandings(parseInt(leagueId))
            ]);

            const leagueData = leagueResponse.data;
            const standingsData = standingsResponse.data;

            if (leagueData.success) {
                setLeague(leagueData.data);
            }

            if (standingsData.success) {
                setStandings(standingsData.data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Failed to load standings data', 'error');
        } finally {
            setLoading(false);
        }
    }, [leagueId, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Sort standings by total points descending (default leaderboard order)
    const sortedStandings = [...standings].sort((a, b) => b.totalPoints - a.totalPoints);

    const getPositionColor = (index: number) => {
        if (index === 0) return { backgroundColor: '#fef3c7', color: '#92400e' };
        if (index === 1) return { backgroundColor: '#f3f4f6', color: '#374151' };
        if (index === 2) return { backgroundColor: '#fed7aa', color: '#ea580c' };
        return { backgroundColor: '#f9fafb', color: '#4b5563' };
    };

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 80) return '#059669';
        if (accuracy >= 60) return '#d97706';
        if (accuracy >= 40) return '#ea580c';
        return '#dc2626';
    };

    const getAccuracyLabel = (accuracy: number) => {
        if (accuracy >= 80) return 'Excellent';
        if (accuracy >= 60) return 'Good';
        if (accuracy >= 40) return 'Fair';
        return 'Poor';
    };

    const navigateToMemberPicks = (userId: number, userName: string) => {
        router.push(`/member-picks?leagueId=${leagueId}&userId=${userId}&userName=${userName}&leagueName=${league?.name}` as any);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.buttonPrimary} />
                    <Text style={styles.loadingText}>Loading standings...</Text>
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

                        <Text style={styles.title}>League Standings</Text>
                        <Text style={styles.subtitle}>{league.name}</Text>
                    </View>

                    {/* Main Content - Responsive Layout */}
                    {screenSize === 'tablet' ? (
                        <View style={styles.tabletLayout}>
                            {/* Left Column - League Stats */}
                            <View style={styles.tabletLeftColumn}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>League Overview</Text>
                                    <View style={styles.leagueStats}>
                                        <View style={styles.leagueStat}>
                                            <Text style={styles.leagueStatNumber}>{league.memberCount}</Text>
                                            <Text style={styles.leagueStatLabel}>Members</Text>
                                        </View>
                                        <View style={styles.leagueStat}>
                                            <Text style={styles.leagueStatNumber}>
                                                {Math.max(...standings.map(s => s.racesParticipated), 0)}
                                            </Text>
                                            <Text style={styles.leagueStatLabel}>Races</Text>
                                        </View>
                                        <View style={styles.leagueStat}>
                                            <Text style={styles.leagueStatNumber}>
                                                {Math.round(standings.reduce((sum, s) => sum + s.accuracy, 0) / standings.length)}
                                            </Text>
                                            <Text style={styles.leagueStatLabel}>Avg Accuracy</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Top 3 Podium */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Podium</Text>
                                    <View style={styles.podium}>
                                        {sortedStandings.slice(0, 3).map((standing, index) => (
                                            <View key={standing.id} style={styles.podiumPosition}>
                                                <View style={[
                                                    styles.podiumRank,
                                                    { backgroundColor: getPositionColor(index).backgroundColor }
                                                ]}>
                                                    <Text style={[
                                                        styles.podiumRankText,
                                                        { color: getPositionColor(index).color }
                                                    ]}>
                                                        {index + 1}
                                                    </Text>
                                                </View>
                                                <Avatar
                                                    size="md"
                                                    src={standing.avatar}
                                                    fallback={standing.name.charAt(0).toUpperCase()}
                                                />
                                                <View style={styles.podiumInfo}>
                                                    <Text style={styles.podiumName}>{standing.name}</Text>
                                                    <Text style={styles.podiumPoints}>
                                                        {standing.totalPoints} pts
                                                    </Text>
                                                    <Text style={styles.podiumAccuracy}>
                                                        {standing.accuracy}% accuracy
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* Right Column - Full Standings */}
                            <View style={styles.tabletRightColumn}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Full Standings</Text>
                                    <View style={styles.standingsList}>
                                        {sortedStandings.map((standing, index) => (
                                            <TouchableOpacity
                                                key={standing.id}
                                                style={styles.standingCard}
                                                onPress={() => navigateToMemberPicks(standing.id, standing.name)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.standingHeader}>
                                                    <View style={[
                                                        styles.standingRank,
                                                        { backgroundColor: getPositionColor(index).backgroundColor }
                                                    ]}>
                                                        <Text style={[
                                                            styles.standingRankText,
                                                            { color: getPositionColor(index).color }
                                                        ]}>
                                                            {index + 1}
                                                        </Text>
                                                    </View>
                                                    <Avatar
                                                        size="sm"
                                                        src={standing.avatar}
                                                        fallback={standing.name.charAt(0).toUpperCase()}
                                                    />
                                                    <View style={styles.standingInfo}>
                                                        <Text style={styles.standingName}>{standing.name}</Text>
                                                        {standing.isOwner === 1 && (
                                                            <View style={styles.ownerBadge}>
                                                                <Ionicons name="star" size={12} color={Colors.light.warning} />
                                                                <Text style={styles.ownerText}>Owner</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>

                                                <View style={styles.standingStats}>
                                                    <View style={styles.statRow}>
                                                        <Text style={styles.statLabel}>Total Points:</Text>
                                                        <Text style={styles.statValue}>{standing.totalPoints}</Text>
                                                    </View>
                                                    <View style={styles.statRow}>
                                                        <Text style={styles.statLabel}>Accuracy:</Text>
                                                        <Text style={[
                                                            styles.statValue,
                                                            { color: getAccuracyColor(standing.accuracy) }
                                                        ]}>
                                                            {standing.accuracy}% ({getAccuracyLabel(standing.accuracy)})
                                                        </Text>
                                                    </View>
                                                    <View style={styles.statRow}>
                                                        <Text style={styles.statLabel}>Races:</Text>
                                                        <Text style={styles.statValue}>{standing.racesParticipated}</Text>
                                                    </View>
                                                    <View style={styles.statRow}>
                                                        <Text style={styles.statLabel}>Perfect Picks:</Text>
                                                        <Text style={styles.statValue}>{standing.perfectPicks}</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* Mobile Layout (existing code) */
                        <>
                            {/* League Stats */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>League Overview</Text>
                                <View style={styles.leagueStats}>
                                    <View style={styles.leagueStat}>
                                        <Text style={styles.leagueStatNumber}>{league.memberCount}</Text>
                                        <Text style={styles.leagueStatLabel}>Members</Text>
                                    </View>
                                    <View style={styles.leagueStat}>
                                        <Text style={styles.leagueStatNumber}>
                                            {Math.max(...standings.map(s => s.racesParticipated), 0)}
                                        </Text>
                                        <Text style={styles.leagueStatLabel}>Races</Text>
                                    </View>
                                    <View style={styles.leagueStat}>
                                        <Text style={styles.leagueStatNumber}>
                                            {Math.round(standings.reduce((sum, s) => sum + s.accuracy, 0) / standings.length)}
                                        </Text>
                                        <Text style={styles.leagueStatLabel}>Avg Accuracy</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Full Standings */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Full Standings</Text>
                                <View style={styles.standingsList}>
                                    {sortedStandings.map((standing, index) => (
                                        <TouchableOpacity
                                            key={standing.id}
                                            style={styles.standingCard}
                                            onPress={() => navigateToMemberPicks(standing.id, standing.name)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.standingHeader}>
                                                <View style={[
                                                    styles.standingRank,
                                                    { backgroundColor: getPositionColor(index).backgroundColor }
                                                ]}>
                                                    <Text style={[
                                                        styles.standingRankText,
                                                        { color: getPositionColor(index).color }
                                                    ]}>
                                                        {index + 1}
                                                    </Text>
                                                </View>
                                                <Avatar
                                                    size="sm"
                                                    src={standing.avatar}
                                                    fallback={standing.name.charAt(0).toUpperCase()}
                                                />
                                                <View style={styles.standingInfo}>
                                                    <Text style={styles.standingName}>{standing.name}</Text>
                                                    {standing.isOwner === 1 && (
                                                        <View style={styles.ownerBadge}>
                                                            <Ionicons name="star" size={12} color={Colors.light.warning} />
                                                            <Text style={styles.ownerText}>Owner</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>

                                            <View style={styles.standingStats}>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statLabel}>Total Points:</Text>
                                                    <Text style={styles.statValue}>{standing.totalPoints}</Text>
                                                </View>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statLabel}>Accuracy:</Text>
                                                    <Text style={[
                                                        styles.statValue,
                                                        { color: getAccuracyColor(standing.accuracy) }
                                                    ]}>
                                                        {standing.accuracy}% ({getAccuracyLabel(standing.accuracy)})
                                                    </Text>
                                                </View>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statLabel}>Races:</Text>
                                                    <Text style={styles.statValue}>{standing.racesParticipated}</Text>
                                                </View>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statLabel}>Perfect Picks:</Text>
                                                    <Text style={styles.statValue}>{standing.perfectPicks}</Text>
                                                </View>
                                            </View>
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
}

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
    leagueStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    leagueStat: {
        alignItems: 'center',
    },
    leagueStatNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.buttonPrimary,
        marginBottom: spacing.xs,
    },
    leagueStatLabel: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    podium: {
        gap: spacing.md,
    },
    podiumPosition: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
    },
    podiumRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumRankText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    podiumInfo: {
        flex: 1,
    },
    podiumName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    podiumPoints: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.buttonPrimary,
        marginBottom: spacing.xs,
    },
    podiumAccuracy: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    standingsList: {
        gap: spacing.md,
    },
    standingCard: {
        backgroundColor: Colors.light.backgroundPrimary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    standingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    standingRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    standingRankText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    standingInfo: {
        flex: 1,
    },
    standingName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    ownerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        alignSelf: 'flex-start',
    },
    ownerText: {
        fontSize: 12,
        color: Colors.light.warning,
        fontWeight: '500',
    },
    standingStats: {
        gap: spacing.sm,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
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

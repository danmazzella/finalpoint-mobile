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

    const getDistanceColor = (distance: number) => {
        if (distance <= 2) return '#059669';
        if (distance <= 5) return '#d97706';
        return '#dc2626';
    };

    const cleanName = (name: string | null | undefined): string => {
        if (!name) return 'Unknown User';
        return name.trim() || 'Unknown User';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>Loading standings...</Text>
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
                        <Text style={styles.title}>Standings</Text>
                    </View>
                </View>

                <Text style={styles.description}>
                    {league?.name} • {standings.length} member{standings.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.seasonInfo}>
                    Season {league?.seasonYear}
                </Text>

                {/* Stats Overview */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons name="trending-up" size={20} color={Colors.light.primary} />
                            <Text style={styles.statLabel}>Total Points</Text>
                        </View>
                        <Text style={styles.statValue}>
                            {standings.reduce((sum, s) => sum + s.totalPoints, 0)}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons name="checkmark-circle" size={20} color="#059669" />
                            <Text style={styles.statLabel}>Perfect Picks</Text>
                        </View>
                        <Text style={styles.statValue}>
                            {standings.reduce((sum, s) => sum + s.perfectPicks, 0)}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons name="time" size={20} color={Colors.light.primary} />
                            <Text style={styles.statLabel}>Avg Accuracy</Text>
                        </View>
                        <Text style={styles.statValue}>
                            {standings.length > 0
                                ? Math.round(standings.reduce((sum, s) => sum + s.accuracy, 0) / standings.length)
                                : 0}%
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons name="people" size={20} color="#7c3aed" />
                            <Text style={styles.statLabel}>Active Members</Text>
                        </View>
                        <Text style={styles.statValue}>
                            {standings.filter(s => s.racesParticipated > 0).length}
                        </Text>
                    </View>
                </View>

                {/* Standings List */}
                <View style={styles.standingsContainer}>
                    {sortedStandings.map((member, index) => (
                        <View key={member.id} style={styles.memberCard}>
                            <View style={styles.memberHeader}>
                                <View style={styles.avatarContainer}>
                                    <Avatar
                                        src={member.avatar}
                                        size="md"
                                        fallback={cleanName(member.name)?.charAt(0).toUpperCase() || 'U'}
                                        style={styles.memberAvatar}
                                    />
                                    <View style={[styles.positionBadge, getPositionColor(index)]}>
                                        <Text style={[styles.positionBadgeText, { color: getPositionColor(index).color }]}>
                                            {index + 1}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.memberInfo}>
                                    <View style={styles.memberNameRow}>
                                        <Text style={styles.memberName}>
                                            {cleanName(member.name)}
                                        </Text>
                                        {member.isOwner ? (
                                            <View style={styles.ownerBadge}>
                                                <Ionicons name="shield-checkmark" size={12} color="#7c3aed" />
                                                <Text style={styles.ownerText}>Owner</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <Text style={styles.memberStats}>
                                        {member.totalPicks} picks • {member.correctPicks} correct
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.memberStatsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statItemLabel}>Points</Text>
                                    <Text style={styles.statItemValue}>{member.totalPoints}</Text>
                                    <Text style={styles.statItemSubtext}>{member.averagePointsPerRace} avg/race</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statItemLabel}>Accuracy</Text>
                                    <Text style={[styles.statItemValue, { color: getAccuracyColor(member.accuracy) }]}>
                                        {member.accuracy}%
                                    </Text>
                                    <Text style={styles.statItemSubtext}>{member.perfectPicks} perfect</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statItemLabel}>Avg Distance</Text>
                                    <Text style={[styles.statItemValue, { color: getDistanceColor(member.averageDistanceFromCorrect) }]}>
                                        {member.averageDistanceFromCorrect || 0} positions
                                    </Text>
                                    <Text style={styles.statItemSubtext}>from target</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statItemLabel}>Races</Text>
                                    <Text style={styles.statItemValue}>{member.racesParticipated}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
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
    description: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
        marginTop: spacing.md,
    },
    seasonInfo: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        textAlign: 'center',
        opacity: 0.8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    statCard: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '48%',
        minHeight: 80,
        ...shadows.md,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
        flex: 1,
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.light.backgroundTertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.xs,
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.light.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: spacing.sm,
        flex: 1,
        flexWrap: 'wrap',
        textAlign: 'left',
        lineHeight: 14,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    standingsContainer: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
    },
    memberCard: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    memberHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: spacing.md,
    },
    positionBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.cardBackground,
        shadowColor: Colors.light.cardShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    positionBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 14,
    },
    memberInfo: {
        flex: 1,
    },
    memberAvatar: {
        // Avatar styling handled by component
    },
    memberNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        flex: 1,
    },
    ownerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3e8ff',
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    ownerText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#7c3aed',
        marginLeft: 2,
    },
    memberStats: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    memberStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: Colors.light.backgroundTertiary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    statItem: {
        width: '50%',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    statItemLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: Colors.light.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    statItemValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    statItemSubtext: {
        fontSize: 10,
        color: Colors.light.textSecondary,
    },
});

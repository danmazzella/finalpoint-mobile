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
import { picksAPI, leaguesAPI } from '../src/services/apiService';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';
import Avatar from '../src/components/Avatar';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { useScreenSize } from '../hooks/useScreenSize';

interface MemberPicksV2 {
    leagueId: number;
    weekNumber: number;
    userId: number;
    userName: string;
    userAvatar?: string;
    picks: {
        position: number;
        driverId: number;
        driverName: string;
        driverTeam: string;
        isCorrect: boolean | null;
        points: number | null;
        actualDriverId: number | null;
        actualDriverName: string | null;
        actualDriverTeam: string | null;
        actualFinishPosition: number | null;
    }[];
    totalPoints: number;
    correctPicks: number;
    totalPicks: number;
    accuracy: string;
}

interface Member {
    id: number;
    name: string;
    avatar?: string;
    role?: string;
}

const MemberPicksScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();
    const leagueId = Number(params.leagueId);
    const weekNumber = Number(params.weekNumber);
    const userId = Number(params.userId);
    const userName = params.userName as string;
    const leagueName = params.leagueName as string;

    const [memberPicks, setMemberPicks] = useState<MemberPicksV2 | null>(null);
    const [leagueMembers, setLeagueMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMemberPicks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await picksAPI.getMemberPicksV2(
                leagueId,
                weekNumber,
                userId
            );

            if (response.data.success) {
                setMemberPicks(response.data.data);
            } else {
                setError('Failed to load member picks');
            }
        } catch (error: any) {
            console.error('Error loading member picks:', error);
            setError('Failed to load member picks');
            showToast('Failed to load member picks', 'error');
        } finally {
            setLoading(false);
        }
    }, [leagueId, weekNumber, userId, showToast]);

    const loadLeagueMembers = useCallback(async () => {
        try {
            // Get members from race results to maintain the same order as shown on results page
            const response = await picksAPI.getRaceResultsV2(leagueId, weekNumber);
            if (response.data.success) {
                // Convert results to member format and maintain the results ordering
                const membersFromResults = response.data.data.results.map((result: { userId: number; userName: string; userAvatar?: string }) => ({
                    id: result.userId,
                    name: result.userName,
                    avatar: result.userAvatar
                }));
                setLeagueMembers(membersFromResults);
            }
        } catch (error) {
            console.error('Error loading league members:', error);
        }
    }, [leagueId, weekNumber]);

    useEffect(() => {
        loadMemberPicks();
        loadLeagueMembers();
    }, [loadMemberPicks, loadLeagueMembers]);

    const navigateToMember = (memberId: number, memberName: string) => {
        router.push(`/member-picks?leagueId=${leagueId}&weekNumber=${weekNumber}&userId=${memberId}&userName=${memberName}&leagueName=${leagueName}` as any);
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

    const getPickStatus = (pick: MemberPicksV2['picks'][0]) => {
        if (pick.isCorrect === null) return { text: 'Not Scored', color: Colors.light.textSecondary };
        if (pick.isCorrect) return { text: 'Correct!', color: Colors.light.success };
        return { text: 'Incorrect', color: Colors.light.error };
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.buttonPrimary} />
                    <Text style={styles.loadingText}>Loading member picks...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !memberPicks) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Error Loading Picks</Text>
                    <Text style={styles.errorMessage}>{error || 'Member picks not found'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadMemberPicks}>
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

                        <Text style={styles.title}>Member Picks</Text>
                        <Text style={styles.subtitle}>{userName} • {leagueName}</Text>
                        <Text style={styles.weekInfo}>Week {weekNumber}</Text>
                    </View>

                    {/* Main Content - Responsive Layout */}
                    {screenSize === 'tablet' ? (
                        <View style={styles.tabletLayout}>
                            {/* Left Column - Member Info & Stats */}
                            <View style={styles.tabletLeftColumn}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Member Overview</Text>
                                    <View style={styles.memberInfo}>
                                        <Avatar
                                            size="xl"
                                            src={memberPicks.userAvatar}
                                            fallback={userName.charAt(0).toUpperCase()}
                                        />
                                        <Text style={styles.memberName}>{userName}</Text>
                                        <Text style={styles.memberLeague}>{leagueName}</Text>
                                    </View>

                                    <View style={styles.memberStats}>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>Total Points</Text>
                                            <Text style={styles.statValue}>{memberPicks.totalPoints}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>Correct Picks</Text>
                                            <Text style={styles.statValue}>{memberPicks.correctPicks}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>Accuracy</Text>
                                            <Text style={styles.statValue}>{memberPicks.accuracy}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>Total Picks</Text>
                                            <Text style={styles.statValue}>{memberPicks.totalPicks}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Other Members */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Other Members</Text>
                                    <View style={styles.membersList}>
                                        {leagueMembers
                                            .filter(member => member.id !== userId)
                                            .slice(0, 5)
                                            .map((member) => (
                                                <TouchableOpacity
                                                    key={member.id}
                                                    style={styles.memberCard}
                                                    onPress={() => navigateToMember(member.id, member.name)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Avatar
                                                        size="sm"
                                                        src={member.avatar}
                                                        fallback={member.name.charAt(0).toUpperCase()}
                                                    />
                                                    <Text style={styles.memberCardName}>{member.name}</Text>
                                                    <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                </View>
                            </View>

                            {/* Right Column - Detailed Picks */}
                            <View style={styles.tabletRightColumn}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>All Picks</Text>
                                    <View style={styles.picksList}>
                                        {memberPicks.picks.map((pick) => {
                                            const status = getPickStatus(pick);
                                            return (
                                                <View key={pick.position} style={styles.pickCard}>
                                                    <View style={styles.pickHeader}>
                                                        <View style={[
                                                            styles.positionBadge,
                                                            { backgroundColor: getPositionColor(pick.position) }
                                                        ]}>
                                                            <Text style={styles.positionText}>
                                                                {getPositionLabel(pick.position)}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.pickInfo}>
                                                            <Text style={styles.driverName}>{pick.driverName}</Text>
                                                            <Text style={styles.teamName}>{pick.driverTeam}</Text>
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
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* Mobile Layout (existing code) */
                        <>
                            {/* Member Info */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Member Overview</Text>
                                <View style={styles.memberInfo}>
                                    <Avatar
                                        size="xl"
                                        src={memberPicks.userAvatar}
                                        fallback={userName.charAt(0).toUpperCase()}
                                    />
                                    <Text style={styles.memberName}>{userName}</Text>
                                    <Text style={styles.memberLeague}>{leagueName}</Text>
                                </View>

                                <View style={styles.memberStats}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Total Points</Text>
                                        <Text style={styles.statValue}>{memberPicks.totalPoints}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Correct Picks</Text>
                                        <Text style={styles.statValue}>{memberPicks.correctPicks}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Accuracy</Text>
                                        <Text style={styles.statValue}>{memberPicks.accuracy}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Total Picks</Text>
                                        <Text style={styles.statValue}>{memberPicks.totalPicks}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* All Picks */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>All Picks</Text>
                                <View style={styles.picksList}>
                                    {memberPicks.picks.map((pick) => {
                                        const status = getPickStatus(pick);
                                        return (
                                            <View key={pick.position} style={styles.pickCard}>
                                                <View style={styles.pickHeader}>
                                                    <View style={[
                                                        styles.positionBadge,
                                                        { backgroundColor: getPositionColor(pick.position) }
                                                    ]}>
                                                        <Text style={styles.positionText}>
                                                            {getPositionLabel(pick.position)}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.pickInfo}>
                                                        <Text style={styles.driverName}>{pick.driverName}</Text>
                                                        <Text style={styles.teamName}>{pick.driverTeam}</Text>
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
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Other Members */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Other Members</Text>
                                <View style={styles.membersList}>
                                    {leagueMembers
                                        .filter(member => member.id !== userId)
                                        .slice(0, 5)
                                        .map((member) => (
                                            <TouchableOpacity
                                                key={member.id}
                                                style={styles.memberCard}
                                                onPress={() => navigateToMember(member.id, member.name)}
                                                activeOpacity={0.7}
                                            >
                                                <Avatar
                                                    size="sm"
                                                    src={member.avatar}
                                                    fallback={member.name.charAt(0).toUpperCase()}
                                                />
                                                <Text style={styles.memberCardName}>{member.name}</Text>
                                                <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
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
    weekInfo: {
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
    memberInfo: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    memberName: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    memberLeague: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginBottom: spacing.md,
    },
    memberStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        gap: spacing.md,
    },
    statItem: {
        alignItems: 'center',
        minWidth: 80,
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
    positionBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    positionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.light.textInverse,
    },
    pickInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    teamName: {
        fontSize: 14,
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
    membersList: {
        gap: spacing.sm,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: Colors.light.backgroundPrimary,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    memberCardName: {
        flex: 1,
        fontSize: 16,
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

export default MemberPicksScreen;

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
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { spacing, borderRadius, shadows } from '../utils/styles';
import Avatar from '../src/components/Avatar';

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
    const { resolvedTheme } = useTheme();
    const leagueId = Number(params.leagueId);
    const weekNumber = Number(params.weekNumber);
    const userId = Number(params.userId);
    const userName = params.userName as string;
    const leagueName = params.leagueName as string;

    // Get current theme colors from universal palette
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors
    const universalStyles = createThemeStyles(currentColors);

    const [memberPicks, setMemberPicks] = useState<MemberPicksV2 | null>(null);
    const [leagueMembers, setLeagueMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            fontWeight: 'bold',
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
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        subtitle: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginTop: spacing.xs,
        },
        weekInfo: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginTop: spacing.xs,
        },
        userInfo: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginTop: spacing.xs,
        },
        summaryContainer: {
            flexDirection: 'row',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            gap: spacing.sm,
            justifyContent: 'space-between',
        },
        summaryCard: {
            flex: 1,
            backgroundColor: currentColors.cardBackground,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 60,
            ...shadows.sm,
        },
        summaryLabel: {
            fontSize: 10,
            color: currentColors.textSecondary,
            marginBottom: spacing.xs,
            textAlign: 'center',
            fontWeight: '500',
        },
        summaryValue: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            textAlign: 'center',
        },
        section: {
            margin: spacing.lg,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: spacing.md,
        },
        pickCard: {
            backgroundColor: currentColors.backgroundSecondary,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            marginBottom: spacing.sm,
            ...shadows.sm,
        },
        pickHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        positionBadge: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: currentColors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
        },
        positionText: {
            color: currentColors.textInverse,
            fontSize: 12,
            fontWeight: 'bold',
        },
        pickInfo: {
            flex: 1,
        },
        pickLabel: {
            fontSize: 12,
            color: currentColors.textSecondary,
            marginBottom: spacing.xs,
        },
        pickDriver: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        pickTeam: {
            fontSize: 12,
            color: currentColors.textSecondary,
            marginTop: spacing.xs,
        },
        scoreInfo: {
            alignItems: 'flex-end',
        },
        pointsText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        correctText: {
            fontSize: 12,
            color: currentColors.success,
            fontWeight: 'bold',
        },
        actualResult: {
            padding: spacing.md,
            borderRadius: borderRadius.sm,
            marginTop: spacing.sm,
        },
        correctResult: {
            backgroundColor: currentColors.successLight,
        },
        incorrectResult: {
            backgroundColor: currentColors.errorLight,
        },
        actualResultLabel: {
            fontSize: 12,
            fontWeight: 'bold',
            marginBottom: spacing.xs,
        },
        correctResultLabel: {
            color: currentColors.success,
        },
        incorrectResultLabel: {
            color: currentColors.error,
        },
        actualResultDriver: {
            fontSize: 14,
            fontWeight: 'bold',
        },
        correctResultDriver: {
            color: currentColors.success,
        },
        incorrectResultDriver: {
            color: currentColors.error,
        },
        actualPosition: {
            fontSize: 12,
            marginTop: spacing.xs,
        },
        correctResultPosition: {
            color: currentColors.success,
        },
        incorrectResultPosition: {
            color: currentColors.error,
        },
        incorrectText: {
            fontSize: 12,
            color: currentColors.error,
            fontWeight: 'bold',
            marginTop: spacing.sm,
        },
        noResult: {
            backgroundColor: currentColors.warningLight,
            padding: spacing.md,
            borderRadius: borderRadius.sm,
            marginTop: spacing.sm,
        },
        noResultText: {
            fontSize: 12,
            color: currentColors.warning,
            fontStyle: 'italic',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
        },
        emptyMessage: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
        },
        emptyPicksContainer: {
            alignItems: 'center',
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
        },
        emptyPicksTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
            textAlign: 'center',
        },
        emptyPicksMessage: {
            fontSize: 14,
            color: currentColors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
        },
        description: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginTop: spacing.md,
            marginBottom: spacing.md,
            textAlign: 'center',
        },
        memberContext: {
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            paddingHorizontal: spacing.sm,
        },
        memberLabel: {
            fontSize: 12,
            color: currentColors.textSecondary,
            fontWeight: '500',
            marginTop: spacing.xs,
            textAlign: 'center',
        },
        memberSection: {
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
            backgroundColor: currentColors.backgroundSecondary,
            padding: spacing.sm,
            borderRadius: borderRadius.full,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadows.sm,
        },
        navigationButtonDisabled: {
            backgroundColor: currentColors.borderLight,
            borderColor: currentColors.borderLight,
        },
    });

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
        } catch (error: any) {
            console.error('Error loading race results for member navigation:', error);
            // Fallback to league members if race results fail
            try {
                const fallbackResponse = await leaguesAPI.getLeagueMembers(leagueId);
                if (fallbackResponse.data.success) {
                    setLeagueMembers(fallbackResponse.data.data);
                }
            } catch (fallbackError: any) {
                console.error('Error loading league members fallback:', fallbackError);
            }
        }
    }, [leagueId, weekNumber]);

    const navigateToMember = (newUserId: number, newUserName: string, memberIndex?: number) => {
        const baseParams = {
            leagueId: leagueId.toString(),
            weekNumber: weekNumber.toString(),
            userId: newUserId.toString(),
            userName: newUserName,
            leagueName: leagueName,
        };

        const finalParams = memberIndex !== undefined
            ? { ...baseParams, memberIndex: memberIndex.toString() }
            : baseParams;

        // Use replace instead of push to avoid building up navigation stack
        router.replace({
            pathname: '/member-picks',
            params: finalParams,
        });
    };

    const getCurrentMemberIndex = () => {
        // Handle duplicate userIds by finding ALL matches and using params to determine which one
        const memberIndex = params.memberIndex ? parseInt(params.memberIndex as string) : null;

        if (memberIndex !== null) {

            return memberIndex >= 0 && memberIndex < leagueMembers.length ? memberIndex : 0;
        }

        // For backward compatibility, find by userId but handle duplicates
        const allMatchingIndices = leagueMembers
            .map((member, index) => member.id === userId ? index : -1)
            .filter(index => index !== -1);



        // Return the first match, or 0 if no match found
        return allMatchingIndices.length > 0 ? allMatchingIndices[0] : 0;
    };

    const canNavigatePrevious = () => {
        return getCurrentMemberIndex() > 0;
    };

    const canNavigateNext = () => {
        return getCurrentMemberIndex() < leagueMembers.length - 1;
    };

    const navigateToPrevious = () => {
        const currentIndex = getCurrentMemberIndex();
        if (currentIndex > 0) {
            const prevMember = leagueMembers[currentIndex - 1];
            navigateToMember(prevMember.id, prevMember.name, currentIndex - 1);
        }
    };

    const navigateToNext = () => {
        const currentIndex = getCurrentMemberIndex();
        if (currentIndex < leagueMembers.length - 1) {
            const nextMember = leagueMembers[currentIndex + 1];
            navigateToMember(nextMember.id, nextMember.name, currentIndex + 1);
        }
    };

    useEffect(() => {
        loadMemberPicks();
        loadLeagueMembers();
    }, [loadMemberPicks, loadLeagueMembers]);

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

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={currentColors.primary} />
                    <Text style={styles.loadingText}>Loading member picks...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={currentColors.error} />
                    <Text style={styles.errorTitle}>Error Loading Picks</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadMemberPicks}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!memberPicks) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>No Picks Available</Text>
                            <Text style={styles.subtitle}>
                                {leagueName || 'Loading...'}
                            </Text>
                            <Text style={styles.userInfo}>
                                {userName} - Week {weekNumber}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyMessage}>
                            No picks are available for this member yet.
                        </Text>
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
                        <Text style={styles.title}>Member Picks</Text>
                    </View>
                </View>

                <Text style={styles.description}>
                    {leagueName || 'Loading...'} • Week {weekNumber}
                </Text>

                {/* Member Context with Navigation */}
                <View style={styles.memberSection}>
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
                                color={canNavigatePrevious() ? currentColors.textPrimary : currentColors.textSecondary}
                            />
                        </TouchableOpacity>

                        {/* Member Context */}
                        <View style={styles.memberContext}>
                            <Avatar
                                src={memberPicks?.userAvatar}
                                size="sm"
                                fallback={userName?.charAt(0).toUpperCase() || 'U'}
                            />
                            <Text style={styles.memberLabel}>Viewing picks by {userName}</Text>
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
                                color={canNavigateNext() ? currentColors.textPrimary : currentColors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary Stats */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Picks</Text>
                        <Text style={styles.summaryValue}>{memberPicks.totalPicks}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Correct Picks</Text>
                        <Text style={styles.summaryValue}>{memberPicks.correctPicks}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Accuracy</Text>
                        <Text style={styles.summaryValue}>{memberPicks.accuracy}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Points</Text>
                        <Text style={styles.summaryValue}>{memberPicks.totalPoints}</Text>
                    </View>
                </View>

                {/* Picks List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>All Picks</Text>
                    {memberPicks.picks.length === 0 ? (
                        <View style={styles.emptyPicksContainer}>
                            <Ionicons name="clipboard-outline" size={48} color={currentColors.textSecondary} />
                            <Text style={styles.emptyPicksTitle}>No Picks Made</Text>
                            <Text style={styles.emptyPicksMessage}>
                                {userName} hasn&apos;t made any picks for Week {weekNumber} yet.
                            </Text>
                        </View>
                    ) : (
                        memberPicks.picks.map((pick, index) => (
                            <View key={index} style={styles.pickCard}>
                                <View style={styles.pickHeader}>
                                    <View style={styles.positionBadge}>
                                        <Text style={styles.positionText}>P{pick.position}</Text>
                                    </View>
                                    <View style={styles.pickInfo}>
                                        <Text style={styles.pickLabel}>
                                            {getPositionLabel(pick.position)}
                                        </Text>
                                        <Text style={styles.pickDriver}>
                                            {pick.driverName || 'No pick made'}
                                        </Text>
                                        {pick.driverTeam && (
                                            <Text style={styles.pickTeam}>
                                                {pick.driverTeam}
                                            </Text>
                                        )}
                                    </View>
                                    {pick.points !== null && (
                                        <View style={styles.scoreInfo}>
                                            <Text style={styles.pointsText}>{pick.points} pts</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Actual Result */}
                                {pick.actualDriverName && (
                                    <View style={[
                                        styles.actualResult,
                                        pick.isCorrect === true ? styles.correctResult : styles.incorrectResult
                                    ]}>
                                        <Text style={[
                                            styles.actualResultLabel,
                                            pick.isCorrect === true ? styles.correctResultLabel : styles.incorrectResultLabel
                                        ]}>Actual:</Text>
                                        <Text style={[
                                            styles.actualResultDriver,
                                            pick.isCorrect === true ? styles.correctResultDriver : styles.incorrectResultDriver
                                        ]}>
                                            {pick.actualDriverName} ({pick.actualDriverTeam})
                                        </Text>
                                        {pick.actualFinishPosition && (
                                            <Text style={[
                                                styles.actualPosition,
                                                pick.isCorrect === true ? styles.correctResultPosition : styles.incorrectResultPosition
                                            ]}>
                                                Finished P{pick.actualFinishPosition}
                                            </Text>
                                        )}
                                        {pick.isCorrect === true && (
                                            <Text style={styles.correctText}>✓ Correct</Text>
                                        )}
                                        {pick.isCorrect === false && (
                                            <Text style={styles.incorrectText}>✗ Incorrect</Text>
                                        )}
                                    </View>
                                )}

                                {/* No Result Yet */}
                                {!pick.actualDriverName && (
                                    <View style={styles.noResult}>
                                        <Text style={styles.noResultText}>
                                            Race not scored yet
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default MemberPicksScreen;

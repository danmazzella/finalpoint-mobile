import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { leaguesAPI, picksAPI, f1racesAPI, activityAPI } from '../../src/services/apiService';
import { League, LeagueMember, LeagueStanding, LeagueStats, F1Race, Activity } from '../../src/types';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../../constants/Colors';
import { spacing, borderRadius, shadows, textStyles } from '../../utils/styles';

const LeagueDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const leagueId = Number(id);



    const [league, setLeague] = useState<League | null>(null);
    const [members, setMembers] = useState<LeagueMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMembers, setShowMembers] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [loadingCurrentRace, setLoadingCurrentRace] = useState(false);
    const [currentRace, setCurrentRace] = useState<F1Race | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        loadLeagueData();
    }, [leagueId]);

    // Validate leagueId after all hooks
    if (!leagueId || isNaN(leagueId)) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
                    <Text style={styles.errorTitle}>Invalid League</Text>
                    <Text style={styles.errorMessage}>The league ID is invalid. Please try again.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const loadLeagueData = async (retryCount = 0) => {
        try {
            setLoading(true);
            setError(null);


            const [leagueResponse, currentRaceResponse, activityResponse] = await Promise.all([
                leaguesAPI.getLeague(leagueId),
                f1racesAPI.getCurrentRace(),
                activityAPI.getRecentActivity(leagueId, 5)
            ]);



            if (leagueResponse?.data?.success) {
                setLeague(leagueResponse.data.data);
            } else {
                console.error('League response not successful:', leagueResponse);
                setError('Failed to load league data. Please try again.');
            }

            if (currentRaceResponse?.data?.success) {
                setCurrentRace(currentRaceResponse.data.data);
            }

            if (activityResponse?.data?.success) {
                setActivities(activityResponse.data.data);
            }
        } catch (error: any) {
            console.error('Error loading league data:', error);


            // Handle 429 rate limiting error with retry
            if (error.response?.status === 429 && retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff

                setTimeout(() => {
                    loadLeagueData(retryCount + 1);
                }, delay);
                return;
            } else if (error.response?.status === 429) {
                setError('Too many requests. Please wait a moment and try again.');
            } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                setError('Unable to connect to server. Please check your internet connection.');
            } else {
                setError('Failed to load league data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        loadLeagueData();
    };

    const loadLeagueMembers = async () => {
        try {
            const response = await leaguesAPI.getLeagueMembers(leagueId);
            if (response.data.success) {
                setMembers(response.data.data);
            }
        } catch (error: any) {
            console.error('Error loading league members:', error);
            if (error.response?.status === 429) {
                Alert.alert('Rate Limited', 'Too many requests. Please wait a moment and try again.');
            }
        }
    };

    const shareLeague = () => {
        if (league?.joinCode) {
            const shareUrl = `https://yourapp.com/joinleague/${league.joinCode}`;
            Alert.alert(
                'Share League',
                `Share this link with friends to invite them to join ${league.name}:`,
                [
                    {
                        text: 'Copy Link', onPress: () => {
                            // In a real app, you'd use Clipboard API
                            Alert.alert('Link copied to clipboard!');
                        }
                    },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        }
    };

    const navigateToResults = () => {
        if (currentRace) {
            router.push(`/race-results?leagueId=${leagueId}&weekNumber=${currentRace.weekNumber}` as any);
        } else {
            router.push(`/race-results?leagueId=${leagueId}&weekNumber=1` as any);
        }
    };

    const navigateToPicks = () => {
        router.push('/(tabs)/picks' as any);
    };

    const getActivityIcon = (activityType: string) => {
        switch (activityType) {
            case 'pick_created':
                return 'checkmark-circle';
            case 'pick_updated':
                return 'refresh-circle';
            case 'pick_changed':
                return 'swap-horizontal';
            case 'pick_removed':
                return 'trash';
            case 'member_joined':
            case 'user_joined':
                return 'person-add';
            case 'member_left':
                return 'person-remove';
            case 'race_result_processed':
                return 'flag';
            case 'league_created':
                return 'trophy';
            case 'league_name_changed':
                return 'create';
            default:
                return 'information-circle';
        }
    };

    const getActivityMessage = (activity: Activity) => {
        switch (activity.activityType) {
            case 'pick_created':
                return `Picked ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) for P${activity.position || '?'}`;
            case 'pick_updated':
                return `Updated pick to ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) for P${activity.position || '?'}`;
            case 'pick_changed':
                return `Changed pick from ${activity.previousDriverName || 'Unknown'} to ${activity.driverName || 'Unknown'} for P${activity.position || '?'}`;
            case 'pick_removed':
                return `Removed pick for ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) from P${activity.position || '?'}`;
            case 'member_joined':
            case 'user_joined':
                return 'Joined the league';
            case 'member_left':
                return 'Left the league';
            case 'race_result_processed':
                return `Race results processed for ${activity.raceName || 'Unknown Race'}`;
            case 'league_created':
                return 'Created the league';
            case 'league_name_changed':
                return 'Changed the league name';
            default:
                // Smart fallback for pick activities with driver change data
                if (activity.activityType?.includes('pick') && activity.previousDriverName && activity.driverName) {
                    return `Changed pick from ${activity.previousDriverName} to ${activity.driverName} for P${activity.position || '?'}`;
                }
                // Better generic fallback
                return activity.activityType ? activity.activityType.replace(/_/g, ' ') : 'Activity recorded';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer} edges={['top', 'left', 'right']}>
                <View style={styles.errorCard}>
                    <Ionicons name="cloud-offline" size={48} color={Colors.light.error} />
                    <Text style={styles.errorTitle}>Connection Error</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!league) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <Text style={styles.errorText}>League not found</Text>
            </SafeAreaView>
        );
    }

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
                        <Text style={styles.leagueName}>{league.name}</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={navigateToPicks}
                        >
                            <Text style={styles.primaryButtonText}>Make Picks</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.push(`/league/${leagueId}/standings`)}
                        >
                            <Text style={styles.secondaryButtonText}>
                                View Standings
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={navigateToResults}
                        >
                            <Text style={styles.secondaryButtonText}>
                                {loadingCurrentRace ? 'Loading...' : 'View Results'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* League Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>League Stats</Text>
                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Total Picks</Text>
                            <Text style={styles.infoValue}>143</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Correct Picks</Text>
                            <Text style={styles.infoValue}>9</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Accuracy</Text>
                            <Text style={styles.infoValue}>6.3%</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Average Points</Text>
                            <Text style={styles.infoValue}>0.63</Text>
                        </View>
                    </View>
                </View>

                {/* League Information */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>League Information</Text>
                        <TouchableOpacity style={styles.shareIconButton} onPress={shareLeague}>
                            <Ionicons name="share-outline" size={20} color={Colors.light.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Season</Text>
                            <Text style={styles.infoValue}>{league.seasonYear}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Members</Text>
                            <Text style={styles.infoValue}>
                                {league.memberCount || 1} member{league.memberCount !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Your Role</Text>
                            <Text style={styles.infoValue}>{league.userRole}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>Active</Text>
                            </View>
                        </View>
                        {league.joinCode && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Join Code</Text>
                                <View style={styles.codeBadge}>
                                    <Text style={styles.codeText}>{league.joinCode}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity onPress={() => {
                            router.push(`/activity?leagueId=${leagueId}&leagueName=${league?.name || 'League'}` as any);
                        }}>
                            <Text style={styles.viewAllLink}>View All Activity →</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.activityContainer}>
                        <Text style={styles.activityCount}>
                            Found {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
                        </Text>
                        {activities.length > 0 ? (
                            activities.map((activity, index) => (
                                <View key={activity.id || index} style={styles.activityItem}>
                                    <Ionicons
                                        name={getActivityIcon(activity.activityType) as any}
                                        size={20}
                                        color={Colors.light.primary}
                                    />
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityUser}>
                                            {activity.userName || 'Unknown User'}
                                        </Text>
                                        <Text style={styles.activityMessage}>
                                            {getActivityMessage(activity)}
                                        </Text>
                                    </View>
                                    <Text style={styles.activityDate}>
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyActivityText}>No recent activity</Text>
                        )}
                    </View>
                </View>

                {/* League Members */}
                {showMembers && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>League Members</Text>
                        {members.length > 0 ? (
                            members.map((member) => (
                                <View key={member.id} style={styles.memberCard}>
                                    <View style={styles.memberInfo}>
                                        <View style={styles.memberAvatar}>
                                            <Text style={styles.memberInitial}>
                                                {member.userName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.memberDetails}>
                                            <Text style={styles.memberName}>{member.userName}</Text>
                                            <Text style={styles.memberRole}>{member.userRole}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.memberDate}>
                                        {new Date(member.joinedAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No members found</Text>
                        )}
                    </View>
                )}

                {/* League Standings */}
                {/* Removed League Standings section */}

                {/* Bottom spacing for mobile to account for fixed bottom navigation */}
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
        padding: 20,
        backgroundColor: Colors.light.backgroundPrimary,
    },
    errorCard: {
        backgroundColor: Colors.light.cardBackground,
        padding: 20,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: borderRadius.md,
    },
    retryButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 18,
        color: Colors.light.textPrimary,
        textAlign: 'center',
        marginTop: 50,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingRight: spacing.lg,
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
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
    leagueName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    leagueSubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    section: {
        backgroundColor: Colors.light.cardBackground,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.md,
    },
    actionButtons: {
        gap: spacing.md,
    },
    primaryButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: Colors.light.cardBackground,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: Colors.light.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    shareButton: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    shareButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    statCard: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        minWidth: '48%',
        ...shadows.sm,
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
        color: Colors.light.textPrimary,
        textAlign: 'center',
    },
    infoContainer: {
        gap: spacing.sm,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    memberCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 10,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e91e63',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberInitial: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberDetails: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    memberRole: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    memberDate: {
        fontSize: 12,
        color: '#999',
    },
    standingCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 10,
    },
    standingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    standingPosition: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    firstPlace: {
        backgroundColor: '#FFD700',
    },
    secondPlace: {
        backgroundColor: '#C0C0C0',
    },
    thirdPlace: {
        backgroundColor: '#CD7F32',
    },
    otherPlace: {
        backgroundColor: '#e0e0e0',
    },
    standingPositionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    standingDetails: {
        flex: 1,
    },
    standingName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    standingStats: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    standingPoints: {
        alignItems: 'flex-end',
    },
    standingPointsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    standingAccuracy: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    headerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.backgroundTertiary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
    },
    headerButtonText: {
        marginLeft: spacing.xs,
        fontSize: 12,
        fontWeight: '500',
        color: Colors.light.textSecondary,
    },
    statusBadge: {
        backgroundColor: Colors.light.successLight,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    statusText: {
        color: Colors.light.success,
        fontSize: 12,
        fontWeight: '600',
    },
    codeBadge: {
        backgroundColor: Colors.light.backgroundTertiary,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    codeText: {
        color: Colors.light.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    viewAllLink: {
        color: Colors.light.buttonPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    activityContainer: {
        paddingVertical: spacing.md,
        paddingRight: spacing.md,
    },
    activityCount: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.sm,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
    },
    activityContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    activityUser: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textPrimary,
    },
    activityMessage: {
        fontSize: 13,
        color: Colors.light.textSecondary,
        marginTop: spacing.xs,
    },
    activityDate: {
        fontSize: 12,
        color: Colors.light.textTertiary,
        marginTop: spacing.xs,
    },
    bottomSpacing: {
        height: 100, // Account for fixed bottom navigation
    },
    shareIconButton: {
        padding: spacing.xs,
    },
    emptyActivityText: {
        textAlign: 'center',
        color: Colors.light.textSecondary,
        fontSize: 14,
        marginTop: spacing.sm,
    },
});

export default LeagueDetailScreen;

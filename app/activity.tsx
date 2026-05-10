import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activityAPI } from '../src/services/apiService';
import { Activity } from '../src/types';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { spacing, borderRadius, shadows } from '../utils/styles';
import Avatar from '../src/components/Avatar';
import GlassBackground from '../src/components/GlassBackground';

const ActivityScreen = () => {
    const params = useLocalSearchParams();
    const leagueId = Number(params.leagueId);
    const leagueName = params.leagueName as string;
    const { resolvedTheme } = useTheme();

    // Get current theme colors from universal palette
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors
    const universalStyles = createThemeStyles(currentColors);

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadActivities = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await activityAPI.getLeagueActivity(leagueId, 50);

            if (response.data.success) {
                setActivities(response.data.data);
            } else {
                setError('Failed to load activities');
            }
        } catch (error: any) {
            console.error('Error loading activities:', error);
            if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                setError('Unable to connect to server. Please check your internet connection.');
            } else {
                setError('Failed to load activities. Please try again.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadActivities();
    }, [leagueId]);

    const onRefresh = () => {
        loadActivities(true);
    };

    // Create styles with current theme colors
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'transparent',
            paddingTop: Platform.OS === 'android' ? 0 : 0,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
        },
        loadingText: {
            marginTop: 16,
            fontSize: 16,
            color: currentColors.textSecondary,
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
            padding: 20,
        },
        errorTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.error,
            marginBottom: 10,
        },
        errorMessage: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginBottom: 20,
        },
        retryButton: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 8,
        },
        retryButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: '600',
        },
        header: {
            backgroundColor: currentColors.glassBackground,
            paddingRight: spacing.lg,
            paddingVertical: spacing.md,
            minHeight: 64,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.glassBorder,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        headerContent: {
            flex: 1,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        headerSubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        backButton: {
            paddingLeft: spacing.md,
            paddingRight: spacing.lg,
            paddingVertical: spacing.sm,
        },
        listContent: {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: 100,
        },
        description: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginBottom: spacing.lg,
            marginTop: spacing.md,
            textAlign: 'center',
        },
        sectionHeader: {
            marginBottom: spacing.md,
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: spacing.xs,
        },
        sectionSubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        list: {
            flex: 1,
        },
        activityItem: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingVertical: 12,
            paddingHorizontal: 12,
            marginBottom: 8,
            backgroundColor: currentColors.glassBackground,
            borderWidth: 1,
            borderColor: currentColors.glassBorder,
            borderRadius: 12,
        },
        activityAvatar: {
            marginRight: 12,
        },
        avatarText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.textSecondary,
        },
        activityContent: {
            flex: 1,
        },
        activityTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 4,
        },
        activityDetails: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 4,
        },
        activityTime: {
            fontSize: 12,
            color: currentColors.textTertiary,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: 8,
        },
        emptyMessage: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
        },
    });

    const getActivityIcon = (activityType: string) => {
        switch (activityType) {
            case 'pick_created':
                return '✅';
            case 'pick_changed':
                return '🔄';
            case 'pick_removed':
                return '🗑️';
            case 'member_joined':
            case 'user_joined':
                return '👋';
            case 'member_left':
                return '👋';
            case 'league_created':
                return '🏆';
            case 'league_name_changed':
                return '✏️';
            case 'league_visibility_changed':
                return '🌐';
            case 'race_result_processed':
                return '🏁';
            default:
                return '📝';
        }
    };

    const getActivityTitle = (activity: Activity) => {
        return activity.primaryMessage || (() => {
            // Fallback to old field logic for backwards compatibility
            switch (activity.activityType) {
                case 'pick_created':
                    return `${activity.userName} made a pick`;
                case 'pick_changed':
                    return `${activity.userName} changed their pick from ${activity.previousDriverName || 'Unknown'} to ${activity.driverName || 'Unknown'}`;
                case 'pick_removed':
                    return `${activity.userName} removed their pick`;
                case 'member_joined':
                case 'user_joined':
                    return `${activity.userName} joined the league`;
                case 'member_left':
                    return `${activity.userName} left the league`;
                case 'league_created':
                    return `${activity.userName} created the league`;
                case 'league_name_changed':
                    return `${activity.userName} changed the league name`;
                case 'league_visibility_changed':
                    return `${activity.userName} changed the league visibility`;
                case 'race_result_processed':
                    return `Race results processed for Week ${activity.weekNumber || 'Unknown'}`;
                case 'picks_locked':
                    return 'Picks locked';
                // Admin activities
                case 'admin_user_added_to_league':
                    return `${activity.driverName || 'Admin added user to league'}`;
                case 'admin_user_removed_from_league':
                    return `${activity.driverName || 'Admin removed user from league'}`;
                case 'admin_pick_created':
                    return `${activity.driverName || 'Admin created pick for user'}`;
                case 'admin_pick_updated':
                    return `${activity.driverName || 'Admin updated user\'s pick'}`;
                case 'admin_pick_deleted':
                    return `${activity.driverName || 'Admin deleted user\'s pick'}`;
                case 'admin_user_role_updated':
                    return `${activity.driverName || 'Admin updated user role'}`;
                default:
                    return `${activity.userName || 'System'} ${activity.activityType.replace(/_/g, ' ')}`;
            }
        })();
    };

    const getActivityDetails = (activity: Activity) => {
        return activity.secondaryMessage || (() => {
            // Fallback to old field logic for backwards compatibility
            switch (activity.activityType) {
                case 'pick_created':
                    if (activity.driverName && activity.position) {
                        return `P${activity.position}: ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) • Week ${activity.weekNumber || 'Unknown'}`;
                    }
                    return `Picked ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) for P${activity.position || '?'} • Week ${activity.weekNumber || 'Unknown'}`;
                case 'pick_changed':
                    if (activity.position) {
                        return `Position P${activity.position || '?'} • Week ${activity.weekNumber || 'Unknown'}`;
                    }
                    return `Week ${activity.weekNumber || 'Unknown'}`;
                case 'pick_removed':
                    return `Removed ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) from P${activity.position || '?'} • Week ${activity.weekNumber || 'Unknown'}`;
                case 'member_joined':
                case 'user_joined':
                    return 'Welcome to the league!';
                case 'member_left':
                    return 'Goodbye!';
                case 'league_name_changed':
                    return `Changed from "${activity.previousDriverName || 'Unknown'}" to "${activity.driverName || 'Unknown'}"`;
                case 'league_visibility_changed':
                    return `Changed league visibility from "${activity.previousDriverName || 'Unknown'}"`;
                case 'league_created':
                    return 'League created successfully';
                case 'race_result_processed':
                    return `${activity.raceName ? `${activity.raceName} - ` : ''}${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) finished in P${activity.position || '?'}`;
                case 'picks_locked':
                    return `Picks locked for ${activity.raceName || 'this race'} • Week ${activity.weekNumber || 'Unknown'}`;
                // Admin activities
                case 'admin_user_added_to_league':
                    return `${activity.driverTeam || 'Welcome to the league!'}`;
                case 'admin_user_removed_from_league':
                    return `${activity.driverTeam || 'Goodbye!'}`;
                case 'admin_pick_created':
                    return `Picked ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) for P${activity.position || '?'} • Week ${activity.weekNumber || 'Unknown'}`;
                case 'admin_pick_updated':
                    return `Changed pick from ${activity.previousDriverName || 'Unknown'} to ${activity.driverName || 'Unknown'} for P${activity.position || '?'} • Week ${activity.weekNumber || 'Unknown'}`;
                case 'admin_pick_deleted':
                    return `Removed ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) from P${activity.position || '?'} • Week ${activity.weekNumber || 'Unknown'}`;
                case 'admin_user_role_updated':
                    return `${activity.driverTeam || 'User role updated by administrator'}`;
                default:
                    return `Picked ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) for P${activity.position || '?'}`;
            }
        })();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    const renderActivityItem = ({ item }: { item: Activity }) => (
        <View style={styles.activityItem}>
            <Avatar
                src={item.userAvatar}
                size="sm"
                fallback={item.userName ? item.userName.charAt(0).toUpperCase() : 'A'}
                style={styles.activityAvatar}
            />
            <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{getActivityTitle(item)}</Text>
                <Text style={styles.activityDetails}>{getActivityDetails(item)}</Text>
                <Text style={styles.activityTime}>{formatDate(item.createdAt)}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <GlassBackground>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentColors.primary} />
                <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
            </GlassBackground>
        );
    }

    if (error) {
        return (
            <GlassBackground>
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Connection Error</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => loadActivities()}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
            </GlassBackground>
        );
    }

    return (
        <GlassBackground>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Activity</Text>
                    <Text style={styles.headerSubtitle}>{leagueName}</Text>
                </View>
            </View>

            <FlatList
                data={activities}
                renderItem={renderActivityItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>All Activity</Text>
                        <Text style={styles.sectionSubtitle}>Complete history of all league activity</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[currentColors.primary]}
                        tintColor={currentColors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No Activity Yet</Text>
                        <Text style={styles.emptyMessage}>
                            When members make picks or join the league, activity will appear here.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
        </GlassBackground>
    );
};

export default ActivityScreen;


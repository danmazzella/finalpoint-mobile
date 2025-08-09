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
import Colors from '../constants/Colors';
import { spacing, borderRadius } from '../utils/styles';
import Avatar from '../src/components/Avatar';

const ActivityScreen = () => {
    const params = useLocalSearchParams();
    const leagueId = Number(params.leagueId);
    const leagueName = params.leagueName as string;

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
            case 'race_result_processed':
                return '🏁';
            default:
                return '📝';
        }
    };

    const getActivityTitle = (activity: Activity) => {
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
                return 'League created';
            case 'league_name_changed':
                return `${activity.userName} changed the league name`;
            case 'race_result_processed':
                return `Race results processed for Week ${activity.weekNumber || 'Unknown'}`;
            default:
                // Smart fallback for pick activities with driver change data
                if (activity.activityType?.includes('pick') && activity.previousDriverName && activity.driverName) {
                    return `${activity.userName} changed their pick from ${activity.previousDriverName} to ${activity.driverName}`;
                }
                // Better generic fallback
                return `${activity.userName || 'System'} ${activity.activityType ? activity.activityType.replace(/_/g, ' ') : 'performed an action'}`;
        }
    };

    const getActivityDetails = (activity: Activity) => {
        switch (activity.activityType) {
            case 'pick_created':
                if (activity.driverName && activity.position) {
                    return `P${activity.position}: ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) • Week ${activity.weekNumber || 'Unknown'}`;
                }
                return activity.driverName ? `${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) • Week ${activity.weekNumber || 'Unknown'}` : 'Driver selection';
            case 'pick_changed':
                if (activity.position) {
                    return `Position P${activity.position || '?'} • Week ${activity.weekNumber || 'Unknown'}`;
                }
                return `Week ${activity.weekNumber || 'Unknown'}`;
            case 'pick_removed':
                return `Removed ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) from P${activity.position || '?'} • Week ${activity.weekNumber || 'Unknown'}`;
            case 'member_joined':
            case 'user_joined':
            case 'member_left':
                return 'League membership change';
            case 'league_created':
                return 'League created successfully';
            case 'league_name_changed':
                return 'League settings updated';
            case 'race_result_processed':
                return `${activity.raceName || 'Unknown Race'} - ${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) finished P${activity.position || '?'}`;
            default:
                // Show additional context for pick activities
                if (activity.activityType?.includes('pick') && activity.driverName) {
                    return `${activity.driverName || 'Unknown'} (${activity.driverTeam || 'Unknown'}) • P${activity.position || '?'} • Week ${activity.weekNumber || 'Unknown'}`;
                }
                return activity.activityType ? activity.activityType.replace(/_/g, ' ') : 'Activity recorded';
        }
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
        );
    }

    if (error) {
        return (
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
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Activity</Text>
                    <Text style={styles.headerSubtitle}>{leagueName}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>All Activity</Text>
                    <Text style={styles.sectionSubtitle}>Complete history of all league activity</Text>
                </View>

                <FlatList
                    data={activities}
                    renderItem={renderActivityItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#007bff']}
                            tintColor="#007bff"
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
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: Platform.OS === 'android' ? 0 : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#dc3545',
        marginBottom: 10,
    },
    errorMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        backgroundColor: Colors.light.cardBackground,
        paddingRight: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 64,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
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
        color: Colors.light.textPrimary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    backButton: {
        paddingLeft: spacing.md,
        paddingRight: spacing.sm,
        paddingVertical: spacing.sm,
    },
    content: {
        flex: 1,
        backgroundColor: Colors.light.cardBackground,
        margin: spacing.md,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    description: {
        fontSize: 16,
        color: '#666',
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
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    list: {
        flex: 1,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    activityDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 12,
        color: '#999',
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
        color: '#333',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default ActivityScreen;


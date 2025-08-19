import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { leaguesAPI, picksAPI, activityAPI } from '../../src/services/apiService';
import { League, LeagueMember, LeagueStanding, LeagueStats, Activity } from '../../src/types';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../../constants/Colors';
import { spacing, borderRadius, shadows, textStyles } from '../../utils/styles';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import { useAuth } from '../../src/context/AuthContext';

const LeagueDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const leagueId = Number(id);
    const { showToast } = useSimpleToast();
    const { user } = useAuth();



    const [league, setLeague] = useState<League | null>(null);
    const [members, setMembers] = useState<LeagueMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMembers, setShowMembers] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

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

            // Always load basic league data (public)
            const leagueResponse = await leaguesAPI.getLeague(leagueId);

            if (leagueResponse?.data?.success) {
                setLeague(leagueResponse.data.data);
            } else {
                console.error('League response not successful:', leagueResponse);
                setError('Failed to load league data. Please try again.');
                return;
            }

            // Load league stats for all users (public data)
            const statsResponse = await leaguesAPI.getLeagueStats(leagueId);
            if (statsResponse?.data?.success) {
                setLeagueStats(statsResponse.data.data);
            } else {
                console.error('Stats response not successful:', statsResponse);
            }

            // Only load authenticated data if user is logged in
            if (user) {
                const activityResponse = await activityAPI.getRecentActivity(leagueId, 5);

                if (activityResponse?.data?.success) {
                    setActivities(activityResponse.data.data);
                }
            } else {
                // For unauthenticated users, set empty/default values
                setActivities([]);
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

    const updateLeagueName = async () => {
        if (!editingName.trim() || !league) return;

        try {
            setUpdating(true);
            const response = await leaguesAPI.updateLeague(league.id, editingName.trim());

            if (response.data.success) {
                setLeague({ ...league, name: editingName.trim() });
                setEditingName('');
                setShowSettings(false);
                Alert.alert('Success', 'League name updated successfully');
            } else {
                Alert.alert('Error', response.data.message || 'Failed to update league name');
            }
        } catch (error: any) {
            console.error('Error updating league name:', error);
            Alert.alert('Error', 'Failed to update league name. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const updateLeagueVisibility = async (isPublic: boolean) => {
        if (!league) return;

        try {
            setUpdating(true);
            const response = await leaguesAPI.updateLeague(league.id, league.name, isPublic);

            if (response.data.success) {
                setLeague({ ...league, isPublic });
                Alert.alert('Success', `League is now ${isPublic ? 'public' : 'private'}`);
            } else {
                Alert.alert('Error', response.data.message || 'Failed to update league visibility');
            }
        } catch (error: any) {
            console.error('Error updating league visibility:', error);
            Alert.alert('Error', 'Failed to update league visibility. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const deleteLeague = async () => {
        if (!league) return;

        try {
            setDeleting(true);
            const response = await leaguesAPI.deleteLeague(league.id);

            if (response.data.success) {
                Alert.alert('Success', 'League deleted successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', response.data.message || 'Failed to delete league');
            }
        } catch (error: any) {
            console.error('Error deleting league:', error);
            Alert.alert('Error', 'Failed to delete league. Please try again.');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const leaveLeague = async () => {
        if (!league) return;

        try {
            setLeaving(true);
            const response = await leaguesAPI.leaveLeague(league.id);

            if (response.data.success) {
                Alert.alert('Success', 'You have left the league', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', response.data.message || 'Failed to leave league');
            }
        } catch (error: any) {
            console.error('Error leaving league:', error);
            Alert.alert('Error', 'Failed to leave league. Please try again.');
        } finally {
            setLeaving(false);
            setShowLeaveConfirm(false);
        }
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

    const shareLeague = async () => {
        if (league?.joinCode) {
            const shareUrl = `https://finalpoint.app/joinleague/${league.joinCode}`;
            try {
                await Clipboard.setString(shareUrl);
                showToast('League link copied to clipboard!', 'success');
            } catch (error) {
                console.error('Failed to copy to clipboard:', error);
                showToast('Failed to copy link to clipboard', 'error');
            }
        }
    };

    const navigateToResults = () => {
        router.push(`/race-results?leagueId=${leagueId}&weekNumber=1` as any);
    };

    const navigateToPicks = () => {
        router.push(`/(tabs)/picks?leagueId=${leagueId}`);
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
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => {
                            setShowSettings(true);
                        }}
                    >
                        <Ionicons name="settings-outline" size={24} color={Colors.light.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Quick Actions for Unauthenticated Users */}
                {!user && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <Text style={styles.sectionSubtitle}>
                            Log in to make picks and join this league
                        </Text>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => router.push('/login')}
                            >
                                <Text style={styles.primaryButtonText}>Log In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => router.push('/signup')}
                            >
                                <Text style={styles.secondaryButtonText}>Sign Up</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => router.push(`/league/${leagueId}/standings`)}
                            >
                                <Text style={styles.secondaryButtonText}>View Standings</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => router.push(`/race-results?leagueId=${leagueId}`)}
                            >
                                <Text style={styles.secondaryButtonText}>View Results</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Quick Actions for Authenticated Users */}
                {user && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => router.push(`/(tabs)/picks?leagueId=${leagueId}`)}
                            >
                                <Text style={styles.primaryButtonText}>Make Picks</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => router.push(`/league/${leagueId}/standings`)}
                            >
                                <Text style={styles.secondaryButtonText}>View Standings</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => router.push(`/race-results?leagueId=${leagueId}`)}
                            >
                                <Text style={styles.secondaryButtonText}>View Results</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* League Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>League Stats</Text>
                    <View style={styles.infoContainer}>
                        {loadingStats || !leagueStats ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={Colors.light.primary} />
                                <Text style={styles.loadingText}>Loading stats...</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Total Picks</Text>
                                    <Text style={styles.infoValue}>{leagueStats.totalPicks}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Correct Picks</Text>
                                    <Text style={styles.infoValue}>{leagueStats.correctPicks}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Accuracy</Text>
                                    <Text style={styles.infoValue}>{leagueStats.accuracy || 0}%</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Average Points</Text>
                                    <Text style={styles.infoValue}>{leagueStats.averagePoints}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* League Information */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>League Information</Text>
                        {user && (
                            <TouchableOpacity style={styles.shareIconButton} onPress={shareLeague}>
                                <Ionicons name="share-outline" size={20} color={Colors.light.textSecondary} />
                            </TouchableOpacity>
                        )}
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
                        {user ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Your Role</Text>
                                <Text style={styles.infoValue}>{league.userRole}</Text>
                            </View>
                        ) : (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Your Status</Text>
                                <View style={styles.guestBadge}>
                                    <Text style={styles.guestBadgeText}>Guest Viewer</Text>
                                </View>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>Active</Text>
                            </View>
                        </View>
                        {league.joinCode && user && (
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
                        {user && (
                            <TouchableOpacity onPress={() => {
                                router.push(`/activity?leagueId=${leagueId}&leagueName=${league?.name || 'League'}` as any);
                            }}>
                                <Text style={styles.viewAllLink}>View All Activity →</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.activityContainer}>
                        {!user ? (
                            // Unauthenticated user view
                            <View style={styles.unauthenticatedContent}>
                                <Text style={styles.unauthenticatedText}>
                                    Log in to see recent activity and member interactions
                                </Text>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => router.push('/login')}
                                >
                                    <Text style={styles.primaryButtonText}>Log In</Text>
                                </TouchableOpacity>
                            </View>
                        ) : activities.length > 0 ? (
                            // Authenticated user with activities
                            <>
                                <Text style={styles.activityCount}>
                                    Found {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
                                </Text>
                                {activities.map((activity, index) => (
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
                                ))}
                            </>
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

                {/* Bottom spacing for navigation */}
                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Settings Modal */}
            {showSettings && (
                <View style={styles.modalOverlay}>
                    <View style={styles.settingsModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>League Settings</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => {
                                    setShowSettings(false);
                                    setEditingName('');
                                }}
                            >
                                <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.modalContent}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalContentContainer}
                        >
                            {league?.userRole === 'Owner' ? (
                                <>
                                    {/* Update League Name - Owner Only */}
                                    <View style={styles.settingSection}>
                                        <Text style={styles.settingLabel}>League Name</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={editingName || league.name}
                                            onChangeText={setEditingName}
                                            placeholder="Enter league name"
                                            placeholderTextColor={Colors.light.textTertiary}
                                        />
                                        <TouchableOpacity
                                            style={[
                                                styles.primaryButton,
                                                (!editingName.trim() || updating) && styles.disabledButton
                                            ]}
                                            onPress={updateLeagueName}
                                            disabled={updating || !editingName.trim()}
                                        >
                                            <Text style={styles.primaryButtonText}>
                                                {updating ? 'Updating...' : 'Update Name'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* League Visibility Toggle - Owner Only */}
                                    <View style={styles.settingSection}>
                                        <Text style={styles.settingLabel}>League Visibility</Text>
                                        <View style={styles.visibilityOptions}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.visibilityOption,
                                                    !league.isPublic && styles.visibilityOptionSelected
                                                ]}
                                                onPress={() => updateLeagueVisibility(false)}
                                                disabled={updating}
                                            >
                                                <Ionicons
                                                    name="lock-closed"
                                                    size={20}
                                                    color={!league.isPublic ? Colors.light.textInverse : Colors.light.textSecondary}
                                                />
                                                <Text style={[
                                                    styles.visibilityOptionText,
                                                    !league.isPublic && styles.visibilityOptionTextSelected
                                                ]}>
                                                    Private
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.visibilityOption,
                                                    league.isPublic && styles.visibilityOptionSelected
                                                ]}
                                                onPress={() => updateLeagueVisibility(true)}
                                                disabled={updating}
                                            >
                                                <Ionicons
                                                    name="globe"
                                                    size={20}
                                                    color={league.isPublic ? Colors.light.textInverse : Colors.light.textSecondary}
                                                />
                                                <Text style={[
                                                    styles.visibilityOptionText,
                                                    league.isPublic && styles.visibilityOptionTextSelected
                                                ]}>
                                                    Public
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.visibilityDescriptionContainer}>
                                            <Text style={styles.settingDescription}>
                                                {league.isPublic
                                                    ? 'Public leagues can be discovered and joined by any user on the platform.'
                                                    : 'Private leagues can only be joined using the join code.'
                                                }
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Delete League - Owner Only */}
                                    <View style={styles.settingSection}>
                                        <Text style={styles.dangerLabel}>Danger Zone</Text>
                                        <Text style={styles.settingDescription}>
                                            Once you delete a league, there is no going back. Please be certain.
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.dangerButton}
                                            onPress={() => setShowDeleteConfirm(true)}
                                        >
                                            <Text style={styles.dangerButtonText}>Delete League</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <>
                                    {/* Leave League - Member Only */}
                                    <View style={styles.settingSection}>
                                        <Text style={styles.settingLabel}>Leave League</Text>
                                        <Text style={styles.settingDescription}>
                                            You can leave this league at any time. You can rejoin later if you have the join code.
                                        </Text>
                                        <View style={styles.leaveButtonContainer}>
                                            <TouchableOpacity
                                                style={styles.primaryButton}
                                                onPress={() => setShowLeaveConfirm(true)}
                                            >
                                                <Text style={styles.primaryButtonText}>Leave League</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            )}

                            {/* Close Button */}
                            <View style={styles.settingSection}>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={() => {
                                        setShowSettings(false);
                                        setEditingName('');
                                    }}
                                >
                                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmationModal}>
                        <View style={styles.confirmationIcon}>
                            <Ionicons name="warning" size={48} color={Colors.light.warning} />
                        </View>
                        <Text style={styles.confirmationTitle}>Delete League</Text>
                        <Text style={styles.confirmationMessage}>
                            Are you sure you want to delete this league? This action cannot be undone.
                        </Text>
                        <View style={styles.confirmationButtons}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setShowDeleteConfirm(false)}
                            >
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.dangerButton}
                                onPress={deleteLeague}
                                disabled={deleting}
                            >
                                <Text style={styles.dangerButtonText}>
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Leave Confirmation Modal */}
            {showLeaveConfirm && (
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmationModal}>
                        <View style={styles.confirmationIcon}>
                            <Ionicons name="log-out" size={48} color={Colors.light.warning} />
                        </View>
                        <Text style={styles.confirmationTitle}>Leave League</Text>
                        <Text style={styles.confirmationMessage}>
                            Are you sure you want to leave this league? You can rejoin later if you have the join code.
                        </Text>
                        <View style={styles.confirmationButtons}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setShowLeaveConfirm(false)}
                            >
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={leaveLeague}
                                disabled={leaving}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {leaving ? 'Leaving...' : 'Leave League'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
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
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
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
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    settingsButton: {
        paddingLeft: spacing.sm,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    settingsModal: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        width: '90%',
        maxWidth: 400,
        maxHeight: '90%',
        minHeight: 200,
        ...shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
    },
    closeButton: {
        padding: spacing.xs,
    },
    modalContent: {
        minHeight: 150,
    },
    modalContentContainer: {
        paddingBottom: spacing.lg, // Add some padding at the bottom for the close button
        minHeight: 120,
    },
    settingSection: {
        marginBottom: spacing.md,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    visibilityOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: Colors.light.backgroundTertiary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.sm,
        marginTop: spacing.xs,
    },
    visibilityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        minWidth: 100,
        justifyContent: 'center',
    },
    visibilityOptionSelected: {
        backgroundColor: Colors.light.buttonPrimary,
    },
    visibilityOptionText: {
        marginLeft: spacing.sm,
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textSecondary,
    },
    visibilityOptionTextSelected: {
        color: Colors.light.textInverse,
    },
    settingDescription: {
        fontSize: 13,
        color: Colors.light.textSecondary,
        marginTop: spacing.xs,
    },
    updatingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
    },
    updatingText: {
        marginLeft: spacing.sm,
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    textInput: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        fontSize: 16,
        color: Colors.light.textPrimary,
    },
    disabledButton: {
        opacity: 0.7,
    },
    dangerLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.error,
        marginBottom: spacing.xs,
    },
    dangerButton: {
        backgroundColor: Colors.light.errorLight,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    dangerButtonText: {
        color: Colors.light.error,
        fontSize: 16,
        fontWeight: '600',
    },
    confirmationModal: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        ...shadows.lg,
    },
    confirmationIcon: {
        marginBottom: spacing.md,
    },
    confirmationTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    confirmationMessage: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    confirmationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },

    leaveButtonContainer: {
        marginTop: spacing.md,
    },
    visibilityDescriptionContainer: {
        marginTop: spacing.xs,
    },
    loadingText: {
        marginTop: spacing.sm,
        color: Colors.light.textSecondary,
    },
    unauthenticatedContent: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    unauthenticatedText: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    guestBadge: {
        backgroundColor: Colors.light.warningLight,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    guestBadgeText: {
        color: Colors.light.warning,
        fontSize: 12,
        fontWeight: '600',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
});

export default LeagueDetailScreen;

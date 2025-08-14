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
import { leaguesAPI, picksAPI, f1racesAPI, activityAPI } from '../../src/services/apiService';
import { League, LeagueMember, LeagueStanding, LeagueStats, F1Race, Activity } from '../../src/types';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../../constants/Colors';
import { spacing, borderRadius, shadows, textStyles } from '../../utils/styles';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useScreenSize } from '../../hooks/useScreenSize';

const LeagueDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const leagueId = Number(id);
    const { showToast } = useSimpleToast();
    const screenSize = useScreenSize();

    const [league, setLeague] = useState<League | null>(null);
    const [members, setMembers] = useState<LeagueMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMembers, setShowMembers] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [loadingCurrentRace, setLoadingCurrentRace] = useState(false);
    const [currentRace, setCurrentRace] = useState<F1Race | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        loadLeagueData();
    }, [leagueId]);

    // Validate leagueId after all hooks
    if (!leagueId || isNaN(leagueId)) {
        return (
            <SafeAreaView style={styles.container}>
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
                setTimeout(() => loadLeagueData(retryCount + 1), delay);
                return;
            }

            if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                setError('Unable to connect to server. Please check your internet connection.');
            } else {
                setError('Failed to load league data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        if (members.length > 0) return; // Already loaded

        try {
            setLoadingMembers(true);
            const response = await leaguesAPI.getLeagueMembers(leagueId);
            if (response?.data?.success) {
                setMembers(response.data.data);
            }
        } catch (error) {
            console.error('Error loading members:', error);
            showToast('Failed to load members', 'error');
        } finally {
            setLoadingMembers(false);
        }
    };

    const copyJoinCode = async () => {
        if (league?.joinCode) {
            await Clipboard.setString(league.joinCode);
            showToast('Join code copied to clipboard!', 'success');
        }
    };

    const navigateToPicks = () => {
        router.push('/picks' as any);
    };

    const navigateToStandings = () => {
        router.push(`/league/${leagueId}/standings` as any);
    };

    const navigateToResults = () => {
        if (currentRace) {
            router.push(`/race-results?leagueId=${leagueId}&weekNumber=${currentRace.weekNumber}` as any);
        }
    };

    const navigateToActivity = () => {
        router.push('/activity' as any);
    };

    const handleEditName = () => {
        if (editingName.trim() === '') {
            showToast('League name cannot be empty', 'error');
            return;
        }

        if (editingName === league?.name) {
            setShowSettings(false);
            setEditingName('');
            return;
        }

        updateLeagueName();
    };

    const updateLeagueName = async () => {
        try {
            setUpdating(true);
            const response = await leaguesAPI.updateLeague(leagueId, editingName);

            if (response?.data?.success) {
                setLeague(prev => prev ? { ...prev, name: editingName } : null);
                showToast('League name updated successfully!', 'success');
                setShowSettings(false);
                setEditingName('');
            } else {
                showToast('Failed to update league name', 'error');
            }
        } catch (error) {
            console.error('Error updating league name:', error);
            showToast('Failed to update league name', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteLeague = async () => {
        try {
            setDeleting(true);
            const response = await leaguesAPI.deleteLeague(leagueId);

            if (response?.data?.success) {
                showToast('League deleted successfully!', 'success');
                router.replace('/leagues' as any);
            } else {
                showToast('Failed to delete league', 'error');
            }
        } catch (error) {
            console.error('Error deleting league:', error);
            showToast('Failed to delete league', 'error');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleLeaveLeague = async () => {
        try {
            setLeaving(true);
            const response = await leaguesAPI.leaveLeague(leagueId);

            if (response?.data?.success) {
                showToast('Left league successfully!', 'success');
                router.replace('/leagues' as any);
            } else {
                showToast('Failed to leave league', 'error');
            }
        } catch (error) {
            console.error('Error leaving league:', error);
            showToast('Failed to leave league', 'error');
        } finally {
            setLeaving(false);
            setShowLeaveConfirm(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.buttonPrimary} />
                    <Text style={styles.loadingText}>Loading league...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !league) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
                    <Text style={styles.errorTitle}>Error Loading League</Text>
                    <Text style={styles.errorMessage}>{error || 'League not found'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => loadLeagueData()}>
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
                            <Text style={styles.backButtonText}>Back to Leagues</Text>
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <Text style={styles.title}>{league.name}</Text>
                        </View>

                        {/* Settings Button */}
                        {league.userRole === 'Owner' && (
                            <TouchableOpacity
                                style={styles.settingsButton}
                                onPress={() => setShowSettings(!showSettings)}
                            >
                                <Ionicons name="settings-outline" size={24} color={Colors.light.buttonPrimary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Main Content - Responsive Layout */}
                    {screenSize === 'tablet' ? (
                        <View style={styles.tabletLayout}>
                            {/* Left Column - League Info & Actions */}
                            <View style={styles.tabletLeftColumn}>
                                {/* League Info */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>League Information</Text>
                                    <View style={styles.infoGrid}>
                                        <View style={styles.infoItem}>
                                            <Text style={styles.infoLabel}>Members</Text>
                                            <Text style={styles.infoValue}>{league.memberCount}</Text>
                                        </View>
                                        <View style={styles.infoItem}>
                                            <Text style={styles.infoLabel}>Season</Text>
                                            <Text style={styles.infoValue}>{league.seasonYear}</Text>
                                        </View>
                                        <View style={styles.infoItem}>
                                            <Text style={styles.infoLabel}>Your Role</Text>
                                            <Text style={styles.infoValue}>
                                                {league.userRole === 'Owner' ? 'Owner' : 'Member'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Join Code */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Join Code</Text>
                                    <TouchableOpacity
                                        style={styles.joinCodeCard}
                                        onPress={copyJoinCode}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.joinCode}>{league.joinCode}</Text>
                                        <Ionicons name="copy-outline" size={20} color={Colors.light.buttonPrimary} />
                                    </TouchableOpacity>
                                    <Text style={styles.joinCodeHint}>
                                        Tap to copy the join code
                                    </Text>
                                </View>

                                {/* Quick Actions */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={navigateToPicks}
                                        >
                                            <Ionicons name="checkmark-circle" size={24} color={Colors.light.buttonPrimary} />
                                            <Text style={styles.actionButtonText}>Make Picks</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={navigateToStandings}
                                        >
                                            <Ionicons name="trophy" size={24} color={Colors.light.buttonPrimary} />
                                            <Text style={styles.actionButtonText}>View Standings</Text>
                                        </TouchableOpacity>

                                        {currentRace && (
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={navigateToResults}
                                            >
                                                <Ionicons name="flag" size={24} color={Colors.light.buttonPrimary} />
                                                <Text style={styles.actionButtonText}>Race Results</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Right Column - Current Race & Activity */}
                            <View style={styles.tabletRightColumn}>
                                {/* Current Race */}
                                {currentRace && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Current Race</Text>
                                        <View style={styles.raceCard}>
                                            <View style={styles.raceHeader}>
                                                <Text style={styles.raceName}>{currentRace.raceName}</Text>
                                                <Text style={styles.raceWeek}>Week {currentRace.weekNumber}</Text>
                                            </View>
                                            <Text style={styles.raceStatus}>
                                                Status: {currentRace.status}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.raceButton}
                                                onPress={navigateToPicks}
                                            >
                                                <Text style={styles.raceButtonText}>Make Your Picks</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* Recent Activity */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                                    <View style={styles.activityList}>
                                        {activities.length > 0 ? (
                                            activities.map((activity, index) => (
                                                <View key={index} style={styles.activityItem}>
                                                    <View style={styles.activityIcon}>
                                                        <Ionicons
                                                            name="notifications"
                                                            size={16}
                                                            color={Colors.light.textSecondary}
                                                        />
                                                    </View>
                                                    <View style={styles.activityContent}>
                                                        <Text style={styles.activityText}>
                                                            {activity.activityType}
                                                        </Text>
                                                        <Text style={styles.activityTime}>
                                                            {new Date(activity.createdAt).toLocaleDateString()}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.noActivityText}>No recent activity</Text>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        style={styles.viewAllButton}
                                        onPress={navigateToActivity}
                                    >
                                        <Text style={styles.viewAllButtonText}>View All Activity</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Members Preview */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Members</Text>
                                    <TouchableOpacity
                                        style={styles.membersPreview}
                                        onPress={() => setShowMembers(!showMembers)}
                                    >
                                        <Text style={styles.membersCount}>
                                            {league.memberCount} member{league.memberCount !== 1 ? 's' : ''}
                                        </Text>
                                        <Ionicons
                                            name={showMembers ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={Colors.light.textSecondary}
                                        />
                                    </TouchableOpacity>

                                    {showMembers && (
                                        <View style={styles.membersList}>
                                            {loadingMembers ? (
                                                <ActivityIndicator size="small" color={Colors.light.buttonPrimary} />
                                            ) : (
                                                members.slice(0, 5).map((member, index) => (
                                                    <View key={member.id} style={styles.memberItem}>
                                                        <Text style={styles.memberName}>{member.userName}</Text>
                                                        {member.userRole === 'Owner' && (
                                                            <View style={styles.ownerBadge}>
                                                                <Ionicons name="star" size={12} color={Colors.light.warning} />
                                                                <Text style={styles.ownerText}>Owner</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                ))
                                            )}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* Mobile Layout (existing code) */
                        <>
                            {/* League Info */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>League Information</Text>
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Members</Text>
                                        <Text style={styles.infoValue}>{league.memberCount}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Season</Text>
                                        <Text style={styles.infoValue}>{league.seasonYear}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Your Role</Text>
                                        <Text style={styles.infoValue}>
                                            {league.userRole === 'Owner' ? 'Owner' : 'Member'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Join Code */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Join Code</Text>
                                <TouchableOpacity
                                    style={styles.joinCodeCard}
                                    onPress={copyJoinCode}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.joinCode}>{league.joinCode}</Text>
                                    <Ionicons name="copy-outline" size={20} color={Colors.light.buttonPrimary} />
                                </TouchableOpacity>
                                <Text style={styles.joinCodeHint}>
                                    Tap to copy the join code
                                </Text>
                            </View>

                            {/* Current Race */}
                            {currentRace && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Current Race</Text>
                                    <View style={styles.raceCard}>
                                        <View style={styles.raceHeader}>
                                            <Text style={styles.raceName}>{currentRace.raceName}</Text>
                                            <Text style={styles.raceWeek}>Week {currentRace.weekNumber}</Text>
                                        </View>
                                        <Text style={styles.raceStatus}>
                                            Status: {currentRace.status}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.raceButton}
                                            onPress={navigateToPicks}
                                        >
                                            <Text style={styles.raceButtonText}>Make Your Picks</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Quick Actions */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Quick Actions</Text>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={navigateToPicks}
                                    >
                                        <Ionicons name="checkmark-circle" size={24} color={Colors.light.buttonPrimary} />
                                        <Text style={styles.actionButtonText}>Make Picks</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={navigateToStandings}
                                    >
                                        <Ionicons name="trophy" size={24} color={Colors.light.buttonPrimary} />
                                        <Text style={styles.actionButtonText}>View Standings</Text>
                                    </TouchableOpacity>

                                    {currentRace && (
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={navigateToResults}
                                        >
                                            <Ionicons name="flag" size={24} color={Colors.light.buttonPrimary} />
                                            <Text style={styles.actionButtonText}>Race Results</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Recent Activity */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Recent Activity</Text>
                                <View style={styles.activityList}>
                                    {activities.length > 0 ? (
                                        activities.map((activity, index) => (
                                            <View key={index} style={styles.activityItem}>
                                                <View style={styles.activityIcon}>
                                                    <Ionicons
                                                        name="notifications"
                                                        size={16}
                                                        color={Colors.light.textSecondary}
                                                    />
                                                </View>
                                                <View style={styles.activityContent}>
                                                    <Text style={styles.activityText}>
                                                        {activity.activityType}
                                                    </Text>
                                                    <Text style={styles.activityTime}>
                                                        {new Date(activity.createdAt).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noActivityText}>No recent activity</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={styles.viewAllButton}
                                    onPress={navigateToActivity}
                                >
                                    <Text style={styles.viewAllButtonText}>View All Activity</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Members */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Members</Text>
                                <TouchableOpacity
                                    style={styles.membersPreview}
                                    onPress={() => setShowMembers(!showMembers)}
                                >
                                    <Text style={styles.membersCount}>
                                        {league.memberCount} member{league.memberCount !== 1 ? 's' : ''}
                                    </Text>
                                    <Ionicons
                                        name={showMembers ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={Colors.light.textSecondary}
                                    />
                                </TouchableOpacity>

                                {showMembers && (
                                    <View style={styles.membersList}>
                                        {loadingMembers ? (
                                            <ActivityIndicator size="small" color={Colors.light.buttonPrimary} />
                                        ) : (
                                            members.slice(0, 5).map((member, index) => (
                                                <View key={member.id} style={styles.memberItem}>
                                                    <Text style={styles.memberName}>{member.userName}</Text>
                                                    {member.userRole === 'Owner' && (
                                                        <View style={styles.ownerBadge}>
                                                            <Ionicons name="star" size={12} color={Colors.light.warning} />
                                                            <Text style={styles.ownerText}>Owner</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            ))
                                        )}
                                    </View>
                                )}
                            </View>
                        </>
                    )}

                    {/* Settings Modal */}
                    {showSettings && (
                        <View style={styles.settingsOverlay}>
                            <View style={styles.settingsModal}>
                                <Text style={styles.settingsTitle}>League Settings</Text>

                                {/* Edit Name */}
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>League Name</Text>
                                    <TextInput
                                        style={styles.settingInput}
                                        value={editingName}
                                        onChangeText={setEditingName}
                                        placeholder="Enter new league name"
                                        placeholderTextColor={Colors.light.textSecondary}
                                    />
                                    <TouchableOpacity
                                        style={styles.settingButton}
                                        onPress={handleEditName}
                                        disabled={updating}
                                    >
                                        <Text style={styles.settingButtonText}>
                                            {updating ? 'Updating...' : 'Update Name'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Delete League */}
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => setShowDeleteConfirm(true)}
                                >
                                    <Text style={styles.deleteButtonText}>Delete League</Text>
                                </TouchableOpacity>

                                {/* Leave League */}
                                {league.userRole !== 'Owner' && (
                                    <TouchableOpacity
                                        style={styles.leaveButton}
                                        onPress={() => setShowLeaveConfirm(true)}
                                    >
                                        <Text style={styles.leaveButtonText}>Leave League</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => {
                                        setShowSettings(false);
                                        setEditingName('');
                                    }}
                                >
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Delete Confirmation */}
                    {showDeleteConfirm && (
                        <View style={styles.settingsOverlay}>
                            <View style={styles.confirmModal}>
                                <Text style={styles.confirmTitle}>Delete League</Text>
                                <Text style={styles.confirmMessage}>
                                    Are you sure you want to delete &ldquo;{league.name}&rdquo;? This action cannot be undone.
                                </Text>
                                <View style={styles.confirmButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowDeleteConfirm(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.confirmDeleteButton}
                                        onPress={handleDeleteLeague}
                                        disabled={deleting}
                                    >
                                        <Text style={styles.confirmDeleteButtonText}>
                                            {deleting ? 'Deleting...' : 'Delete'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Leave Confirmation */}
                    {showLeaveConfirm && (
                        <View style={styles.settingsOverlay}>
                            <View style={styles.confirmModal}>
                                <Text style={styles.confirmTitle}>Leave League</Text>
                                <Text style={styles.confirmMessage}>
                                    Are you sure you want to leave &ldquo;{league.name}&rdquo;?
                                </Text>
                                <View style={styles.confirmButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowLeaveConfirm(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.confirmLeaveButton}
                                        onPress={handleLeaveLeague}
                                        disabled={leaving}
                                    >
                                        <Text style={styles.confirmLeaveButtonText}>
                                            {leaving ? 'Leaving...' : 'Leave'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
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
    errorCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.error,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    errorMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
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
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    backButtonText: {
        fontSize: 16,
        color: Colors.light.buttonPrimary,
        fontWeight: '600',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    description: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    settingsButton: {
        padding: spacing.sm,
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
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    infoItem: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    infoValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.buttonPrimary,
    },
    joinCodeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.light.backgroundPrimary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        marginBottom: spacing.sm,
    },
    joinCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        fontFamily: 'monospace',
    },
    joinCodeHint: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    actionButtons: {
        gap: spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: Colors.light.backgroundPrimary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    raceCard: {
        backgroundColor: Colors.light.backgroundPrimary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    raceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    raceName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.textPrimary,
    },
    raceWeek: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    raceStatus: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.md,
    },
    raceButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    raceButtonText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: '600',
    },
    activityList: {
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    activityIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.light.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
        color: Colors.light.textPrimary,
        marginBottom: spacing.xs,
    },
    activityTime: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    noActivityText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    viewAllButton: {
        backgroundColor: Colors.light.backgroundSecondary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    viewAllButtonText: {
        color: Colors.light.buttonPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    membersPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.light.backgroundPrimary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        marginBottom: spacing.md,
    },
    membersCount: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    membersList: {
        gap: spacing.sm,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: Colors.light.backgroundPrimary,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
    },
    ownerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    ownerText: {
        fontSize: 12,
        color: Colors.light.warning,
        fontWeight: '500',
    },
    settingsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    settingsModal: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        margin: spacing.lg,
        width: '90%',
        maxWidth: 400,
        ...shadows.lg,
    },
    settingsTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    settingItem: {
        marginBottom: spacing.lg,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    settingInput: {
        backgroundColor: Colors.light.backgroundPrimary,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        fontSize: 16,
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    settingButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    settingButtonText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: Colors.light.error,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    deleteButtonText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: '600',
    },
    leaveButton: {
        backgroundColor: Colors.light.warning,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    leaveButtonText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: '600',
    },
    closeButton: {
        backgroundColor: Colors.light.backgroundSecondary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    closeButtonText: {
        color: Colors.light.textPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    confirmModal: {
        backgroundColor: Colors.light.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        margin: spacing.lg,
        width: '90%',
        maxWidth: 400,
        ...shadows.lg,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    confirmMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.lg,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: Colors.light.backgroundSecondary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: Colors.light.textPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    confirmDeleteButton: {
        flex: 1,
        backgroundColor: Colors.light.error,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    confirmDeleteButtonText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: '600',
    },
    confirmLeaveButton: {
        flex: 1,
        backgroundColor: Colors.light.warning,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    confirmLeaveButtonText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: '600',
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

export default LeagueDetailScreen;

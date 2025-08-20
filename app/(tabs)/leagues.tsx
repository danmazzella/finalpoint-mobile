import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
    Platform,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { leaguesAPI } from '../../src/services/apiService';
import { League } from '../../src/types';
import { useAuth } from '../../src/context/AuthContext';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import { useTheme } from '../../src/context/ThemeContext';
import { router, useFocusEffect } from 'expo-router';
import { lightColors, darkColors } from '../../src/constants/Colors';
import { createThemeStyles } from '../../src/styles/universalStyles';

const LeaguesScreen = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { showToast } = useSimpleToast();
    const { resolvedTheme } = useTheme();

    // Get current theme colors from universal palette
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors
    const universalStyles = createThemeStyles(currentColors);

    // Create leagues-specific styles with current theme colors
    const styles = StyleSheet.create({
        scrollContent: {
            paddingBottom: 120, // Account for tab bar height (iOS: 88+20, Android: 70+8+insets)
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginTop: 12,
        },
        header: {
            padding: 16,
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: 4,
        },
        subtitle: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginBottom: 16,
        },
        headerButtons: {
            flexDirection: 'row',
            gap: 12,
        },
        primaryButton: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        primaryButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: '600',
        },
        secondaryButton: {
            backgroundColor: currentColors.cardBackground,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        secondaryButtonText: {
            color: currentColors.textSecondary,
            fontSize: 16,
            fontWeight: '600',
        },
        section: {
            padding: 16,
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 12,
        },
        sectionSubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginTop: 4,
        },
        sectionHeader: {
            marginBottom: 12,
        },
        leaguesGrid: {
            gap: 12,
        },
        leagueCard: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        leagueCardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        leagueName: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            flex: 1,
            marginRight: 8,
        },
        visibilityBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        visibilityText: {
            fontSize: 12,
            fontWeight: '500',
            color: currentColors.textInverse,
        },
        leagueStats: {
            gap: 8,
        },
        statRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        statLabel: {
            fontSize: 14,
            color: currentColors.textSecondary,
        },
        statValue: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textPrimary,
        },
        activityText: {
            fontSize: 12,
            color: currentColors.textSecondary,
            fontStyle: 'italic',
        },
        positionsContainer: {
            flexDirection: 'row',
            gap: 4,
        },
        positionBadge: {
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            backgroundColor: currentColors.secondary,
        },
        positionBadgePicked: {
            backgroundColor: currentColors.success,
        },
        positionBadgeUnpicked: {
            backgroundColor: currentColors.secondary,
        },
        positionText: {
            fontSize: 10,
            fontWeight: '600',
            color: currentColors.textInverse,
        },
        positionTextPicked: {
            color: currentColors.textInverse,
        },
        positionTextUnpicked: {
            color: currentColors.textInverse,
        },
        joinButton: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 12,
        },
        joinButtonText: {
            color: currentColors.textInverse,
            fontSize: 14,
            fontWeight: '500',
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: 32,
        },
        emptyStateTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginTop: 16,
            marginBottom: 8,
        },
        emptyStateSubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginBottom: 16,
        },
        emptyStateText: {
            fontSize: 14,
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginBottom: 16,
        },
        createFirstButton: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
        },
        createFirstButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: '600',
        },
        authButtons: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 16,
        },
        loginPrompt: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginBottom: 16,
            textAlign: 'center',
        },
        errorContainer: {
            backgroundColor: currentColors.errorLight,
            borderColor: currentColors.error,
            borderWidth: 1,
            borderRadius: 8,
            padding: 16,
            margin: 16,
            alignItems: 'center',
        },
        errorText: {
            color: currentColors.error,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 12,
        },
        retryButton: {
            backgroundColor: currentColors.error,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
        },
        retryButtonText: {
            color: currentColors.textInverse,
            fontSize: 14,
            fontWeight: '600',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 16,
            padding: 24,
            width: '90%',
            maxHeight: '80%',
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: 20,
            textAlign: 'center',
        },
        inputContainer: {
            marginBottom: 20,
        },
        inputLabel: {
            fontSize: 16,
            fontWeight: '500',
            color: currentColors.textPrimary,
            marginBottom: 8,
        },
        textInput: {
            borderWidth: 1,
            borderColor: currentColors.borderMedium,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            color: currentColors.textPrimary,
            backgroundColor: currentColors.cardBackground,
        },
        visibilityOptions: {
            flexDirection: 'row',
            gap: 8,
            marginBottom: 8,
        },
        visibilityOption: {
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            alignItems: 'center',
        },
        visibilityOptionSelected: {
            backgroundColor: currentColors.primary,
            borderColor: currentColors.primary,
        },
        visibilityOptionText: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textSecondary,
        },
        visibilityOptionTextSelected: {
            color: currentColors.textInverse,
        },
        visibilityHelpText: {
            fontSize: 12,
            color: currentColors.textSecondary,
            fontStyle: 'italic',
        },
        positionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 8,
        },
        positionButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            backgroundColor: currentColors.cardBackground,
            justifyContent: 'center',
            alignItems: 'center',
        },
        positionButtonSelected: {
            backgroundColor: currentColors.primary,
            borderColor: currentColors.primary,
        },
        positionButtonText: {
            fontSize: 12,
            fontWeight: '600',
            color: currentColors.textPrimary,
        },
        positionButtonTextSelected: {
            color: currentColors.textInverse,
        },
        positionsHelpText: {
            fontSize: 12,
            color: currentColors.textSecondary,
            fontStyle: 'italic',
        },
        modalActions: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 20,
        },
        cancelButton: {
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            backgroundColor: currentColors.cardBackground,
            alignItems: 'center',
        },
        cancelButtonText: {
            color: currentColors.textSecondary,
            fontSize: 14,
            fontWeight: '500',
        },
        createButton: {
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: currentColors.primary,
            alignItems: 'center',
        },
        createButtonDisabled: {
            opacity: 0.5,
        },
        createButtonText: {
            color: currentColors.textInverse,
            fontSize: 14,
            fontWeight: '500',
        },
    });

    const [myLeagues, setMyLeagues] = useState<League[]>([]);
    const [publicLeagues, setPublicLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newLeagueName, setNewLeagueName] = useState('');
    const [selectedPositions, setSelectedPositions] = useState<number[]>([10]);
    const [isPublic, setIsPublic] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Load data when auth state changes
    useEffect(() => {
        if (!authLoading) {
            loadLeagues();
        }
    }, [authLoading, user]);

    // Reload data when the tab comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (!authLoading) {
                loadLeagues();
            }
        }, [authLoading, user])
    );

    const loadLeagues = async () => {
        try {
            setLoading(true);
            setError(null);

            if (user) {
                // Authenticated user - load both their leagues and public leagues
                const [myLeaguesResponse, publicLeaguesResponse] = await Promise.all([
                    leaguesAPI.getLeagues(),
                    leaguesAPI.getPublicLeagues()
                ]);

                if (myLeaguesResponse.data.success) {
                    setMyLeagues(myLeaguesResponse.data.data);
                }

                if (publicLeaguesResponse.data.success) {
                    // Backend now returns only public leagues user is not a member of
                    setPublicLeagues(publicLeaguesResponse.data.data);
                }
            } else {
                // Unauthenticated user - load only public leagues
                const publicLeaguesResponse = await leaguesAPI.getLeagues();

                if (publicLeaguesResponse.data.success) {
                    setMyLeagues([]); // No personal leagues for unauthenticated users
                    setPublicLeagues(publicLeaguesResponse.data.data);
                }
            }
        } catch (error: any) {
            console.error('Error loading leagues:', error);
            if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                setError('Unable to connect to server. Please check your internet connection.');
            } else {
                setError('Failed to load leagues. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLeagues();
        setRefreshing(false);
    };

    const hasPickForPosition = (league: League, position: number): boolean => {
        if (!league.positionStatus || !league.positionStatus.positions) {
            return false;
        }
        const positionStatus = league.positionStatus.positions.find(p => p.position === position);
        return positionStatus ? positionStatus.hasPick : false;
    };

    const createLeague = async () => {
        if (!newLeagueName.trim()) {
            showToast('Please enter a league name', 'error');
            return;
        }

        if (selectedPositions.length === 0) {
            showToast('Please select at least one position', 'error');
            return;
        }

        try {
            const response = await leaguesAPI.createLeague(newLeagueName.trim(), selectedPositions, isPublic);
            if (response.data.success) {
                showToast('League created successfully!', 'success', 2000);
                setModalVisible(false);
                setNewLeagueName('');
                setSelectedPositions([10]);
                setIsPublic(false);
                loadLeagues();
            }
        } catch (error) {
            showToast('Failed to create league. Please try again.', 'error');
        }
    };

    const navigateToLeagueDetail = (league: League) => {
        // Navigate to league detail screen
        router.push(`/league/${league.id}` as any);
    };

    const togglePosition = (position: number) => {
        if (selectedPositions.includes(position)) {
            setSelectedPositions(selectedPositions.filter(p => p !== position));
        } else {
            // Only allow up to 2 positions
            if (selectedPositions.length < 2) {
                setSelectedPositions([...selectedPositions, position]);
            }
        }
    };

    const resetModal = () => {
        setModalVisible(false);
        setNewLeagueName('');
        setSelectedPositions([10]);
        setIsPublic(false);
    };

    const renderLeagueCard = (league: League, isPublicLeague: boolean = false) => {
        if (isPublicLeague) {
            // Public League Card - Non-clickable, limited info, join button
            return (
                <View key={league.id} style={styles.leagueCard}>
                    <View style={styles.leagueCardHeader}>
                        <Text style={styles.leagueName} numberOfLines={1}>
                            {league.name}
                        </Text>
                        <View style={[
                            styles.visibilityBadge,
                            { backgroundColor: currentColors.success }
                        ]}>
                            <Text style={styles.visibilityText}>
                                Public
                            </Text>
                        </View>
                    </View>

                    {/* Limited League Info for Public Leagues */}
                    <View style={styles.leagueStats}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Members:</Text>
                            <Text style={styles.statValue}>{league.memberCount || 1}</Text>
                        </View>

                        {/* Required Positions */}
                        {league.requiredPositions && league.requiredPositions.length > 0 && (
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Positions:</Text>
                                <View style={styles.positionsContainer}>
                                    {league.requiredPositions.map((position, index) => (
                                        <View key={position} style={styles.positionBadge}>
                                            <Text style={styles.positionText}>P{position}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Activity Level Indicator (vague) */}
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Activity Level:</Text>
                            <Text style={[
                                styles.statValue,
                                {
                                    color: (league.lastTwoRaceWeeksActivity || 0) > 15 ? currentColors.success :
                                        (league.lastTwoRaceWeeksActivity || 0) > 8 ? currentColors.warning : currentColors.textSecondary
                                }
                            ]}>
                                {(league.lastTwoRaceWeeksActivity || 0) > 15 ? 'Very Active' :
                                    (league.lastTwoRaceWeeksActivity || 0) > 8 ? 'Active' : 'Quiet'}
                            </Text>
                        </View>
                    </View>

                    {/* Join Button */}
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => {
                            if (user) {
                                router.push(`/joinleague/${league.joinCode}` as any);
                            } else {
                                router.push(`/league/${league.id}` as any);
                            }
                        }}
                    >
                        <Text style={styles.joinButtonText}>
                            {user ? 'Join League' : 'Preview League'}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        } else {
            // My League Card - Clickable, minimal info
            return (
                <TouchableOpacity
                    key={league.id}
                    style={styles.leagueCard}
                    onPress={() => navigateToLeagueDetail(league)}
                    activeOpacity={0.7}
                >
                    <View style={styles.leagueCardHeader}>
                        <Text style={styles.leagueName} numberOfLines={1}>
                            {league.name}
                        </Text>
                        <View style={[
                            styles.visibilityBadge,
                            { backgroundColor: league.isPublic ? currentColors.success : currentColors.secondary }
                        ]}>
                            <Text style={styles.visibilityText}>
                                {league.isPublic ? 'Public' : 'Private'}
                            </Text>
                        </View>
                    </View>

                    {/* Minimal League Info for My Leagues */}
                    <View style={styles.leagueStats}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Members:</Text>
                            <Text style={styles.statValue}>{league.memberCount || 1}</Text>
                        </View>

                        {/* Required Positions */}
                        {league.requiredPositions && league.requiredPositions.length > 0 && (
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Positions:</Text>
                                <View style={styles.positionsContainer}>
                                    {league.requiredPositions.map((position, index) => (
                                        <View key={position} style={[
                                            styles.positionBadge,
                                            hasPickForPosition(league, position)
                                                ? styles.positionBadgePicked
                                                : styles.positionBadgeUnpicked
                                        ]}>
                                            <Text style={[
                                                styles.positionText,
                                                hasPickForPosition(league, position)
                                                    ? styles.positionTextPicked
                                                    : styles.positionTextUnpicked
                                            ]}>
                                                P{position}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            );
        }
    };

    if (authLoading) {
        return (
            <SafeAreaView style={universalStyles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={currentColors.primary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show unauthenticated view for users who are not logged in
    if (!user) {
        return (
            <SafeAreaView style={universalStyles.container}>
                <ScrollView
                    style={universalStyles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Leagues</Text>
                        <Text style={styles.subtitle}>Manage your F1 prediction game</Text>
                        <View style={styles.headerButtons}>
                            <Text style={styles.loginPrompt}>Login to Join</Text>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => router.push('/signup')}
                            >
                                <Text style={styles.primaryButtonText}>Sign Up to Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* My Leagues Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>My Leagues</Text>
                        <View style={styles.emptyState}>
                            <Ionicons name="people" size={48} color="#9ca3af" />
                            <Text style={styles.emptyStateTitle}>Log in to see your leagues</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                Sign up or log in to create and manage your own leagues.
                            </Text>
                            <View style={styles.authButtons}>
                                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/login')}>
                                    <Text style={styles.secondaryButtonText}>Log In</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/signup')}>
                                    <Text style={styles.primaryButtonText}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Public Leagues Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Public Leagues</Text>
                            <Text style={styles.sectionSubtitle}>
                                Browse and preview public leagues
                            </Text>
                        </View>
                        {publicLeagues.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    No public leagues available to preview.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.leaguesGrid}>
                                {publicLeagues.map(league => renderLeagueCard(league, true))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={universalStyles.container}>
            <ScrollView
                style={universalStyles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Leagues</Text>
                    <Text style={styles.subtitle}>Manage your F1 prediction game</Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.push('/join-league' as any)}
                        >
                            <Text style={styles.secondaryButtonText}>Join League</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.primaryButtonText}>Create League</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* My Leagues Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Leagues</Text>
                    {myLeagues.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>
                                You haven&apos;t joined any leagues yet.
                            </Text>
                            <TouchableOpacity
                                style={styles.createFirstButton}
                                onPress={() => setModalVisible(true)}
                            >
                                <Text style={styles.createFirstButtonText}>
                                    Create Your First League
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.leaguesGrid}>
                            {myLeagues.map(league => renderLeagueCard(league, false))}
                        </View>
                    )}
                </View>

                {/* Public Leagues Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Public Leagues</Text>
                        <Text style={styles.sectionSubtitle}>
                            Browse and join public leagues • Limited preview only
                        </Text>
                    </View>
                    {publicLeagues.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>
                                No public leagues available to join.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.leaguesGrid}>
                            {publicLeagues.map(league => renderLeagueCard(league, true))}
                        </View>
                    )}
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={loadLeagues}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Create League Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New League</Text>

                        {/* League Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>League Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newLeagueName}
                                onChangeText={setNewLeagueName}
                                placeholder="Enter league name"
                                placeholderTextColor={currentColors.textSecondary}
                            />
                        </View>

                        {/* League Visibility */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>League Visibility</Text>
                            <View style={styles.visibilityOptions}>
                                <TouchableOpacity
                                    style={[
                                        styles.visibilityOption,
                                        !isPublic && styles.visibilityOptionSelected
                                    ]}
                                    onPress={() => setIsPublic(false)}
                                >
                                    <Text style={[
                                        styles.visibilityOptionText,
                                        !isPublic && styles.visibilityOptionTextSelected
                                    ]}>
                                        Private
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.visibilityOption,
                                        isPublic && styles.visibilityOptionSelected
                                    ]}
                                    onPress={() => setIsPublic(true)}
                                >
                                    <Text style={[
                                        styles.visibilityOptionText,
                                        isPublic && styles.visibilityOptionTextSelected
                                    ]}>
                                        Public
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.visibilityHelpText}>
                                {isPublic
                                    ? 'Anyone can discover and join your league'
                                    : 'Only people with the join code can join your league'
                                }
                            </Text>
                        </View>

                        {/* Position Selection */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Required Positions</Text>
                            <View style={styles.positionsGrid}>
                                {Array.from({ length: 20 }, (_, i) => i + 1).map((position) => (
                                    <TouchableOpacity
                                        key={position}
                                        style={[
                                            styles.positionButton,
                                            selectedPositions.includes(position) && styles.positionButtonSelected
                                        ]}
                                        onPress={() => togglePosition(position)}
                                    >
                                        <Text style={[
                                            styles.positionButtonText,
                                            selectedPositions.includes(position) && styles.positionButtonTextSelected
                                        ]}>
                                            P{position}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.positionsHelpText}>
                                Select 1-2 positions that league members must predict
                            </Text>
                        </View>

                        {/* Modal Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={resetModal}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.createButton,
                                    (!newLeagueName.trim() || selectedPositions.length === 0) && styles.createButtonDisabled
                                ]}
                                onPress={createLeague}
                                disabled={!newLeagueName.trim() || selectedPositions.length === 0}
                            >
                                <Text style={styles.createButtonText}>Create League</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default LeaguesScreen;
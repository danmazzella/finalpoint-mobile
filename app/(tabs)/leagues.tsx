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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { leaguesAPI } from '../../src/services/apiService';
import { League } from '../../src/types';
import { useAuth } from '../../src/context/AuthContext';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { spacing, borderRadius } from '../../utils/styles';

const LeaguesScreen = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { showToast } = useSimpleToast();
    const [myLeagues, setMyLeagues] = useState<League[]>([]);
    const [publicLeagues, setPublicLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newLeagueName, setNewLeagueName] = useState('');
    const [selectedPositions, setSelectedPositions] = useState<number[]>([10]);
    const [isPublic, setIsPublic] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only load data when auth is complete and user is authenticated
        if (!authLoading && user) {
            loadLeagues();
        }
    }, [authLoading, user]);

    const loadLeagues = async () => {
        try {
            setLoading(true);
            setError(null);
            const [myLeaguesResponse, publicLeaguesResponse] = await Promise.all([
                leaguesAPI.getLeagues(),
                leaguesAPI.getPublicLeagues()
            ]);

            if (myLeaguesResponse.data.success) {
                setMyLeagues(myLeaguesResponse.data.data);
            }

            if (publicLeaguesResponse.data.success) {
                setPublicLeagues(publicLeaguesResponse.data.data);
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
                            { backgroundColor: Colors.light.success }
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
                                    color: (league.lastTwoRaceWeeksActivity || 0) > 15 ? Colors.light.success :
                                        (league.lastTwoRaceWeeksActivity || 0) > 8 ? Colors.light.warning : Colors.light.textSecondary
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
                            router.push(`/joinleague/${league.joinCode}` as any);
                        }}
                    >
                        <Text style={styles.joinButtonText}>Join League</Text>
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
                            { backgroundColor: league.isPublic ? Colors.light.success : Colors.light.gray500 }
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
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.buttonPrimary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
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
                                placeholderTextColor={Colors.light.textSecondary}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120, // Account for tab bar height (iOS: 88+20, Android: 70+8+insets)
    },
    header: {
        padding: spacing.lg,
        backgroundColor: Colors.light.backgroundSecondary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
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
    headerButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    primaryButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        flex: 1,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        flex: 1,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: Colors.light.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        padding: spacing.lg,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.md,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginTop: spacing.xs,
    },
    sectionHeader: {
        marginBottom: spacing.md,
    },
    leaguesGrid: {
        gap: spacing.md,
    },
    leagueCard: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    leagueCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    leagueName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        flex: 1,
        marginRight: spacing.sm,
    },
    visibilityBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    visibilityText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.textInverse,
    },
    memberCount: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: spacing.sm,
    },
    joinButton: {
        backgroundColor: Colors.light.buttonSuccess,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignSelf: 'flex-start',
    },
    joinButtonText: {
        color: Colors.light.textInverse,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyStateText: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    createFirstButton: {
        backgroundColor: Colors.light.buttonPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    createFirstButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    errorContainer: {
        alignItems: 'center',
        padding: spacing.lg,
    },
    errorText: {
        fontSize: 16,
        color: Colors.light.error,
        textAlign: 'center',
        marginBottom: spacing.md,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textPrimary,
        marginBottom: spacing.sm,
    },
    textInput: {
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: Colors.light.textPrimary,
    },
    visibilityOptions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    visibilityOption: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        alignItems: 'center',
    },
    visibilityOptionSelected: {
        backgroundColor: Colors.light.buttonPrimary,
        borderColor: Colors.light.buttonPrimary,
    },
    visibilityOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    visibilityOptionTextSelected: {
        color: Colors.light.textInverse,
    },
    visibilityHelpText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontStyle: 'italic',
    },
    positionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    positionButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        backgroundColor: Colors.light.backgroundSecondary,
        minWidth: 50,
        alignItems: 'center',
    },
    positionButtonSelected: {
        backgroundColor: Colors.light.buttonPrimary,
        borderColor: Colors.light.buttonPrimary,
    },
    positionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    positionButtonTextSelected: {
        color: Colors.light.textInverse,
    },
    positionsHelpText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontStyle: 'italic',
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    createButton: {
        flex: 1,
        backgroundColor: Colors.light.buttonPrimary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: Colors.light.gray500,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textInverse,
    },
    leagueStats: {
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    statLabel: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textPrimary,
    },
    positionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    positionBadge: {
        backgroundColor: Colors.light.backgroundSecondary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    positionText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    positionTextPicked: {
        color: Colors.light.success,
    },
    positionTextUnpicked: {
        color: Colors.light.textSecondary,
    },
    positionBadgePicked: {
        backgroundColor: '#e8f5e8', // Softer green background
        borderColor: '#c3e6c3', // Softer green border
    },
    positionBadgeUnpicked: {
        backgroundColor: '#ffeaea', // Softer red background
        borderColor: '#f5c6c6', // Softer red border
    },
});

export default LeaguesScreen;

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
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newLeagueName, setNewLeagueName] = useState('');
    const [selectedPositions, setSelectedPositions] = useState<number[]>([10]);
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
            const response = await leaguesAPI.getLeagues();
            if (response.data.success) {
                setLeagues(response.data.data);
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
            const response = await leaguesAPI.createLeague(newLeagueName.trim(), selectedPositions);
            if (response.data.success) {
                showToast('League created successfully!', 'success', 2000);
                setModalVisible(false);
                setNewLeagueName('');
                setSelectedPositions([10]);
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

    const getPositionLabel = (position: number) => {
        switch (position) {
            case 1: return 'P1';
            case 2: return 'P2';
            case 3: return 'P3';
            case 4: return 'P4';
            case 5: return 'P5';
            case 6: return 'P6';
            case 7: return 'P7';
            case 8: return 'P8';
            case 9: return 'P9';
            case 10: return 'P10';
            default: return `P${position}`;
        }
    };

    if (authLoading || loading) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color="#007bff" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer} edges={['top', 'left', 'right']}>
                <Text style={styles.errorTitle}>Connection Error</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadLeagues}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Leagues</Text>
            </View>

            <View style={[styles.quickActions, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
                <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => router.push('/join-league')}
                >
                    <Text style={styles.joinButtonText}>Join League</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.createButtonText}>Create League</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {leagues.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            You haven&apos;t joined any leagues yet.
                        </Text>
                        <TouchableOpacity
                            style={styles.createFirstButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.createFirstButtonText}>Create Your First League</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.leaguesList}>
                        {leagues.map((league) => (
                            <View key={league.id} style={styles.leagueCard}>
                                <View style={styles.leagueHeader}>
                                    <View style={styles.leagueAvatar}>
                                        <Text style={styles.avatarText}>
                                            {league.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.leagueInfo}>
                                        <Text style={styles.leagueName}>{league.name}</Text>
                                        <Text style={styles.leagueDetails}>
                                            Season 2025 • {league.memberCount || 0} members
                                        </Text>
                                    </View>
                                    <View style={styles.statusTag}>
                                        <Text style={styles.statusTagText}>
                                            {league.ownerId === 1 ? 'Owner' : 'Member'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.leagueActions}>
                                    <TouchableOpacity
                                        style={styles.viewLeagueButton}
                                        onPress={() => navigateToLeagueDetail(league)}
                                    >
                                        <Text style={styles.viewLeagueButtonText}>View League</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.makePicksButton}
                                        onPress={() => router.push('/(tabs)/picks' as any)}
                                    >
                                        <Text style={styles.makePicksButtonText}>Make Picks</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New League</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewLeagueName('');
                                    setSelectedPositions([10]);
                                }}
                            >
                                <Text style={styles.modalCloseButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>
                            Create a new F1 prediction league and invite friends to join
                        </Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>League Name</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter league name"
                                value={newLeagueName}
                                onChangeText={setNewLeagueName}
                                autoFocus
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Select Positions</Text>
                            <Text style={styles.inputSubtitle}>
                                Choose up to 2 positions players will pick for this league
                            </Text>
                            <View style={styles.positionsGrid}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((position) => {
                                    const isSelected = selectedPositions.includes(position);
                                    const isDisabled = !isSelected && selectedPositions.length >= 2;

                                    return (
                                        <TouchableOpacity
                                            key={position}
                                            style={[
                                                styles.positionOption,
                                                isSelected && styles.positionOptionSelected,
                                                isDisabled && styles.positionOptionDisabled
                                            ]}
                                            onPress={() => togglePosition(position)}
                                            disabled={isDisabled}
                                        >
                                            <Text style={[
                                                styles.positionOptionText,
                                                isSelected && styles.positionOptionTextSelected,
                                                isDisabled && styles.positionOptionTextDisabled
                                            ]}>
                                                {getPositionLabel(position)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <Text style={styles.selectedCount}>
                                {selectedPositions.length} position{selectedPositions.length !== 1 ? 's' : ''} selected
                            </Text>
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewLeagueName('');
                                    setSelectedPositions([10]);
                                }}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalCreateButton}
                                onPress={createLeague}
                            >
                                <Text style={styles.modalCreateButtonText}>Create League</Text>
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
        backgroundColor: '#f5f5f5',
        paddingTop: Platform.OS === 'android' ? 0 : 0,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Add padding to the bottom to prevent content from being covered by the tab bar
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
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
        borderRadius: 8,
        padding: 12,
        paddingHorizontal: 20,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        minHeight: 64,
        backgroundColor: Colors.light.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    createButton: {
        backgroundColor: '#007bff',
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flex: 1,
    },
    createButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    joinButton: {
        backgroundColor: 'transparent',
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderWidth: 1,
        borderColor: '#007bff',
        flex: 1,
    },
    joinButtonText: {
        color: '#007bff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    createFirstButton: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 12,
        paddingHorizontal: 20,
    },
    createFirstButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    leaguesList: {
        padding: 20,
    },
    leagueCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    leagueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    leagueAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    leagueInfo: {
        flex: 1,
    },
    leagueName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    leagueDetails: {
        fontSize: 14,
        color: '#666',
    },
    statusTag: {
        backgroundColor: '#e3f2fd',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    statusTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#007bff',
    },

    memberBadge: {
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        paddingVertical: 4,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    memberBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    joinBadge: {
        backgroundColor: '#FF9800',
        borderRadius: 5,
        paddingVertical: 4,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    joinBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    leagueActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shareButton: {
        backgroundColor: '#e0e0e0',
        borderRadius: 6,
        padding: 8,
        paddingHorizontal: 12,
    },
    shareButtonText: {
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: 'white',
        borderRadius: 10,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    viewLeagueButton: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 10,
        paddingHorizontal: 15,
        flex: 1,
        marginRight: 8,
    },
    viewLeagueButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    makePicksButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 10,
        paddingHorizontal: 15,
        flex: 1,
        marginLeft: 8,
    },
    makePicksButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButtonText: {
        fontSize: 18,
        color: '#666',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 18,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputSubtitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 16,
        lineHeight: 16,
    },
    positionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    positionOption: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        minWidth: 45,
        alignItems: 'center',
    },
    positionOptionSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    positionOptionDisabled: {
        backgroundColor: '#f8f8f8',
        borderColor: '#e0e0e0',
        opacity: 0.5,
    },
    positionOptionText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    positionOptionTextSelected: {
        color: 'white',
    },
    positionOptionTextDisabled: {
        color: '#ccc',
    },
    selectedCount: {
        fontSize: 12,
        color: '#007bff',
        fontWeight: '500',
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalCreateButton: {
        flex: 1,
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 12,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCreateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    quickActions: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
    },
});

export default LeaguesScreen;

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { leaguesAPI } from '../../src/services/apiService';
import { useSimpleToast } from '../../src/context/SimpleToastContext';

const JoinLeagueByCodeScreen = () => {
    const { showToast } = useSimpleToast();
    const { code } = useLocalSearchParams<{ code: string }>();
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [leagueInfo, setLeagueInfo] = useState<any>(null);
    const [fetchingLeague, setFetchingLeague] = useState(true);

    // Fetch league info when component mounts
    useEffect(() => {
        if (code) {
            setJoinCode(code);
            fetchLeagueInfo(code);
        } else {
            setFetchingLeague(false);
        }
    }, [code]);

    const fetchLeagueInfo = async (joinCode: string) => {
        try {
            setFetchingLeague(true);
            const response = await leaguesAPI.getLeagueByCode(joinCode);
            if (response.data.success) {
                setLeagueInfo(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching league info:', error);
            // Don't show error toast here, just let user try to join
        } finally {
            setFetchingLeague(false);
        }
    };

    const joinLeague = async () => {
        if (!joinCode.trim()) {
            showToast('Please enter a join code', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await leaguesAPI.joinByCode(joinCode.trim());
            if (response.data.success) {
                showToast('Successfully joined the league!', 'success', 2000);
                // Navigate back to leagues page
                router.push('/(tabs)/leagues');
            } else {
                showToast(response.data.message || 'Failed to join league', 'error');
            }
        } catch (error: any) {
            console.error('Error joining league:', error);
            showToast('Failed to join league. Please check the join code and try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#007bff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Join League</Text>
                </View>
            </View>

            <View style={styles.content}>
                {fetchingLeague ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007bff" />
                        <Text style={styles.loadingText}>Loading league information...</Text>
                    </View>
                ) : (
                    <>
                        {/* League Information Card */}
                        <View style={styles.leagueCard}>
                            <View style={styles.leagueHeader}>
                                {/* League Avatar */}
                                <View style={styles.leagueAvatar}>
                                    <Text style={styles.leagueAvatarText}>
                                        {leagueInfo?.name?.charAt(0)?.toUpperCase() || 'L'}
                                    </Text>
                                </View>

                                <Text style={styles.leagueName}>{leagueInfo?.name || 'League'}</Text>
                                <Text style={styles.leagueSeason}>Season {leagueInfo?.seasonYear || '2025'}</Text>
                            </View>

                            {/* League Stats Grid */}
                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Join Code</Text>
                                    <Text style={styles.statValue}>{leagueInfo?.joinCode || joinCode}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Members</Text>
                                    <Text style={styles.statValue}>{leagueInfo?.memberCount || 0}</Text>
                                </View>
                            </View>

                            {/* Info Box */}
                            <View style={styles.infoBox}>
                                <View style={styles.infoBoxContent}>
                                    <View style={styles.infoIcon}>
                                        <Ionicons name="information-circle" size={20} color="#1e40af" />
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoBoxTitle}>About This League</Text>
                                        <Text style={styles.infoBoxText}>
                                            This is an F1 prediction game. Members make weekly predictions on which driver will finish in specific positions.
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Join Button or Status */}
                            <TouchableOpacity
                                style={[styles.joinButton, loading && styles.joinButtonDisabled]}
                                onPress={joinLeague}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.joinButtonText}>Join League</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* How It Works Section */}
                        <View style={styles.howItWorksCard}>
                            <Text style={styles.howItWorksTitle}>How It Works</Text>
                            <View style={styles.howItWorksList}>
                                <Text style={styles.howItWorksItem}>• Each week, predict which F1 driver will finish in 10th place</Text>
                                <Text style={styles.howItWorksItem}>• Earn points for correct predictions</Text>
                                <Text style={styles.howItWorksItem}>• Compete with other league members</Text>
                                <Text style={styles.howItWorksItem}>• View standings and track your performance</Text>
                            </View>
                        </View>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        minHeight: 64,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    leagueCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    leagueHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    leagueAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    leagueAvatarText: {
        color: '#1e40af',
        fontSize: 28,
        fontWeight: 'bold',
    },
    leagueName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    leagueSeason: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 8,
        textAlign: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
    },
    infoBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    infoBoxContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoBoxTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e40af',
        marginBottom: 4,
    },
    infoBoxText: {
        fontSize: 14,
        color: '#1d4ed8',
        lineHeight: 20,
    },
    joinButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    joinButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    joinButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    howItWorksCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    howItWorksTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'left',
    },
    howItWorksList: {
        marginTop: 0,
    },
    howItWorksItem: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        lineHeight: 20,
    },
});

export default JoinLeagueByCodeScreen;

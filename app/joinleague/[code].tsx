import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { leaguesAPI } from '../../src/services/apiService';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import { useTheme } from '../../src/context/ThemeContext';
import { lightColors, darkColors } from '../../src/constants/Colors';
import GlassBackground from '../../src/components/GlassBackground';
import { shadows, spacing, borderRadius } from '../../utils/styles';

const JoinLeagueByCodeScreen = () => {
    const { showToast } = useSimpleToast();
    const { resolvedTheme } = useTheme();
    const { code } = useLocalSearchParams<{ code: string }>();
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [leagueInfo, setLeagueInfo] = useState<any>(null);
    const [fetchingLeague, setFetchingLeague] = useState(true);

    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

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

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.lg,
            minHeight: 64,
            backgroundColor: currentColors.glassBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.glassBorder,
        },
        backButton: {
            padding: spacing.sm,
            marginRight: spacing.md,
        },
        headerContent: {
            flex: 1,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: 4,
        },
        content: {
            flex: 1,
            padding: spacing.lg,
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
        leagueCard: {
            backgroundColor: currentColors.glassBackground,
            borderWidth: 1,
            borderColor: currentColors.glassBorder,
            borderRadius: 16,
            padding: 24,
            ...shadows.glass,
        },
        leagueHeader: {
            alignItems: 'center',
            marginBottom: 24,
        },
        leagueAvatar: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: currentColors.primary + '30',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        leagueAvatarText: {
            color: currentColors.primary,
            fontSize: 28,
            fontWeight: 'bold',
        },
        leagueName: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: spacing.sm,
            textAlign: 'center',
        },
        leagueSeason: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
        },
        statsGrid: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: 24,
            paddingHorizontal: spacing.lg,
        },
        statItem: {
            alignItems: 'center',
            flex: 1,
        },
        statLabel: {
            fontSize: 14,
            fontWeight: '500',
            color: currentColors.textSecondary,
            marginBottom: spacing.sm,
            textAlign: 'center',
        },
        statValue: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            textAlign: 'center',
        },
        infoBox: {
            backgroundColor: currentColors.glassBackground,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: currentColors.glassBorder,
        },
        infoBoxContent: {
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        infoIcon: {
            marginRight: spacing.md,
            marginTop: 2,
        },
        infoTextContainer: {
            flex: 1,
        },
        infoBoxTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 4,
        },
        infoBoxText: {
            fontSize: 14,
            color: currentColors.textSecondary,
            lineHeight: 20,
        },
        joinButton: {
            backgroundColor: currentColors.primary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            alignItems: 'center',
            marginBottom: 24,
        },
        joinButtonDisabled: {
            opacity: 0.5,
        },
        joinButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: '600',
        },
        howItWorksCard: {
            backgroundColor: currentColors.glassBackground,
            borderWidth: 1,
            borderColor: currentColors.glassBorder,
            borderRadius: 16,
            padding: 24,
            marginTop: spacing.md,
            ...shadows.glass,
        },
        howItWorksTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: spacing.md,
            textAlign: 'left',
        },
        howItWorksList: {
            marginTop: 0,
        },
        howItWorksItem: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: spacing.sm,
            lineHeight: 20,
        },
    });

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
                    <Text style={styles.title}>Join League</Text>
                </View>
            </View>

            <View style={styles.content}>
                {fetchingLeague ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={currentColors.primary} />
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
                                        <Ionicons name="information-circle" size={20} color={currentColors.primary} />
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoBoxTitle}>About This League</Text>
                                        <Text style={styles.infoBoxText}>
                                            This is an F1 prediction game. Members make weekly predictions on which driver will finish in specific positions.
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Join Button */}
                            <TouchableOpacity
                                style={[styles.joinButton, loading && styles.joinButtonDisabled]}
                                onPress={joinLeague}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color={currentColors.textInverse} />
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
        </GlassBackground>
    );
};

export default JoinLeagueByCodeScreen;

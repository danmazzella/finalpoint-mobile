import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { leaguesAPI } from '../../../src/services/apiService';
import { League, LeagueStanding, LeagueStats } from '../../../src/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { lightColors, darkColors } from '../../../src/constants/Colors';
import { createThemeStyles } from '../../../src/styles/universalStyles';
import Avatar from '../../../src/components/Avatar';

const LeagueStandingsScreen = () => {
    const { id } = useLocalSearchParams();
    const leagueId = Number(id);
    const { user } = useAuth();
    const { resolvedTheme } = useTheme();
    const insets = useSafeAreaInsets();

    // Get current theme colors from universal palette
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors
    const universalStyles = createThemeStyles(currentColors);

    const [league, setLeague] = useState<League | null>(null);
    const [standings, setStandings] = useState<LeagueStanding[]>([]);
    const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (leagueId && !isNaN(leagueId)) {
            loadStandingsData();
        }
    }, [leagueId]);

    const loadStandingsData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load detailed league standings (now includes correct picks by position)
            const standingsResponse = await leaguesAPI.getDetailedLeagueStandings(leagueId);
            if (standingsResponse?.data?.success) {
                setStandings(standingsResponse.data.data);
            } else {
                console.error('Standings response not successful:', standingsResponse);
                setError('Failed to load standings data. Please try again.');
                return;
            }

            // Load league data
            const leagueResponse = await leaguesAPI.getLeague(leagueId);
            if (leagueResponse?.data?.success) {
                setLeague(leagueResponse.data.data);
            } else {
                console.error('League response not successful:', leagueResponse);
                setError('Failed to load league data. Please try again.');
                return;
            }

            // Load league stats
            const statsResponse = await leaguesAPI.getLeagueStats(leagueId);
            if (statsResponse?.data?.success) {
                setLeagueStats(statsResponse.data.data);
            } else {
                console.error('Stats response not successful:', statsResponse);
            }
        } catch (error: any) {
            console.error('Error loading standings data:', error);
            setError('Failed to load standings data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        loadStandingsData();
    };

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 80) return currentColors.success;      // Green
        if (accuracy >= 60) return currentColors.warning;      // Yellow
        if (accuracy >= 40) return '#FF8C00';                  // Orange
        return currentColors.error;                            // Red
    };

    const getDistanceColor = (distance: number | null | undefined) => {
        if (distance === null || distance === undefined || isNaN(distance)) return currentColors.textSecondary;
        if (distance <= 2) return currentColors.success;       // Green for close
        if (distance <= 5) return currentColors.warning;       // Yellow for moderate
        return currentColors.error;                            // Red for far
    };

    const renderCorrectPicksByPosition = (standing: LeagueStanding) => {
        const userPicks = standing.correctPicksByPosition;
        if (!userPicks || !userPicks.positions) return null;

        const positions = Object.keys(userPicks.positions)
            .map(Number)
            .sort((a, b) => a - b);

        if (positions.length === 0) return null;

        return (
            <View style={styles.correctPicksContainer}>
                <Text style={styles.correctPicksTitle}>Correct Picks by Position</Text>
                <View style={styles.correctPicksGrid}>
                    {positions.map(position => {
                        const positionData = userPicks.positions[position];
                        const accuracy = positionData.totalPicks > 0
                            ? Math.round((positionData.correctPicks / positionData.totalPicks) * 100)
                            : 0;

                        return (
                            <View key={position} style={styles.correctPickBadge}>
                                <Text style={styles.correctPickPosition}>P{position}:</Text>
                                <Text style={styles.correctPickCount}>{positionData.correctPicks}/{positionData.totalPicks}</Text>
                                <Text style={[styles.correctPickAccuracy, { color: getAccuracyColor(accuracy) }]}>({accuracy}%)</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    // Create styles with current theme colors
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentColors.backgroundPrimary,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 100,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
            marginBottom: 16,
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
            color: currentColors.textPrimary,
            marginBottom: 4,
        },
        subtitle: {
            fontSize: 16,
            color: currentColors.textSecondary,
        },
        summarySection: {
            marginBottom: 24,
            paddingHorizontal: 24,
        },
        summaryGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 12,
        },
        summaryCard: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 12,
            padding: 12,
            width: '48%',
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: currentColors.textPrimary,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: resolvedTheme === 'dark' ? 0.3 : 0.05,
            shadowRadius: 3,
            elevation: 2,
        },
        summaryIcon: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: currentColors.backgroundSecondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        summaryTextContainer: {
            flex: 1,
            justifyContent: 'center',
        },
        summaryLabel: {
            fontSize: 11,
            fontWeight: '600',
            color: currentColors.textSecondary,
            marginBottom: 2,
            letterSpacing: 0.5,
        },
        summaryValue: {
            fontSize: 20,
            fontWeight: '700',
            color: currentColors.textPrimary,
        },
        standingsSection: {
            paddingHorizontal: 16,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 16,
        },
        standingCard: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            shadowColor: currentColors.textPrimary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: resolvedTheme === 'dark' ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        standingHeader: {
            marginBottom: 16,
        },
        userInfo: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        avatarContainer: {
            position: 'relative',
            marginRight: 12,
        },
        rankBadge: {
            position: 'absolute',
            top: -4,
            right: -4,
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        rankBadgeFirst: {
            backgroundColor: currentColors.warning,
        },
        rankBadgeOther: {
            backgroundColor: currentColors.textTertiary,
        },
        rankText: {
            color: currentColors.textInverse,
            fontSize: 12,
            fontWeight: 'bold',
        },
        userDetails: {
            flex: 1,
        },
        userName: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            marginBottom: 4,
        },
        userSubtitle: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginBottom: 4,
        },
        ownerBadge: {
            backgroundColor: currentColors.secondary,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            alignSelf: 'flex-start',
        },
        ownerBadgeText: {
            color: currentColors.textInverse,
            fontSize: 10,
            fontWeight: '600',
            textTransform: 'uppercase',
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
        },
        statCard: {
            width: '48%', // 2 columns for first row
            marginBottom: 12,
            alignItems: 'center',
        },
        statCardSecondary: {
            width: '31%', // 3 columns for second row
            marginBottom: 12,
            alignItems: 'center',
        },
        statLabel: {
            fontSize: 10,
            fontWeight: '600',
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginBottom: 4,
            textTransform: 'uppercase',
        },
        statValue: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            textAlign: 'center',
            marginBottom: 2,
        },
        statSubtext: {
            fontSize: 10,
            color: currentColors.textSecondary,
            textAlign: 'center',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: currentColors.backgroundPrimary,
        },
        loadingText: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginTop: 12,
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            backgroundColor: currentColors.backgroundPrimary,
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
            borderRadius: 6,
            padding: 12,
            paddingHorizontal: 20,
            shadowColor: currentColors.textPrimary,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: resolvedTheme === 'dark' ? 0.3 : 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        retryButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: '600',
        },
        errorText: {
            fontSize: 18,
            color: currentColors.textPrimary,
            textAlign: 'center',
            marginTop: 50,
        },
        emptyContainer: {
            alignItems: 'center',
            paddingVertical: 32,
        },
        emptyText: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            fontStyle: 'italic',
        },
        correctPicksContainer: {
            marginTop: 12,
            padding: 12,
            backgroundColor: currentColors.backgroundSecondary,
            borderRadius: 8,
        },
        correctPicksTitle: {
            fontSize: 10,
            fontWeight: '600',
            color: currentColors.textSecondary,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            textAlign: 'center',
        },
        correctPicksGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            justifyContent: 'center',
        },
        correctPickBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: currentColors.cardBackground,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        correctPickPosition: {
            fontSize: 10,
            fontWeight: '600',
            color: currentColors.textPrimary,
        },
        correctPickCount: {
            fontSize: 10,
            color: currentColors.textPrimary,
            marginLeft: 4,
        },
        correctPickAccuracy: {
            fontSize: 9,
            color: currentColors.textSecondary,
            marginLeft: 4,
        },
    });

    if (!leagueId || isNaN(leagueId)) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Invalid League</Text>
                    <Text style={styles.errorMessage}>The league ID is invalid. Please try again.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={currentColors.primary} />
                    <Text style={styles.loadingText}>Loading standings...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="cloud-offline" size={48} color={currentColors.error} />
                    <Text style={styles.errorTitle}>Connection Error</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!league) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>League not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={currentColors.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{league.name} - Standings</Text>
                        <Text style={styles.subtitle}>
                            {league.memberCount || 1} member{league.memberCount !== 1 ? 's' : ''} • Season {league.seasonYear}
                        </Text>
                    </View>
                </View>

                {/* Summary Statistics (2x2 Grid): */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryGrid}>
                        {/* Total Points */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="trending-up" size={24} color={currentColors.primary} />
                            </View>
                            <View style={styles.summaryTextContainer}>
                                <Text style={styles.summaryLabel}>TOTAL POINTS</Text>
                                <Text style={styles.summaryValue}>
                                    {standings.reduce((sum, s) => sum + (s.totalPoints || 0), 0)}
                                </Text>
                            </View>
                        </View>

                        {/* Perfect Picks */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="checkmark-circle" size={24} color={currentColors.success} />
                            </View>
                            <View style={styles.summaryTextContainer}>
                                <Text style={styles.summaryLabel}>PERFECT PICKS</Text>
                                <Text style={styles.summaryValue}>
                                    {standings.reduce((sum, s) => sum + (s.correctPicks || 0), 0)}
                                </Text>
                            </View>
                        </View>

                        {/* Points Accuracy */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="time" size={24} color={currentColors.primary} />
                            </View>
                            <View style={styles.summaryTextContainer}>
                                <Text style={styles.summaryLabel}>POINTS ACCURACY</Text>
                                <Text style={styles.summaryValue}>
                                    {(() => {
                                        const activeUsers = standings.filter(s => s.totalPicks > 0);
                                        if (activeUsers.length === 0) return '0.0';
                                        const totalPicks = activeUsers.reduce((sum, s) => sum + (s.totalPicks || 0), 0);
                                        const totalPoints = activeUsers.reduce((sum, s) => sum + (s.totalPoints || 0), 0);
                                        const maxPotentialPoints = totalPicks * 10;
                                        return maxPotentialPoints > 0 ? Math.round((totalPoints / maxPotentialPoints) * 100) : 0;
                                    })()}%
                                </Text>
                            </View>
                        </View>

                        {/* Active Members */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="people" size={24} color={currentColors.secondary} />
                            </View>
                            <View style={styles.summaryTextContainer}>
                                <Text style={styles.summaryLabel}>ACTIVE MEMBERS</Text>
                                <Text style={styles.summaryValue}>
                                    {standings.filter(s => s.totalPicks > 0).length}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* User Standings */}
                <View style={styles.standingsSection}>
                    <Text style={styles.sectionTitle}>User Standings</Text>
                    {standings.length > 0 ? (
                        standings.map((standing, index) => {
                            return (
                                <View key={standing.id} style={styles.standingCard}>
                                    {/* Header */}
                                    <View style={styles.standingHeader}>
                                        <View style={styles.userInfo}>
                                            <View style={styles.avatarContainer}>
                                                <Avatar
                                                    src={standing.avatar}
                                                    size="sm"
                                                    fallback={standing.name?.charAt(0).toUpperCase() || 'U'}
                                                />
                                                <View style={[
                                                    styles.rankBadge,
                                                    index === 0 ? styles.rankBadgeFirst : styles.rankBadgeOther
                                                ]}>
                                                    <Text style={styles.rankText}>{index + 1}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.userDetails}>
                                                <Text style={styles.userName}>{standing.name}</Text>
                                                <Text style={styles.userSubtitle}>
                                                    {standing.totalPicks} picks • {standing.correctPicks} correct
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Primary Stats - Row 1 (2 columns) */}
                                    <View style={styles.statsGrid}>
                                        {/* Points */}
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>POINTS</Text>
                                            <Text style={styles.statValue}>{standing.totalPoints || 0}</Text>
                                            <Text style={styles.statSubtext}>
                                                {(() => {
                                                    const races = Math.ceil((standing.totalPicks || 0) / 2);
                                                    if (races === 0) return '0.00 avg/race';
                                                    return `${((standing.totalPoints || 0) / races).toFixed(2)} avg/race`;
                                                })()}
                                            </Text>
                                        </View>

                                        {/* Perfect Picks */}
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>PERFECT PICKS</Text>
                                            <Text style={[
                                                styles.statValue,
                                                { color: getAccuracyColor(standing.accuracy || 0) }
                                            ]}>
                                                {(standing.accuracy || 0).toFixed(1)}%
                                            </Text>
                                            <Text style={styles.statSubtext}>
                                                {standing.correctPicks || 0} out of {standing.totalPicks || 0} picks
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Secondary Stats - Row 2 (3 columns) */}
                                    <View style={[styles.statsGrid, { marginTop: 12 }]}>
                                        {/* Points Accuracy */}
                                        <View style={styles.statCardSecondary}>
                                            <Text style={styles.statLabel}>POINTS ACCURACY</Text>
                                            <Text style={[
                                                styles.statValue,
                                                { color: getAccuracyColor(standing.newAccuracy || 0) }
                                            ]}>
                                                {standing.newAccuracy || 0}%
                                            </Text>
                                            <Text style={styles.statSubtext}>points-based</Text>
                                        </View>

                                        {/* Average Distance */}
                                        <View style={styles.statCardSecondary}>
                                            <Text style={styles.statLabel}>AVG DISTANCE</Text>
                                            <Text style={[
                                                styles.statValue,
                                                { color: getDistanceColor(standing.avgDistance) }
                                            ]}>
                                                {standing.avgDistance || 0} positions
                                            </Text>
                                            <Text style={styles.statSubtext}>from target</Text>
                                        </View>

                                        {/* Races */}
                                        <View style={styles.statCardSecondary}>
                                            <Text style={styles.statLabel}>RACES</Text>
                                            <Text style={styles.statValue}>
                                                {standing.racesParticipated || Math.ceil((standing.totalPicks || 0) / 2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Correct Picks by Position */}
                                    {renderCorrectPicksByPosition(standing)}
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No standings data available</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default LeagueStandingsScreen;

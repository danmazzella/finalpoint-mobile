import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { platformStandingsAPI, seasonsAPI } from '../src/services/apiService';
import { lightColors, darkColors } from '../src/constants/Colors';

interface Threshold {
    label: string;
    percentile: number;
    accuracy: number;
}

interface UserLeague {
    leagueId: number;
    leagueName: string;
    totalPoints: number;
    accuracy: number;
    platformRank: number;
    platformPercentile: number | null;
}

interface PlatformStandings {
    seasonYear: number;
    totalPlayers: number;
    thresholds: Threshold[];
    userRank: number | null;
    userPercentile: number | null;
    userTotalPoints: number | null;
    userLeagues: UserLeague[];
}

const PlatformStandingsScreen = () => {
    const { resolvedTheme } = useTheme();
    const { user } = useAuth();
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentColors.backgroundPrimary,
        },
        scrollView: { flex: 1 },
        scrollContent: { paddingBottom: 100 },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
        },
        backButton: { padding: 8, marginRight: 8 },
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: currentColors.textPrimary,
            flex: 1,
        },
        seasonRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            paddingHorizontal: 12,
            paddingTop: 12,
            paddingBottom: 4,
        },
        seasonChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            backgroundColor: currentColors.backgroundSecondary,
        },
        seasonChipActive: {
            borderColor: currentColors.primary,
            backgroundColor: currentColors.primary,
        },
        seasonChipText: {
            fontSize: 13,
            fontWeight: '500',
            color: currentColors.textSecondary,
        },
        seasonChipTextActive: {
            color: currentColors.textInverse,
        },
        userCard: {
            margin: 12,
            borderRadius: 12,
            backgroundColor: currentColors.primary,
            padding: 16,
        },
        userCardLabel: {
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 6,
        },
        leagueRow: {
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginTop: 6,
        },
        leagueRowTop: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
        },
        leagueName: {
            fontSize: 13,
            color: 'rgba(255,255,255,0.85)',
            flex: 1,
        },
        leaguePoints: {
            fontSize: 13,
            fontWeight: '700',
            color: '#fff',
            marginLeft: 8,
        },
        leagueRankRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        leagueRank: {
            fontSize: 15,
            fontWeight: '800',
            color: '#fff',
        },
        leaguePercentile: {
            fontSize: 12,
            color: 'rgba(255,255,255,0.65)',
        },
        card: {
            backgroundColor: currentColors.cardBackground,
            marginHorizontal: 12,
            marginTop: 12,
            borderRadius: 12,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
        },
        cardHeader: {
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
            backgroundColor: currentColors.backgroundSecondary,
        },
        cardHeaderTitle: {
            fontSize: 11,
            fontWeight: '700',
            color: currentColors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        cardHeaderSub: {
            fontSize: 11,
            color: currentColors.textTertiary,
            marginTop: 2,
        },
        thresholdRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
            gap: 10,
        },
        thresholdLabel: {
            width: 72,
            fontSize: 13,
            fontWeight: '600',
            color: currentColors.textPrimary,
        },
        thresholdLabelFirst: {
            color: '#d97706',
        },
        barTrack: {
            flex: 1,
            height: 10,
            backgroundColor: currentColors.borderLight,
            borderRadius: 5,
            overflow: 'hidden',
        },
        barFill: {
            height: 10,
            borderRadius: 5,
            backgroundColor: currentColors.primary,
        },
        barFillFirst: {
            backgroundColor: '#f59e0b',
        },
        thresholdPoints: {
            width: 52,
            textAlign: 'right',
            fontSize: 13,
            fontWeight: '700',
            color: currentColors.textPrimary,
        },
        thresholdPointsFirst: {
            color: '#d97706',
        },
        centered: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60,
        },
        emptyText: {
            fontSize: 15,
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginTop: 12,
        },
    });

    const [standings, setStandings] = useState<PlatformStandings | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [seasons, setSeasons] = useState<{ year: number; displayLabel: string }[]>([]);
    const [seasonFilter, setSeasonFilter] = useState<number | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await seasonsAPI.getSeasons();
                if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    setSeasons(res.data.data);
                    const latest = Math.max(...res.data.data.map((s: { year: number }) => s.year));
                    setSeasonFilter(latest);
                }
            } catch { /* ignore */ }
        };
        load();
    }, []);

    const loadStandings = useCallback(async () => {
        if (seasonFilter == null) return;
        try {
            setLoading(true);
            const res = await platformStandingsAPI.getStandings(seasonFilter);
            if (res.data?.success) {
                setStandings(res.data.data);
            }
        } catch {
            setStandings(null);
        } finally {
            setLoading(false);
        }
    }, [seasonFilter]);

    useEffect(() => { loadStandings(); }, [loadStandings]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStandings();
        setRefreshing(false);
    };

    const maxAccuracy = standings?.thresholds[0]?.accuracy ?? 100;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Platform Standings</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Season chips — only shown when multiple seasons exist */}
                {seasons.length > 1 && seasonFilter != null && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.seasonRow}>
                            {seasons.map(s => (
                                <TouchableOpacity
                                    key={s.year}
                                    style={[styles.seasonChip, seasonFilter === s.year && styles.seasonChipActive]}
                                    onPress={() => setSeasonFilter(s.year)}
                                >
                                    <Text style={[styles.seasonChipText, seasonFilter === s.year && styles.seasonChipTextActive]}>
                                        {s.displayLabel || s.year}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                )}

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={currentColors.primary} />
                    </View>
                ) : !standings || standings.totalPlayers === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="trophy-outline" size={48} color={currentColors.textTertiary} />
                        <Text style={styles.emptyText}>No standings data available yet.</Text>
                    </View>
                ) : (
                    <>
                        {/* User standing card — shown whenever user has leagues */}
                        {user && standings.userLeagues.length > 0 && (
                            <View style={styles.userCard}>
                                <Text style={styles.userCardLabel}>Your Standing</Text>
                                {standings.userLeagues.map(league => (
                                    <View key={league.leagueId} style={styles.leagueRow}>
                                        <View style={styles.leagueRowTop}>
                                            <Text style={styles.leagueName} numberOfLines={1}>{league.leagueName}</Text>
                                            <Text style={styles.leaguePoints}>{league.accuracy}% accuracy</Text>
                                        </View>
                                        <View style={styles.leagueRankRow}>
                                            <Text style={styles.leagueRank}>#{league.platformRank}</Text>
                                            {league.platformPercentile != null && (
                                                <Text style={styles.leaguePercentile}>overall · top {league.platformPercentile}%</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Points thresholds card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardHeaderTitle}>Accuracy Thresholds</Text>
                                <Text style={styles.cardHeaderSub}>% of available points earned — fair regardless of picks per race</Text>
                            </View>

                            {standings.thresholds.map((threshold, idx) => {
                                const isFirst = idx === 0;
                                const barWidth = maxAccuracy > 0 ? Math.max((threshold.accuracy / maxAccuracy) * 100, 2) : 2;
                                return (
                                    <View key={threshold.label} style={styles.thresholdRow}>
                                        <Text style={[styles.thresholdLabel, isFirst && styles.thresholdLabelFirst]}>
                                            {threshold.label}
                                        </Text>
                                        <View style={styles.barTrack}>
                                            <View
                                                style={[
                                                    styles.barFill,
                                                    isFirst && styles.barFillFirst,
                                                    { width: `${barWidth}%` }
                                                ]}
                                            />
                                        </View>
                                        <Text style={[styles.thresholdPoints, isFirst && styles.thresholdPointsFirst]}>
                                            {threshold.accuracy}%
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default PlatformStandingsScreen;

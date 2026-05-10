import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { adminAPI, seasonsAPI } from '../src/services/apiService';
import { AdminStats } from '../src/types';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import GlassBackground from '../src/components/GlassBackground';
import { shadows } from '../utils/styles';

const AdminScreen = () => {
    const { resolvedTheme } = useTheme();
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [seasons, setSeasons] = useState<{ year: number; displayLabel: string }[]>([]);
    const [adminSeason, setAdminSeason] = useState<number | null>(null);

    useEffect(() => {
        const loadSeasons = async () => {
            try {
                const res = await seasonsAPI.getSeasons();
                if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    setSeasons(res.data.data);
                    setAdminSeason(res.data.data[0].year);
                }
            } catch {
                // ignore
            }
        };
        loadSeasons();
    }, []);

    useEffect(() => {
        if (adminSeason != null) {
            loadAdminData();
        }
    }, [adminSeason]);

    const loadAdminData = async (isRefresh = false) => {
        if (adminSeason == null) return;
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await adminAPI.getDashboardStats(adminSeason);

            if (response.data.success) {
                setStats(response.data.data);
            } else {
                setError('Failed to load admin data');
            }
        } catch (error: any) {
            console.error('Error loading admin data:', error);
            if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                setError('Unable to connect to server. Please check your internet connection.');
            } else {
                setError('Failed to load admin data. Please try again.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        loadAdminData(true);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            marginTop: 16,
            fontSize: 16,
            color: currentColors.textSecondary,
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
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
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 8,
        },
        retryButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: '600',
        },
        header: {
            backgroundColor: currentColors.glassBackground,
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.glassBorder,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: 4,
        },
        headerSubtitle: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginBottom: 12,
        },
        seasonRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        seasonChip: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            alignItems: 'center',
        },
        seasonChipActive: {
            backgroundColor: currentColors.primary,
        },
        seasonChipInactive: {
            backgroundColor: currentColors.inputBackground,
            borderWidth: 1,
            borderColor: currentColors.glassBorder,
        },
        seasonChipText: {
            fontSize: 14,
            fontWeight: '600',
        },
        seasonChipTextActive: {
            color: currentColors.textInverse,
        },
        seasonChipTextInactive: {
            color: currentColors.textSecondary,
        },
        section: {
            backgroundColor: currentColors.glassBackground,
            margin: 10,
            padding: 20,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: currentColors.glassBorder,
            ...shadows.glass,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: 16,
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
        },
        statCard: {
            backgroundColor: currentColors.inputBackground,
            borderRadius: 8,
            padding: 15,
            alignItems: 'center',
            width: '48%',
            marginBottom: 10,
        },
        statNumber: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.primary,
            marginBottom: 4,
        },
        statLabel: {
            fontSize: 12,
            color: currentColors.textSecondary,
            textAlign: 'center',
        },
        actionButtons: {
            gap: 10,
        },
        actionButton: {
            backgroundColor: currentColors.primary,
            padding: 15,
            borderRadius: 8,
            alignItems: 'center',
        },
        actionButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: 'bold',
        },
    });

    if (adminSeason == null && seasons.length === 0) {
        return (
            <GlassBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={currentColors.primary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </GlassBackground>
        );
    }

    if (loading && !stats) {
        return (
            <GlassBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={currentColors.primary} />
                    <Text style={styles.loadingText}>Loading admin data...</Text>
                </View>
            </GlassBackground>
        );
    }

    if (error) {
        return (
            <GlassBackground>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Connection Error</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => loadAdminData()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </GlassBackground>
        );
    }

    if (!stats) {
        return (
            <GlassBackground>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>No Admin Data Available</Text>
                    <Text style={styles.errorMessage}>Unable to load admin statistics.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => loadAdminData()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </GlassBackground>
        );
    }

    return (
        <GlassBackground>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[currentColors.primary]}
                        tintColor={currentColors.primary}
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                    <Text style={styles.headerSubtitle}>Platform statistics and management</Text>
                    {seasons.length > 0 && (
                        <View style={styles.seasonRow}>
                            {seasons.map((s) => (
                                <TouchableOpacity
                                    key={s.year}
                                    style={[
                                        styles.seasonChip,
                                        adminSeason === s.year ? styles.seasonChipActive : styles.seasonChipInactive,
                                    ]}
                                    onPress={() => setAdminSeason(s.year)}
                                >
                                    <Text style={[
                                        styles.seasonChipText,
                                        adminSeason === s.year ? styles.seasonChipTextActive : styles.seasonChipTextInactive,
                                    ]}>
                                        {s.displayLabel || String(s.year)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Users</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.users.totalUsers}</Text>
                            <Text style={styles.statLabel}>Total Users</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.users.adminUsers}</Text>
                            <Text style={styles.statLabel}>Admin Users</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.users.regularUsers}</Text>
                            <Text style={styles.statLabel}>Regular Users</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Leagues</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.leagues.totalLeagues}</Text>
                            <Text style={styles.statLabel}>Total Leagues</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.leagues.activeLeagues}</Text>
                            <Text style={styles.statLabel}>Active Leagues</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.leagues.averageMembersPerLeague.toFixed(1)}</Text>
                            <Text style={styles.statLabel}>Avg Members</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Picks & Performance</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.picks.totalPicks}</Text>
                            <Text style={styles.statLabel}>Total Picks</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.picks.correctPicks}</Text>
                            <Text style={styles.statLabel}>Correct Picks</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.picks.accuracy}%</Text>
                            <Text style={styles.statLabel}>Accuracy</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.picks.averagePoints}</Text>
                            <Text style={styles.statLabel}>Avg Points</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Admin Actions</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/admin/users' as any)}
                        >
                            <Text style={styles.actionButtonText}>Manage Users</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/admin/leagues' as any)}
                        >
                            <Text style={styles.actionButtonText}>Manage Leagues</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/admin/pick-stats' as any)}
                        >
                            <Text style={styles.actionButtonText}>View Pick Stats</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </GlassBackground>
    );
};

export default AdminScreen;

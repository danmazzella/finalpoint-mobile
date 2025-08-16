import React, { useState, useEffect } from 'react';
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
import { adminAPI } from '../src/services/apiService';
import { AdminStats } from '../src/types';
import { router } from 'expo-router';
import Colors from '../constants/Colors';

const AdminScreen = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await adminAPI.getDashboardStats();

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e91e63" />
                <Text style={styles.loadingText}>Loading admin data...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Connection Error</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => loadAdminData()}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!stats) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>No Admin Data Available</Text>
                <Text style={styles.errorMessage}>Unable to load admin statistics.</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => loadAdminData()}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#e91e63']}
                    tintColor="#e91e63"
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <Text style={styles.headerSubtitle}>Platform statistics and management</Text>
            </View>

            {/* Users Stats */}
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

            {/* Leagues Stats */}
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

            {/* Picks Stats */}
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

            {/* Admin Actions */}
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
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.backgroundPrimary,
        padding: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.error,
        marginBottom: 10,
    },
    errorMessage: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: Colors.light.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        backgroundColor: Colors.light.cardBackground,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    section: {
        backgroundColor: Colors.light.cardBackground,
        margin: 10,
        padding: 20,
        borderRadius: 12,
        shadowColor: Colors.light.cardShadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: Colors.light.backgroundTertiary,
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        width: '48%',
        marginBottom: 10,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e91e63',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    actionButtons: {
        gap: 10,
    },
    actionButton: {
        backgroundColor: '#e91e63',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AdminScreen;

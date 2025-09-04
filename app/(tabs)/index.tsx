import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useSimpleToast } from '../../src/context/SimpleToastContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useUnreadCounts } from '../../src/context/UnreadCountContext';
import { leaguesAPI, authAPI, getBaseUrl, chatAPI } from '../../src/services/apiService';
import { UserStats, GlobalStats, League } from '../../src/types';
import { router, useFocusEffect } from 'expo-router';
import { lightColors, darkColors } from '../../src/constants/Colors';
import { createThemeStyles } from '../../src/styles/universalStyles';

const HomeScreen = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useSimpleToast();
  const { resolvedTheme } = useTheme();
  const { unreadCounts, refreshUnreadCounts } = useUnreadCounts();

  // Get current theme colors from universal palette
  const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

  // Create universal styles with current theme colors
  const universalStyles = createThemeStyles(currentColors);

  // Create dashboard-specific styles with current theme colors
  const styles = StyleSheet.create({
    scrollContent: {
      paddingBottom: 50, // Add padding to the bottom to prevent content from being hidden by the tab bar
    },
    errorCard: {
      backgroundColor: currentColors.cardBackground,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentColors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 16,
      color: currentColors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: currentColors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: currentColors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      paddingHorizontal: 12,
      paddingTop: 16,
      paddingBottom: 12,
    },
    welcomeText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: currentColors.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: currentColors.textSecondary,
    },
    quickActions: {
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentColors.cardBackground,
      borderWidth: 1,
      borderColor: currentColors.borderLight,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    actionButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '500',
      color: currentColors.textSecondary,
    },
    section: {
      backgroundColor: currentColors.cardBackground,
      marginHorizontal: 12,
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentColors.textPrimary,
    },
    manageButton: {
      backgroundColor: currentColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    manageButtonText: {
      color: currentColors.textInverse,
      fontSize: 14,
      fontWeight: '500',
    },
    leaguesList: {
      gap: 8,
    },
    leagueCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentColors.borderLight,
    },
    leagueInfo: {
      flex: 1,
    },
    leagueNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    leagueName: {
      fontSize: 14,
      fontWeight: '500',
      color: currentColors.textPrimary,
      marginRight: 8,
    },
    chatIconContainer: {
      position: 'relative',
    },
    unreadBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    unreadBadgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
    },
    leagueDetails: {
      fontSize: 14,
      color: currentColors.textSecondary,
    },
    viewLeagueButton: {
      backgroundColor: currentColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentColors.primary,
      shadowColor: currentColors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    viewLeagueButtonText: {
      color: currentColors.textInverse,
      fontSize: 12,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.textPrimary,
      marginTop: 12,
      marginBottom: 4,
    },
    emptyStateText: {
      fontSize: 14,
      color: currentColors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: currentColors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    emptyStateActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    emptyStateButton: {
      backgroundColor: currentColors.cardBackground,
      borderWidth: 1,
      borderColor: currentColors.borderLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    emptyStateButtonText: {
      color: currentColors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    emptyStateButtonPrimary: {
      backgroundColor: currentColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    emptyStateButtonPrimaryText: {
      color: currentColors.textInverse,
      fontSize: 14,
      fontWeight: '500',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      paddingVertical: 12,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '600',
      color: currentColors.textPrimary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: currentColors.textSecondary,
      textAlign: 'center',
    },
    globalStatsSubsection: {
      marginBottom: 16,
    },
    subsectionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: currentColors.textPrimary,
      marginBottom: 12,
    },
    globalStatsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    globalStatCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    },
    globalStatNumber: {
      fontSize: 20,
      fontWeight: '600',
      color: currentColors.primary,
      marginBottom: 4,
    },
    globalStatLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: currentColors.textSecondary,
      textAlign: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: currentColors.borderLight,
      marginVertical: 16,
    },
    bottomSpacing: {
      height: 100, // Account for fixed bottom navigation
    },
    // New styles for unauthenticated view
    pageTitle: {
      paddingHorizontal: 12,
      paddingTop: 16,
      paddingBottom: 12,
    },
    pageTitleText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: currentColors.textPrimary,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 16,
      color: currentColors.textSecondary,
    },
    scoringButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentColors.cardBackground,
      borderWidth: 1,
      borderColor: currentColors.borderLight,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    scoringButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '500',
      color: currentColors.textSecondary,
    },
    card: {
      backgroundColor: currentColors.cardBackground,
      marginHorizontal: 12,
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentColors.textPrimary,
    },
    primaryButton: {
      backgroundColor: currentColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    primaryButtonText: {
      color: currentColors.textInverse,
      fontSize: 14,
      fontWeight: '500',
    },
    secondaryButton: {
      backgroundColor: currentColors.cardBackground,
      borderWidth: 1,
      borderColor: currentColors.borderLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    secondaryButtonText: {
      color: currentColors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    authButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    statPlaceholder: {
      fontSize: 20,
      fontWeight: '600',
      color: currentColors.textSecondary,
      marginBottom: 4,
    },
    statsSubsection: {
      marginBottom: 16,
    },
    platformStatsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    platformStatCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    },
    lifetimeStatNumber: {
      fontSize: 20,
      fontWeight: '600',
      color: currentColors.primary,
      marginBottom: 4,
    },
    platformStatLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: currentColors.textSecondary,
      textAlign: 'center',
    },
    weekStatNumber: {
      fontSize: 20,
      fontWeight: '600',
      color: currentColors.primary,
      marginBottom: 4,
    },
    statsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentColors.backgroundSecondary,
      borderWidth: 1,
      borderColor: currentColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statsButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: currentColors.primary,
      marginLeft: 4,
    },
  });

  // Remove the hardcoded getBaseUrl function - use the one from apiService
  const [leagues, setLeagues] = useState<League[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPicks: 0,
    correctPicks: 0,
    totalPoints: 0,
    averagePoints: 0,
    accuracy: 0,
    avgDistance: 0,
    perfectPicksRate: 0
  });
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalUsers: 0,
    totalLeagues: 0,
    totalPicks: 0,
    correctPicks: 0,
    accuracy: 0,
    averagePoints: 0,
    averageDistanceFromTarget: 0,
    lifetimeAccuracy: 0,
    lifetimeAvgDistance: 0,
    weekAccuracy: 0,
    weekAvgDistance: 0
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load data when auth is complete and user is authenticated
    if (!authLoading && user) {
      loadLeagues();
    }
  }, [authLoading, user]);

  // Reload data when the tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && user) {
        loadLeagues();
      }
    }, [authLoading, user])
  );

  const loadLeagues = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const [leaguesResponse, statsResponse, globalStatsResponse] = await Promise.all([
        leaguesAPI.getLeagues(),
        authAPI.getUserStats(),
        authAPI.getGlobalStats()
      ]);

      if (leaguesResponse.data.success) {
        setLeagues(leaguesResponse.data.data);
      }

      if (statsResponse.data.success) {
        setUserStats(statsResponse.data.data);
      }

      if (globalStatsResponse.data.success) {
        setGlobalStats(globalStatsResponse.data.data);
      }

      // Refresh unread counts using the context
      await refreshUnreadCounts();
    } catch (error: any) {
      console.error('Error loading data:', error);

      // Handle 429 rate limiting error with retry
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        setTimeout(() => {
          loadLeagues(retryCount + 1);
        }, delay);
        return;
      } else if (error.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
        showToast('Rate limited. Please wait a moment and try again.', 'error');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError('Unable to connect to server. Please check your internet connection.');
        showToast('Connection error. Please check your internet connection.', 'error');
      } else {
        setError('Failed to load data. Please try again.');
        showToast('Failed to load data. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadLeagues();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeagues();
    setRefreshing(false);
    showToast('Data refreshed successfully!', 'success');
  };

  const handleScoringPress = async () => {
    try {
      const url = `${getBaseUrl()}/scoring`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast('Unable to open scoring page', 'error');
      }
    } catch (error) {
      console.error('Error opening scoring page:', error);
      showToast('Unable to open scoring page', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={universalStyles.container} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={universalStyles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorCard}>
          <Ionicons name="cloud-offline" size={48} color={currentColors.error} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show unauthenticated view for users who are not logged in
  if (!user) {
    return (
      <SafeAreaView style={universalStyles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          style={universalStyles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title */}
          <View style={styles.pageTitle}>
            <Text style={styles.pageTitleText}>Dashboard</Text>
            <Text style={styles.pageSubtitle}>
              Welcome to F1 prediction game - Explore without signing up
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.scoringButton} onPress={handleScoringPress}>
              <Ionicons name="bar-chart" size={16} color={currentColors.textSecondary} />
              <Text style={styles.scoringButtonText}>How Scoring Works</Text>
            </TouchableOpacity>
          </View>

          {/* Your Leagues Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your Leagues</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/(tabs)/leagues')}
              >
                <Text style={styles.primaryButtonText}>View Public Leagues</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color={currentColors.textTertiary} />
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

          {/* Your Statistics Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Statistics</Text>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateSubtitle}>Log in to see your personal statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statPlaceholder}>N/A</Text>
                  <Text style={styles.statLabel}>Total Picks</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statPlaceholder}>N/A</Text>
                  <Text style={styles.statLabel}>Correct Picks</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statPlaceholder}>N/A</Text>
                  <Text style={styles.statLabel}>Total Points</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statPlaceholder}>N/A</Text>
                  <Text style={styles.statLabel}>Avg Points</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statPlaceholder}>N/A</Text>
                  <Text style={styles.statLabel}>Avg Distance</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statPlaceholder}>N/A</Text>
                  <Text style={styles.statLabel}>Perfect Rate</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Platform Statistics Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Platform Statistics</Text>
              <TouchableOpacity
                style={styles.statsButton}
                onPress={() => router.push('/stats')}
              >
                <Ionicons name="stats-chart" size={16} color={currentColors.primary} />
                <Text style={styles.statsButtonText}>Driver Position Stats</Text>
              </TouchableOpacity>
            </View>

            {/* Lifetime Performance */}
            <View style={styles.statsSubsection}>
              <Text style={styles.subsectionTitle}>Lifetime Performance</Text>
              <View style={styles.platformStatsGrid}>
                <View style={styles.platformStatCard}>
                  <Text style={styles.lifetimeStatNumber}>0%</Text>
                  <Text style={styles.platformStatLabel}>Global Accuracy</Text>
                </View>
                <View style={styles.platformStatCard}>
                  <Text style={styles.lifetimeStatNumber}>0</Text>
                  <Text style={styles.platformStatLabel}>Avg Distance from Correct</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Past Week Performance */}
            <View style={styles.statsSubsection}>
              <Text style={styles.subsectionTitle}>Past Week Performance</Text>
              <View style={styles.platformStatsGrid}>
                <View style={styles.platformStatCard}>
                  <Text style={styles.weekStatNumber}>0%</Text>
                  <Text style={styles.platformStatLabel}>Global Accuracy</Text>
                </View>
                <View style={styles.platformStatCard}>
                  <Text style={styles.weekStatNumber}>0</Text>
                  <Text style={styles.platformStatLabel}>Avg Distance from Correct</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom spacing for mobile to account for fixed bottom navigation */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={universalStyles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={universalStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
          <Text style={styles.subtitle}>Here&apos;s your F1 prediction overview</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleScoringPress}
          >
            <Ionicons name="help-circle-outline" size={20} color={currentColors.primary} />
            <Text style={styles.actionButtonText}>How Scoring Works</Text>
          </TouchableOpacity>
        </View>

        {/* Your Leagues Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Leagues</Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => router.push('/(tabs)/leagues')}
            >
              <Text style={styles.manageButtonText}>Manage Leagues</Text>
            </TouchableOpacity>
          </View>

          {leagues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color={currentColors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No leagues</Text>
              <Text style={styles.emptyStateText}>Get started by creating or joining a league.</Text>
              <View style={styles.emptyStateActions}>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => showToast('Join league feature coming soon!', 'info')}
                >
                  <Text style={styles.emptyStateButtonText}>Join League</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emptyStateButtonPrimary}
                  onPress={() => router.push('/(tabs)/leagues')}
                >
                  <Text style={styles.emptyStateButtonPrimaryText}>Create League</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.leaguesList}>
              {leagues.map((league) => (
                <TouchableOpacity
                  key={league.id}
                  style={styles.leagueCard}
                  onPress={() => router.push(`/league/${league.id}`)}
                >
                  <View style={styles.leagueInfo}>
                    <View style={styles.leagueNameContainer}>
                      <Text style={styles.leagueName}>{league.name}</Text>
                      {unreadCounts[league.id] > 0 && (
                        <View style={styles.chatIconContainer}>
                          <Ionicons name="chatbubbles-outline" size={20} color={currentColors.textSecondary} />
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unreadCounts[league.id]}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                    <Text style={styles.leagueDetails}>
                      Join Code: {league.joinCode}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewLeagueButton}
                    onPress={() => router.push(`/league/${league.id}`)}
                  >
                    <Text style={styles.viewLeagueButtonText}>View League</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* User Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.totalPicks}</Text>
              <Text style={styles.statLabel}>Total Picks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.correctPicks}</Text>
              <Text style={styles.statLabel}>Correct Picks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.averagePoints}</Text>
              <Text style={styles.statLabel}>Avg Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.avgDistance}</Text>
              <Text style={styles.statLabel}>Avg Distance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.perfectPicksRate}%</Text>
              <Text style={styles.statLabel}>Perfect Rate</Text>
            </View>
          </View>
        </View>

        {/* Global Stats Section */}
        <View style={styles.section}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Platform Statistics</Text>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => router.push('/stats')}
            >
              <Ionicons name="stats-chart" size={16} color={currentColors.primary} />
              <Text style={styles.statsButtonText}>Driver Position Stats</Text>
            </TouchableOpacity>
          </View>

          {/* Lifetime Performance */}
          <View style={styles.globalStatsSubsection}>
            <Text style={styles.subsectionTitle}>Lifetime Performance</Text>
            <View style={styles.globalStatsGrid}>
              <View style={styles.globalStatCard}>
                <Text style={styles.globalStatNumber}>{globalStats.lifetimeAccuracy || 0}%</Text>
                <Text style={styles.globalStatLabel}>Global Accuracy</Text>
              </View>
              <View style={styles.globalStatCard}>
                <Text style={styles.globalStatNumber}>{globalStats.lifetimeAvgDistance || 0}</Text>
                <Text style={styles.globalStatLabel}>Avg Distance from Correct</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Past Week Performance */}
          <View style={styles.globalStatsSubsection}>
            <Text style={styles.subsectionTitle}>Past Week Performance</Text>
            <View style={styles.globalStatsGrid}>
              <View style={styles.globalStatCard}>
                <Text style={styles.globalStatNumber}>{globalStats.weekAccuracy || 0}%</Text>
                <Text style={styles.globalStatLabel}>Global Accuracy</Text>
              </View>
              <View style={styles.globalStatCard}>
                <Text style={styles.globalStatNumber}>{globalStats.weekAvgDistance || 0}</Text>
                <Text style={styles.globalStatLabel}>Avg Distance from Correct</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing for mobile to account for fixed bottom navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
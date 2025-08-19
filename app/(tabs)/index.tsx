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
import { leaguesAPI, authAPI, getBaseUrl } from '../../src/services/apiService';
import { UserStats, GlobalStats, League } from '../../src/types';
import { router, useFocusEffect } from 'expo-router';
import Colors from '../../constants/Colors';
import { spacing, borderRadius, shadows, cardStyles, textStyles } from '../../utils/styles';

const HomeScreen = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useSimpleToast();

  // Remove the hardcoded getBaseUrl function - use the one from apiService
  const [leagues, setLeagues] = useState<League[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPicks: 0,
    correctPicks: 0,
    totalPoints: 0,
    averagePoints: 0,
    accuracy: 0
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
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'left', 'right']}>
        <View style={styles.errorCard}>
          <Ionicons name="cloud-offline" size={48} color={Colors.light.error} />
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
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scrollView}
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
              <Ionicons name="bar-chart" size={16} color="#6b7280" />
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
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Platform Statistics Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Platform Statistics</Text>

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
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
            <Ionicons name="help-circle-outline" size={20} color={Colors.light.primary} />
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
              <Ionicons name="trophy-outline" size={48} color={Colors.light.gray400} />
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
                    <Text style={styles.leagueName}>{league.name}</Text>
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
              <Text style={styles.statNumber}>{userStats.accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        {/* Global Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Statistics</Text>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundPrimary, // gray-50
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding to the bottom to prevent content from being hidden by the tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.backgroundPrimary,
  },
  errorCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    ...shadows.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: Colors.light.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  quickActions: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  actionButtonText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  section: {
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  manageButton: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  manageButtonText: {
    color: Colors.light.textInverse,
    fontSize: 14,
    fontWeight: '500',
  },
  leaguesList: {
    gap: spacing.sm,
  },
  leagueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  leagueDetails: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  viewLeagueButton: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  viewLeagueButtonText: {
    color: Colors.light.buttonPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyStateButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyStateButtonText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateButtonPrimary: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyStateButtonPrimaryText: {
    color: Colors.light.textInverse,
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  globalStatsSubsection: {
    marginBottom: spacing.lg,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.textPrimary,
    marginBottom: spacing.md,
  },
  globalStatsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  globalStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  globalStatNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.buttonPrimary,
    marginBottom: spacing.xs,
  },
  globalStatLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: spacing.lg,
  },
  bottomSpacing: {
    height: 100, // Account for fixed bottom navigation
  },
  // New styles for unauthenticated view
  pageTitle: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  pageTitleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  scoringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  scoringButtonText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  primaryButton: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  primaryButtonText: {
    color: Colors.light.textInverse,
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  secondaryButtonText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  authButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statPlaceholder: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: spacing.xs,
  },
  statsSubsection: {
    marginBottom: spacing.lg,
  },
  platformStatsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  platformStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  lifetimeStatNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.buttonPrimary,
    marginBottom: spacing.xs,
  },
  platformStatLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  weekStatNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.buttonPrimary,
    marginBottom: spacing.xs,
  },
});

export default HomeScreen;
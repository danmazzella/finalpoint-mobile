import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { picksAPI } from '../src/services/apiService';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { createThemeStyles } from '../src/styles/universalStyles';
import { spacing, borderRadius, shadows } from '../utils/styles';
import Avatar from '../src/components/Avatar';
import { usePositionNavigation } from '../hooks/usePositionNavigation';

interface PositionResultV2 {
    leagueId: number;
    weekNumber: number;
    position: number;
    picks: {
        userId: number;
        userName: string;
        userAvatar?: string;
        driverId: number;
        driverName: string;
        driverTeam: string;
        position: number;
        isCorrect: boolean | null;
        points: number | null;
        actualDriverId: number | null;
        actualDriverName: string | null;
        actualDriverTeam: string | null;
        actualFinishPosition: number | null;
    }[];
    actualResult: {
        driverId: number;
        driverName: string;
        driverTeam: string;
    } | null;
    totalParticipants: number;
    correctPicks: number;
}

const PositionResultsScreen = () => {
    const params = useLocalSearchParams();
    const { showToast } = useSimpleToast();
    const { resolvedTheme } = useTheme();
    const leagueId = Number(params.leagueId);
    const weekNumber = Number(params.weekNumber);
    const position = Number(params.position);
    const leagueName = params.leagueName as string;

    // Get current theme colors from universal palette
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Create universal styles with current theme colors
    const universalStyles = createThemeStyles(currentColors);

    // Create styles with current theme colors
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentColors.backgroundPrimary,
        },
        scrollView: {
            flex: 1,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: currentColors.backgroundPrimary,
        },
        loadingText: {
            marginTop: spacing.md,
            fontSize: 16,
            color: currentColors.textSecondary,
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
        },
        errorTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
        },
        errorMessage: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.lg,
        },
        retryButton: {
            backgroundColor: currentColors.primary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
        },
        retryButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: 'bold',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: spacing.lg,
            paddingVertical: spacing.md,
            minHeight: 64,
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
        },
        backButton: {
            paddingLeft: spacing.md,
            paddingRight: spacing.sm,
            paddingVertical: spacing.sm,
            marginRight: spacing.sm,
        },
        headerContent: {
            flex: 1,
        },
        title: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        subtitle: {
            fontSize: 16,
            color: currentColors.textSecondary,
            marginTop: spacing.xs,
        },
        weekInfo: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginTop: spacing.xs,
        },
        positionInfo: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginTop: spacing.xs,
        },
        summaryContainer: {
            flexDirection: 'row',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            gap: spacing.md,
        },
        summaryCard: {
            flex: 1,
            backgroundColor: currentColors.cardBackground,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 60,
            ...shadows.sm,
        },
        summaryLabel: {
            fontSize: 11,
            color: currentColors.textSecondary,
            marginBottom: spacing.xs,
            textAlign: 'center',
            fontWeight: '500',
        },
        summaryValue: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            textAlign: 'center',
        },
        section: {
            margin: spacing.lg,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: spacing.md,
        },
        actualResultCard: {
            backgroundColor: currentColors.successLight,
            padding: spacing.lg,
            borderRadius: borderRadius.md,
            borderWidth: 2,
            borderColor: currentColors.success,
        },
        actualResultLabel: {
            fontSize: 14,
            fontWeight: 'bold',
            color: currentColors.success,
            marginBottom: spacing.xs,
        },
        actualResultDriver: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentColors.success,
        },
        actualResultTeam: {
            fontSize: 14,
            color: currentColors.success,
            marginTop: spacing.xs,
        },
        resultCard: {
            backgroundColor: currentColors.backgroundSecondary,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            marginBottom: spacing.sm,
            ...shadows.sm,
        },
        resultHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        avatarContainer: {
            position: 'relative',
            marginRight: spacing.md,
        },
        positionOverlay: {
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: currentColors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: currentColors.cardBackground,
        },
        firstPlace: {
            backgroundColor: '#FFD700', // Gold
        },
        secondPlace: {
            backgroundColor: '#C0C0C0', // Silver
        },
        thirdPlace: {
            backgroundColor: '#CD7F32', // Bronze
        },
        positionOverlayText: {
            color: currentColors.textInverse,
            fontSize: 12,
            fontWeight: 'bold',
        },
        pickStatus: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing.xs,
        },
        checkIcon: {
            color: currentColors.success,
            fontSize: 14,
            fontWeight: 'bold',
            marginRight: spacing.xs,
        },
        pickStatusText: {
            fontSize: 12,
            color: currentColors.success,
            flex: 1,
        },
        pointsLabel: {
            fontSize: 10,
            color: currentColors.textSecondary,
            marginBottom: spacing.xs,
            textAlign: 'center',
            fontWeight: '500',
        },
        playerInfo: {
            flex: 1,
        },
        playerName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        playerPick: {
            fontSize: 12,
            color: currentColors.textSecondary,
            marginTop: spacing.xs,
        },
        scoreInfo: {
            alignItems: 'center',
            minWidth: 60,
        },
        pointsText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            textAlign: 'center',
        },
        correctText: {
            fontSize: 12,
            color: currentColors.success,
            fontWeight: 'bold',
        },
        resultDetails: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: currentColors.borderLight,
        },
        actualResultText: {
            fontSize: 12,
            color: currentColors.textSecondary,
        },
        incorrectText: {
            fontSize: 12,
            color: currentColors.error,
            fontWeight: 'bold',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
        },
        emptyMessage: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
        },
        description: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginTop: spacing.md,
            marginBottom: spacing.lg,
            textAlign: 'center',
        },
        positionContext: {
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            paddingHorizontal: spacing.sm,
        },
        positionBadge: {
            backgroundColor: currentColors.primary,
            borderRadius: borderRadius.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            marginBottom: spacing.xs,
        },
        positionBadgeText: {
            fontSize: 14,
            fontWeight: '700',
            color: currentColors.textInverse,
        },
        positionLabel: {
            fontSize: 12,
            color: currentColors.textSecondary,
            fontWeight: '500',
            textAlign: 'center',
        },
        positionSection: {
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
        },
        navigationContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.sm,
        },
        navigationButton: {
            backgroundColor: currentColors.backgroundSecondary,
            padding: spacing.sm,
            borderRadius: borderRadius.full,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadows.sm,
        },
        navigationButtonDisabled: {
            backgroundColor: currentColors.borderLight,
            borderColor: currentColors.borderLight,
        },
    });

    const [results, setResults] = useState<PositionResultV2 | null>(null);
    const [availablePositions, setAvailablePositions] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use custom navigation hook
    const { navigateToPrevious, navigateToNext, canNavigate } = usePositionNavigation({
        leagueId,
        weekNumber,
        leagueName,
    });

    // Router for back button navigation
    const router = useRouter();

    const loadResults = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await picksAPI.getResultsByPositionV2(
                leagueId,
                weekNumber,
                position
            );

            if (response.data.success) {
                setResults(response.data.data);
            } else {
                setError('Failed to load position results');
            }
        } catch (error: any) {
            console.error('Error loading position results:', error);
            setError('Failed to load position results');
            showToast('Failed to load position results', 'error');
        } finally {
            setLoading(false);
        }
    }, [leagueId, weekNumber, position, showToast]);

    const loadAvailablePositions = useCallback(async () => {
        try {
            const response = await picksAPI.getLeaguePositions(leagueId);
            if (response.data.success) {
                // Sort positions in ascending order (P1, P2, P3, etc.)
                const sortedPositions = response.data.data.sort((a: number, b: number) => a - b);
                setAvailablePositions(sortedPositions);
            }
        } catch (error: any) {
            console.error('Error loading available positions:', error);
        }
    }, [leagueId]);



    const getCurrentPositionIndex = () => {
        return availablePositions.findIndex(pos => pos === position);
    };

    const canNavigatePrevious = () => {
        return getCurrentPositionIndex() > 0;
    };

    const canNavigateNext = () => {
        return getCurrentPositionIndex() < availablePositions.length - 1;
    };



    useEffect(() => {
        loadResults();
        loadAvailablePositions();
    }, [loadResults, loadAvailablePositions]);

    const getPositionLabel = (position: number) => {
        const labels: { [key: number]: string } = {
            1: 'P1',
            2: 'P2',
            3: 'P3',
            4: 'P4',
            5: 'P5',
            6: 'P6',
            7: 'P7',
            8: 'P8',
            9: 'P9',
            10: 'P10',
            11: 'P11',
            12: 'P12',
            13: 'P13',
            14: 'P14',
            15: 'P15',
            16: 'P16',
            17: 'P17',
            18: 'P18',
            19: 'P19',
            20: 'P20'
        };
        return labels[position] || `P${position}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={currentColors.primary} />
                    <Text style={styles.loadingText}>Loading position results...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={currentColors.error} />
                    <Text style={styles.errorTitle}>Error Loading Results</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadResults}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!results) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>No Results Available</Text>
                            <Text style={styles.subtitle}>
                                {leagueName || 'Loading...'}
                            </Text>
                            <Text style={styles.positionInfo}>
                                {getPositionLabel(position)} - Week {weekNumber}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyMessage}>
                            No results are available for this position yet.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Picks By Position</Text>
                    </View>
                </View>

                <Text style={styles.description}>
                    {leagueName || 'Loading...'} • Week {weekNumber}
                </Text>

                {/* Position Context with Navigation */}
                <View style={styles.positionSection}>
                    <View style={styles.navigationContainer}>
                        {/* Previous Button */}
                        <TouchableOpacity
                            style={[
                                styles.navigationButton,
                                (!canNavigatePrevious() || !canNavigate()) && styles.navigationButtonDisabled
                            ]}
                            onPress={() => navigateToPrevious(position, availablePositions)}
                            disabled={!canNavigatePrevious() || !canNavigate()}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={18}
                                color={(canNavigatePrevious() && canNavigate()) ? currentColors.textPrimary : currentColors.textSecondary}
                            />
                        </TouchableOpacity>

                        {/* Position Context */}
                        <View style={styles.positionContext}>
                            <View style={styles.positionBadge}>
                                <Text style={styles.positionBadgeText}>{getPositionLabel(position)}</Text>
                            </View>
                            <Text style={styles.positionLabel}>Viewing picks for {getPositionLabel(position)}</Text>
                        </View>

                        {/* Next Button */}
                        <TouchableOpacity
                            style={[
                                styles.navigationButton,
                                (!canNavigateNext() || !canNavigate()) && styles.navigationButtonDisabled
                            ]}
                            onPress={() => navigateToNext(position, availablePositions)}
                            disabled={!canNavigateNext() || !canNavigate()}
                        >
                            <Ionicons
                                name="chevron-forward"
                                size={18}
                                color={(canNavigateNext() && canNavigate()) ? currentColors.textPrimary : currentColors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary Stats */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Participants</Text>
                        <Text style={styles.summaryValue}>{results.totalParticipants}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Correct Picks</Text>
                        <Text style={styles.summaryValue}>{results.correctPicks}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Accuracy</Text>
                        <Text style={styles.summaryValue}>
                            {results.totalParticipants > 0
                                ? Math.round((results.correctPicks / results.totalParticipants) * 100)
                                : 0}%
                        </Text>
                    </View>
                </View>

                {/* Actual Result */}
                {results.actualResult && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Actual Result</Text>
                        <View style={styles.actualResultCard}>
                            <Text style={styles.actualResultLabel}>
                                {getPositionLabel(position)}
                            </Text>
                            <Text style={styles.actualResultDriver}>
                                {results.actualResult.driverName}
                            </Text>
                            <Text style={styles.actualResultTeam}>
                                {results.actualResult.driverTeam}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Results List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>All Picks</Text>
                    {results.picks.map((pick, index) => (
                        <View key={pick.userId} style={styles.resultCard}>
                            <View style={styles.resultHeader}>
                                {/* Avatar with Position Overlay */}
                                <View style={styles.avatarContainer}>
                                    <Avatar
                                        src={pick.userAvatar}
                                        size="md"
                                        fallback={pick.userName?.charAt(0).toUpperCase() || 'U'}
                                    />
                                    <View style={[
                                        styles.positionOverlay,
                                        index === 0 && styles.firstPlace,
                                        index === 1 && styles.secondPlace,
                                        index === 2 && styles.thirdPlace
                                    ]}>
                                        <Text style={styles.positionOverlayText}>{index + 1}</Text>
                                    </View>
                                </View>

                                {/* User Info */}
                                <View style={styles.playerInfo}>
                                    <Text style={styles.playerName}>{pick.userName}</Text>
                                    <View style={styles.pickStatus}>
                                        <Text style={styles.checkIcon}>✓</Text>
                                        <Text style={styles.pickStatusText}>
                                            All 2 picks made
                                        </Text>
                                    </View>
                                </View>

                                {/* Points Display */}
                                {pick.points !== null && (
                                    <View style={styles.scoreInfo}>
                                        <Text style={styles.pointsLabel}>POINTS</Text>
                                        <Text style={styles.pointsText}>{pick.points}</Text>
                                    </View>
                                )}
                            </View>

                            {results.actualResult && (
                                <View style={styles.resultDetails}>
                                    {pick.isCorrect === true && (
                                        <Text style={styles.correctText}>✓ Correct</Text>
                                    )}
                                    {pick.isCorrect === false && (
                                        <Text style={styles.incorrectText}>✗ Incorrect</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};



export default PositionResultsScreen;

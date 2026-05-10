import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Switch, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LeagueChat } from '../../components/LeagueChat';
import { SecureChatService } from '../../src/services/secureChatService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useChatFeature } from '../../src/context/FeatureFlagContext';
import { lightColors, darkColors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI, leaguesAPI } from '../../src/services/apiService';
import GlassBackground from '../../src/components/GlassBackground';
import { shadows } from '../../utils/styles';

export default function LeagueChatScreen() {
    const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { resolvedTheme } = useTheme();
    const { isChatFeatureEnabled, isLoading: featureFlagLoading } = useChatFeature();
    const insets = useSafeAreaInsets();
    const [leagueName, setLeagueName] = useState('League Chat');
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [loadingPreferences, setLoadingPreferences] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Get current theme colors
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    const loadNotificationPreferences = useCallback(async () => {
        try {
            setLoadingPreferences(true);
            const response = await chatAPI.getNotificationPreferences(parseInt(leagueId));
            if (response.data.success) {
                setNotificationsEnabled(response.data.notificationsEnabled);
            }
        } catch (error) {
            console.error('Error loading notification preferences:', error);
        } finally {
            setLoadingPreferences(false);
        }
    }, [leagueId]);

    useEffect(() => {
        // Check if chat feature is enabled
        if (!featureFlagLoading && !isChatFeatureEnabled) {
            Alert.alert(
                'Feature Not Available',
                'Chat functionality is currently not available. Please try again later.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
            return;
        }

        if (!user || !leagueId) {
            if (!user) {
                router.push('/login');
                return;
            }
            return;
        }

        const checkAccess = async () => {
            try {
                // Use secure backend validation instead of client-side checks
                const hasLeagueAccess = await SecureChatService.validateLeagueAccess(leagueId);

                if (hasLeagueAccess) {
                    setHasAccess(true);

                    // Get actual league name from API
                    try {
                        const leagueResponse = await leaguesAPI.getLeague(parseInt(leagueId));
                        if (leagueResponse.data.success) {
                            setLeagueName(leagueResponse.data.data.name);
                        } else {
                            setLeagueName(`League ${leagueId}`);
                        }
                    } catch (error) {
                        console.error('Error fetching league name:', error);
                        setLeagueName(`League ${leagueId}`);
                    }

                    // Load notification preferences for this league
                    await loadNotificationPreferences();
                } else {
                    setHasAccess(false);
                    Alert.alert(
                        'Access Denied',
                        'You are not a member of this league.',
                        [{ text: 'OK', onPress: () => router.back() }]
                    );
                }
            } catch (error) {
                console.error('Error checking league access:', error);
                Alert.alert('Error', 'Failed to load chat. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [user, leagueId, router, loadNotificationPreferences, isChatFeatureEnabled, featureFlagLoading]);

    const toggleNotifications = async () => {
        try {
            const newValue = !notificationsEnabled;
            const response = await chatAPI.updateNotificationPreferences(parseInt(leagueId), newValue);
            if (response.data.success) {
                setNotificationsEnabled(newValue);
            } else {
                Alert.alert('Error', 'Failed to update notification preferences');
            }
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            Alert.alert('Error', 'Failed to update notification preferences');
        }
    };

    const handleBack = () => {
        router.back();
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
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContent: {
            width: '100%',
            maxWidth: 400,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: currentColors.glassBorder,
            backgroundColor: currentColors.modalBackground,
            ...shadows.glass,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.glassBorder,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
        },
        modalBody: {
            padding: 20,
        },
        settingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        settingTitle: {
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 4,
            color: currentColors.textPrimary,
        },
        settingDescription: {
            fontSize: 14,
            lineHeight: 20,
            color: currentColors.textSecondary,
        },
        modalFooter: {
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: currentColors.glassBorder,
        },
        closeButton: {
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            backgroundColor: currentColors.primary,
        },
        closeButtonText: {
            fontSize: 16,
            fontWeight: '600',
            color: currentColors.textInverse,
        },
        errorText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: 10,
        },
        errorSubtext: {
            fontSize: 16,
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginBottom: 30,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: currentColors.glassBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.glassBorder,
        },
        backButton: {
            padding: 8,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: currentColors.textPrimary,
            flex: 1,
            textAlign: 'center',
        },
        headerRight: {
            width: 40,
        },
        backButtonText: {
            color: currentColors.primary,
            fontSize: 16,
            fontWeight: '600',
        },
    });

    if (!user) {
        return (
            <GlassBackground>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Please Log In</Text>
                    <Text style={styles.errorSubtext}>You need to be logged in to access chat.</Text>
                </View>
            </GlassBackground>
        );
    }

    if (loading || featureFlagLoading) {
        return (
            <GlassBackground>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: currentColors.textPrimary }}>
                        {featureFlagLoading ? 'Loading...' : 'Loading chat...'}
                    </Text>
                </View>
            </GlassBackground>
        );
    }

    if (!hasAccess) {
        return (
            <GlassBackground>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Access Denied</Text>
                    <Text style={styles.errorSubtext}>You are not a member of this league.</Text>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </GlassBackground>
        );
    }

    return (
        <GlassBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{leagueName}</Text>

                {/* Settings Button */}
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={{ padding: 8 }}>
                        <Ionicons name="settings-outline" size={24} color={currentColors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Chat Component */}
            <LeagueChat leagueId={leagueId} leagueName={leagueName} />

            {/* Settings Modal */}
            <Modal
                visible={showSettingsModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSettingsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chat Settings</Text>
                            <TouchableOpacity onPress={() => setShowSettingsModal(false)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={24} color={currentColors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <View style={styles.settingRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.settingTitle}>Push Notifications</Text>
                                    <Text style={styles.settingDescription}>
                                        Get notified when someone sends a message in this league
                                    </Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={toggleNotifications}
                                    disabled={loadingPreferences}
                                    trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                                    thumbColor={notificationsEnabled ? currentColors.primary : currentColors.borderMedium}
                                    ios_backgroundColor={currentColors.borderLight}
                                />
                            </View>
                        </View>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity onPress={() => setShowSettingsModal(false)} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
        </GlassBackground>
    );
}

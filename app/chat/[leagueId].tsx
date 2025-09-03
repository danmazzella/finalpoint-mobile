import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Switch, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LeagueChat } from '../../components/LeagueChat';
import { SecureChatService } from '../../src/services/secureChatService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useChatFeature } from '../../src/context/FeatureFlagContext';
import { lightColors, darkColors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI, leaguesAPI } from '../../src/services/apiService';

export default function LeagueChatScreen() {
    const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { resolvedTheme } = useTheme();
    const { isChatFeatureEnabled, isLoading: featureFlagLoading } = useChatFeature();
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
            backgroundColor: '#f5f5f5',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            padding: 20,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContent: {
            width: '100%',
            maxWidth: 400,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: '600',
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
        },
        settingDescription: {
            fontSize: 14,
            lineHeight: 20,
        },
        modalFooter: {
            padding: 20,
            borderTopWidth: 1,
        },
        closeButton: {
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
        },
        closeButtonText: {
            fontSize: 16,
            fontWeight: '600',
        },
        errorText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: 10,
        },
        errorSubtext: {
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            marginBottom: 30,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#e0e0e0',
        },
        backButton: {
            padding: 8,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            flex: 1,
            textAlign: 'center',
        },
        headerRight: {
            width: 40, // Same width as back button for centering
        },
        backButtonText: {
            color: '#007AFF',
            fontSize: 16,
            fontWeight: '600',
        },
    });

    if (!user) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: currentColors.backgroundPrimary }]}>
                <Text style={[styles.errorText, { color: currentColors.textPrimary }]}>Please Log In</Text>
                <Text style={[styles.errorSubtext, { color: currentColors.textSecondary }]}>You need to be logged in to access chat.</Text>
            </View>
        );
    }

    if (loading || featureFlagLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: currentColors.backgroundPrimary }]}>
                <Text style={{ color: currentColors.textPrimary }}>
                    {featureFlagLoading ? 'Loading...' : 'Loading chat...'}
                </Text>
            </View>
        );
    }

    if (!hasAccess) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: currentColors.backgroundPrimary }]}>
                <Text style={[styles.errorText, { color: currentColors.textPrimary }]}>Access Denied</Text>
                <Text style={[styles.errorSubtext, { color: currentColors.textSecondary }]}>You are not a member of this league.</Text>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Text style={[styles.backButtonText, { color: currentColors.buttonPrimary }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Create theme-aware styles
    const themeStyles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentColors.backgroundPrimary,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
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
            width: 40, // Same width as back button for centering
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContent: {
            width: '100%',
            maxWidth: 400,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: '600',
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
        },
        settingDescription: {
            fontSize: 14,
            lineHeight: 20,
        },
        modalFooter: {
            padding: 20,
            borderTopWidth: 1,
        },
        closeButton: {
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
        },
        closeButtonText: {
            fontSize: 16,
            fontWeight: '600',
        },
    });

    return (
        <View style={themeStyles.container}>
            {/* Header */}
            <View style={themeStyles.header}>
                <TouchableOpacity style={themeStyles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color={currentColors.buttonPrimary} />
                </TouchableOpacity>
                <Text style={themeStyles.headerTitle}>{leagueName}</Text>

                {/* Settings Button */}
                <View style={themeStyles.headerRight}>
                    <TouchableOpacity
                        onPress={() => setShowSettingsModal(true)}
                        style={{ padding: 8 }}
                    >
                        <Ionicons
                            name="settings-outline"
                            size={24}
                            color={currentColors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Chat Component */}
            <LeagueChat
                leagueId={leagueId}
                leagueName={leagueName}
            />

            {/* Settings Modal */}
            <Modal
                visible={showSettingsModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSettingsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: currentColors.cardBackground }]}>
                        {/* Modal Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: currentColors.borderLight }]}>
                            <Text style={[styles.modalTitle, { color: currentColors.textPrimary }]}>
                                Chat Settings
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowSettingsModal(false)}
                                style={{ padding: 4 }}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={currentColors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <View style={styles.modalBody}>
                            <View style={styles.settingRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.settingTitle, { color: currentColors.textPrimary }]}>
                                        Push Notifications
                                    </Text>
                                    <Text style={[styles.settingDescription, { color: currentColors.textSecondary }]}>
                                        Get notified when someone sends a message in this league
                                    </Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={toggleNotifications}
                                    disabled={loadingPreferences}
                                    trackColor={{ false: currentColors.borderLight, true: currentColors.primary + '40' }}
                                    thumbColor={notificationsEnabled ? currentColors.primary : currentColors.borderMedium}
                                />
                            </View>
                        </View>

                        {/* Modal Footer */}
                        <View style={[styles.modalFooter, { borderTopColor: currentColors.borderLight }]}>
                            <TouchableOpacity
                                onPress={() => setShowSettingsModal(false)}
                                style={[styles.closeButton, { backgroundColor: currentColors.primary }]}
                            >
                                <Text style={[styles.closeButtonText, { color: currentColors.textInverse }]}>
                                    Close
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { leaguesAPI } from '../src/services/apiService';
import { useSimpleToast } from '../src/context/SimpleToastContext';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';

const JoinLeagueScreen = () => {
    const { showToast } = useSimpleToast();
    const { resolvedTheme } = useTheme();
    const { joinCode: initialJoinCode } = useLocalSearchParams<{ joinCode?: string }>();
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);

    // Get current theme colors
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Pre-fill join code if provided in URL
    useEffect(() => {
        if (initialJoinCode) {
            setJoinCode(initialJoinCode);
        }
    }, [initialJoinCode]);

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
                router.back();
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

    // Create theme-aware styles
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentColors.backgroundPrimary,
            paddingTop: Platform.OS === 'android' ? 0 : 0,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20,
            minHeight: 96, // 24dp according to Material Design
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
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
        content: {
            flex: 1,
            padding: 20,
        },
        description: {
            fontSize: 16,
            color: currentColors.textPrimary,
            marginBottom: 20,
            textAlign: 'center',
            fontWeight: '500',
        },
        formContainer: {
            backgroundColor: currentColors.cardBackground,
            borderRadius: 16,
            padding: 24,
            shadowColor: currentColors.textPrimary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        inputContainer: {
            marginBottom: 24,
        },
        inputLabel: {
            fontSize: 16,
            fontWeight: '700',
            color: currentColors.textPrimary,
            marginBottom: 12,
            textAlign: 'center',
        },
        input: {
            borderWidth: 2,
            borderColor: currentColors.primary,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            backgroundColor: currentColors.backgroundSecondary,
            textAlign: 'center',
            letterSpacing: 2,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
        },
        joinButton: {
            backgroundColor: currentColors.primary,
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
        },
        joinButtonDisabled: {
            backgroundColor: currentColors.borderMedium,
        },
        joinButtonText: {
            color: currentColors.textInverse,
            fontSize: 16,
            fontWeight: 'bold',
        },
        infoContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: 16,
            backgroundColor: currentColors.info + '10',
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: currentColors.primary,
        },
        infoText: {
            fontSize: 14,
            color: currentColors.textSecondary,
            marginLeft: 8,
            flex: 1,
            lineHeight: 20,
        },
    });

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={currentColors.primary} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Join League</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>Enter a join code to join an existing league</Text>

                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Join Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter join code"
                            value={joinCode}
                            onChangeText={setJoinCode}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            autoFocus
                            textAlign="left"
                            selection={{ start: 0, end: 0 }}
                            placeholderTextColor={currentColors.textTertiary}
                        />
                    </View>

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

                    <View style={styles.infoContainer}>
                        <Ionicons name="information-circle" size={20} color={currentColors.textSecondary} />
                        <Text style={styles.infoText}>
                            Ask the league owner for the join code to join their league
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default JoinLeagueScreen;

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

const JoinLeagueScreen = () => {
    const { showToast } = useSimpleToast();
    const { joinCode: initialJoinCode } = useLocalSearchParams<{ joinCode?: string }>();
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);

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

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#007bff" />
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
                            placeholderTextColor="#999"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.joinButton, loading && styles.joinButtonDisabled]}
                        onPress={joinLeague}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.joinButtonText}>Join League</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.infoContainer}>
                        <Ionicons name="information-circle" size={20} color="#666" />
                        <Text style={styles.infoText}>
                            Ask the league owner for the join code to join their league
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: Platform.OS === 'android' ? 0 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        minHeight: 96, // 24dp according to Material Design
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    description: {
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
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
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    input: {
        borderWidth: 2,
        borderColor: '#007bff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
        textAlign: 'center',
        letterSpacing: 2,
        fontWeight: 'bold',
        color: '#333',
    },
    joinButton: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    joinButtonDisabled: {
        backgroundColor: '#ccc',
    },
    joinButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
});

export default JoinLeagueScreen;

import React from 'react';
import { View, Text } from 'react-native';
import Constants from 'expo-constants';
import Colors from '../constants/Colors';
import { spacing, borderRadius } from '../utils/styles';

interface GoogleSignInWrapperProps {
    disabled: boolean;
}

const GoogleSignInWrapper: React.FC<GoogleSignInWrapperProps> = ({ disabled }) => {
    // Check if we're running in Expo Go (Google Sign-In won't work there)
    const isExpoGo = Constants.appOwnership === 'expo';

    if (isExpoGo) {
        return (
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    Google Sign-In is available in development builds
                </Text>
            </View>
        );
    }

    // In development builds, render the actual Google Sign-In component
    try {
        const { useGoogleSignIn } = require('../src/hooks/useGoogleSignIn');
        const { googleConfig } = require('../config/google.config');
        const GoogleSignInButton = require('./GoogleSignInButton').default;

        const { signIn, isLoading } = useGoogleSignIn(googleConfig);

        // Create a wrapper function that adds platform info
        const handleSignIn = async () => {
            try {
                const result = await signIn();
                return result;
            } catch (error) {
                console.error('❌ Google Sign-In error:', error);
                throw error;
            }
        };

        return (
            <GoogleSignInButton
                onPress={handleSignIn}
                isLoading={isLoading}
                disabled={disabled}
            />
        );
    } catch (error) {
        return (
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    Google Sign-In is not available in this build
                </Text>
            </View>
        );
    }
};

const styles = {
    infoContainer: {
        alignItems: 'center' as const,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
    },
    infoText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center' as const,
        fontStyle: 'italic' as const,
    },
};

export default GoogleSignInWrapper;

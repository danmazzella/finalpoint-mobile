import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Constants from 'expo-constants';
import Colors from '../constants/Colors';
import { spacing, borderRadius } from '../utils/styles';

interface GoogleSignInWrapperProps {
    disabled: boolean;
}

const GoogleSignInWrapper: React.FC<GoogleSignInWrapperProps> = ({ disabled }) => {
    const [isExpoGo, setIsExpoGo] = useState(false);
    const [isGoogleSignInAvailable, setIsGoogleSignInAvailable] = useState(false);
    const [GoogleSignInComponent, setGoogleSignInComponent] = useState<React.ComponentType<{ disabled: boolean }> | null>(null);

    useEffect(() => {
        // Check if we're running in Expo Go
        const expoGoCheck = Constants.appOwnership === 'expo';
        setIsExpoGo(expoGoCheck);

        if (!expoGoCheck) {
            // Try to load Google Sign-In components
            try {
                const { useGoogleSignIn } = require('../src/hooks/useGoogleSignIn');
                const { googleConfig } = require('../config/google.config');
                const GoogleSignInButton = require('./GoogleSignInButton').default;

                // Create a component that uses the hook
                const GoogleSignInWrapper = ({ disabled }: { disabled: boolean }) => {
                    const { signIn, isLoading } = useGoogleSignIn(googleConfig);

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
                };

                setGoogleSignInComponent(() => GoogleSignInWrapper);
                setIsGoogleSignInAvailable(true);
            } catch (error) {
                console.error('Google Sign-In components not available:', error);
                setIsGoogleSignInAvailable(false);
            }
        }
    }, []);

    // If running in Expo Go, show info message
    if (isExpoGo) {
        return (
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    Google Sign-In is available in development builds
                </Text>
            </View>
        );
    }

    // If Google Sign-In is not available, show info message
    if (!isGoogleSignInAvailable) {
        return (
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    Google Sign-In is not available in this build
                </Text>
            </View>
        );
    }

    // Render the Google Sign-In component
    return GoogleSignInComponent ? <GoogleSignInComponent disabled={disabled} /> : null;
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

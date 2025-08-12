import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';

interface GoogleSignInButtonProps {
    onPress: () => void;
    isLoading?: boolean;
    disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    onPress,
    isLoading = false,
    disabled = false,
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                disabled && styles.buttonDisabled,
            ]}
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={Colors.light.textSecondary} />
            ) : (
                <>
                    <Ionicons name="logo-google" size={20} color={Colors.light.textSecondary} />
                    <Text style={styles.buttonText}>Continue with Google</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.light.borderMedium,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginTop: spacing.md,
        ...shadows.sm,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: Colors.light.textSecondary,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: spacing.sm,
    },
});

export default GoogleSignInButton;

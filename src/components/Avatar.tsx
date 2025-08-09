import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageErrorEventData, NativeSyntheticEvent } from 'react-native';
import Colors from '../../constants/Colors';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fallback?: string;
    style?: any;
}

const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
    if (!avatarPath || avatarPath === 'null' || avatarPath.trim() === '') {
        return null;
    }

    // If it's already a full URL, return as is
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
    }

    // If it starts with /uploads/avatars/, it's already a full path, just add the base URL
    if (avatarPath.startsWith('/uploads/avatars/')) {
        const baseUrl = 'http://192.168.0.15:6075';
        return `${baseUrl}${avatarPath}`;
    }

    // For relative paths (just filename), construct the full URL
    const baseUrl = 'http://192.168.0.15:6075';
    const url = `${baseUrl}/uploads/avatars/${avatarPath}`;
    return url;
};

const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'User avatar',
    size = 'md',
    fallback = '👤',
    style
}) => {
    const [imageError, setImageError] = useState(false);

    const sizeStyles = {
        sm: { width: 32, height: 32, fontSize: 12 },
        md: { width: 48, height: 48, fontSize: 16 },
        lg: { width: 64, height: 64, fontSize: 24 },
        xl: { width: 96, height: 96, fontSize: 32 }
    };

    const avatarUrl = getAvatarUrl(src);

    // If no URL or image failed to load, show fallback
    if (!avatarUrl || imageError) {
        return (
            <View style={[styles.fallback, sizeStyles[size], style]}>
                <Text style={[styles.fallbackText, { fontSize: sizeStyles[size].fontSize }]}>
                    {fallback}
                </Text>
            </View>
        );
    }

    return (
        <Image
            source={{ uri: avatarUrl }}
            style={[styles.image, sizeStyles[size], style]}
            onError={(e: NativeSyntheticEvent<ImageErrorEventData>) => {
                setImageError(true);
            }}
            onLoad={() => {
            }}
        />
    );
};

const styles = StyleSheet.create({
    image: {
        borderRadius: 999, // Makes it circular
        backgroundColor: Colors.light.backgroundSecondary,
    },
    fallback: {
        borderRadius: 999,
        backgroundColor: '#3B82F6', // Blue background for users without avatars
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackText: {
        color: Colors.light.textInverse, // White text on blue background
        fontWeight: 'bold',
    },
});

export default Avatar;

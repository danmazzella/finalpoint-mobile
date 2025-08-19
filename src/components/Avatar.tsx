import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ImageErrorEventData, NativeSyntheticEvent } from 'react-native';
import { getBaseUrl } from '../services/apiService';

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

    // Get base URL from API service
    const baseUrl = getBaseUrl();
    // If it starts with /uploads/avatars/, it's already a full path, just add the base URL
    if (avatarPath.startsWith('/uploads/avatars/')) {
        const fullUrl = `${baseUrl}${avatarPath}`;
        return fullUrl;
    }

    // For relative paths (just filename), construct the full URL
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
        sm: { width: 36, height: 36, fontSize: 20 },
        md: { width: 48, height: 48, fontSize: 24 },
        lg: { width: 64, height: 64, fontSize: 32 },
        xl: { width: 96, height: 96, fontSize: 40 }
    };

    const avatarUrl = getAvatarUrl(src);

    // Debug logging
    useEffect(() => {
        if (src) {
            // console.log('Avatar component - src:', src);
            // console.log('Avatar component - constructed URL:', avatarUrl);
        }
    }, [src, avatarUrl]);

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
                console.error('Avatar image load error:', e.nativeEvent);
                console.error('Failed URL:', avatarUrl);
                setImageError(true);
            }}
            onLoad={() => {
                setImageError(false);
            }}
        />
    );
};

const styles = StyleSheet.create({
    image: {
        borderRadius: 999, // Makes it circular
        backgroundColor: '#ffffff',
    },
    fallback: {
        borderRadius: 999,
        backgroundColor: '#3B82F6', // Blue background for users without avatars
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackText: {
        color: '#ffffff', // White text on blue background
        fontWeight: 'bold',
    },
    debugText: {
        color: '#ffffff', // White text on blue background
        fontSize: 12,
        marginTop: 5,
    },
});

export default Avatar;

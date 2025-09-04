import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface FeatureFlagContextType {
    isChatFeatureEnabled: boolean;
    isLoading: boolean;
    refreshFlags: () => Promise<void>;
    getAllFlags: () => Record<string, any>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

interface FeatureFlagProviderProps {
    children: ReactNode;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isChatFeatureEnabled, setIsChatFeatureEnabled] = useState(false);
    const { user } = useAuth();

    const refreshFlags = useCallback(async () => {
        try {
            // The user profile data is already loaded in AuthContext
            // We just need to update our local state based on the current user data
            if (user?.chatFeatureEnabled !== undefined) {
                setIsChatFeatureEnabled(user.chatFeatureEnabled);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('❌ Failed to refresh mobile feature flags:', error);
        }
    }, [user]);

    const getAllFlags = () => {
        return {
            chat_feature_enabled: isChatFeatureEnabled
        };
    };

    // Update chat feature status when user changes
    useEffect(() => {
        console.log('🔍 FeatureFlagContext: User changed:', {
            user: !!user,
            chatFeatureEnabled: user?.chatFeatureEnabled,
            userType: typeof user?.chatFeatureEnabled,
            userId: user?.id
        });

        if (user?.chatFeatureEnabled !== undefined) {
            console.log('✅ FeatureFlagContext: Setting chat feature enabled to:', user.chatFeatureEnabled);
            setIsChatFeatureEnabled(user.chatFeatureEnabled);
            setIsLoading(false);
        } else if (user === null) {
            // User is not logged in
            console.log('❌ FeatureFlagContext: User not logged in, disabling chat feature');
            setIsChatFeatureEnabled(false);
            setIsLoading(false);
        } else if (user && user.chatFeatureEnabled === undefined) {
            // User is logged in but chatFeatureEnabled is undefined - this might be cached data
            console.log('⚠️ FeatureFlagContext: User logged in but chatFeatureEnabled is undefined - waiting for fresh data');
            // Keep loading state true to wait for fresh user data
        }
        // If user is undefined, we're still loading, so keep isLoading true
    }, [user]);

    // Add a timeout to handle cases where feature flags don't load properly
    useEffect(() => {
        if (isLoading && user) {
            const timeout = setTimeout(() => {
                console.log('⚠️ FeatureFlagContext: Timeout reached, forcing refresh of flags');
                refreshFlags();
            }, 5000); // 5 second timeout

            return () => clearTimeout(timeout);
        }
    }, [isLoading, user, refreshFlags]);

    const value: FeatureFlagContextType = {
        isChatFeatureEnabled,
        isLoading,
        refreshFlags,
        getAllFlags,
    };

    return (
        <FeatureFlagContext.Provider value={value}>
            {children}
        </FeatureFlagContext.Provider>
    );
};

export const useFeatureFlags = (): FeatureFlagContextType => {
    const context = useContext(FeatureFlagContext);
    if (context === undefined) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }
    return context;
};

// Convenience hook for chat feature specifically
export const useChatFeature = () => {
    const { isChatFeatureEnabled, isLoading } = useFeatureFlags();
    return { isChatFeatureEnabled, isLoading };
};

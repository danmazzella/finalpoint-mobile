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
        if (user?.chatFeatureEnabled !== undefined) {
            setIsChatFeatureEnabled(user.chatFeatureEnabled);
            setIsLoading(false);
        } else if (user === null) {
            // User is not logged in
            setIsChatFeatureEnabled(false);
            setIsLoading(false);
        }
        // If user is undefined, we're still loading, so keep isLoading true
    }, [user]);

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

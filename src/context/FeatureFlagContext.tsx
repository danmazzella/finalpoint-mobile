import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface FeatureFlagContextType {
    isChatFeatureEnabled: boolean;
    isPositionChangesEnabled: boolean;
    isMultiPositionPicksEnabled: boolean;
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
    const [isPositionChangesEnabled, setIsPositionChangesEnabled] = useState(false);
    const [isMultiPositionPicksEnabled, setIsMultiPositionPicksEnabled] = useState(false);
    const { user } = useAuth();

    const refreshFlags = useCallback(async () => {
        try {
            // The user profile data is already loaded in AuthContext
            // We just need to update our local state based on the current user data
            if (user) {
                let flagsSet = 0;

                if (user.chatFeatureEnabled !== undefined) {
                    setIsChatFeatureEnabled(user.chatFeatureEnabled);
                    flagsSet++;
                }

                if (user.positionChangesEnabled !== undefined) {
                    setIsPositionChangesEnabled(user.positionChangesEnabled);
                    flagsSet++;
                }

                if (user.multiPositionPicksEnabled !== undefined) {
                    setIsMultiPositionPicksEnabled(user.multiPositionPicksEnabled);
                    flagsSet++;
                }

                // If we got at least one flag or user is defined, we can stop loading
                if (flagsSet > 0 || user.id) {
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error('❌ Failed to refresh mobile feature flags:', error);
        }
    }, [user]);

    const getAllFlags = () => {
        return {
            chat_feature_enabled: isChatFeatureEnabled,
            position_changes_enabled: isPositionChangesEnabled,
            multi_position_picks_enabled: isMultiPositionPicksEnabled,
        };
    };

    // Update feature flags when user changes
    useEffect(() => {
        console.log('🔍 FeatureFlagContext: User changed:', {
            user: !!user,
            chatFeatureEnabled: user?.chatFeatureEnabled,
            positionChangesEnabled: user?.positionChangesEnabled,
            userType: typeof user?.chatFeatureEnabled,
            userId: user?.id
        });

        if (user === null) {
            // User is not logged in
            console.log('❌ FeatureFlagContext: User not logged in, disabling all features');
            setIsChatFeatureEnabled(false);
            setIsPositionChangesEnabled(false);
            setIsMultiPositionPicksEnabled(false);
            setIsLoading(false);
        } else if (user) {
            // User is logged in - handle each flag independently
            let flagsSet = 0;
            const totalFlags = 3;

            if (user.chatFeatureEnabled !== undefined) {
                console.log('✅ FeatureFlagContext: Setting chat feature flag:', user.chatFeatureEnabled);
                setIsChatFeatureEnabled(user.chatFeatureEnabled);
                flagsSet++;
            } else {
                console.log('⚠️ FeatureFlagContext: chatFeatureEnabled is undefined, keeping current value');
            }

            if (user.positionChangesEnabled !== undefined) {
                console.log('✅ FeatureFlagContext: Setting position changes flag:', user.positionChangesEnabled);
                setIsPositionChangesEnabled(user.positionChangesEnabled);
                flagsSet++;
            } else {
                console.log('⚠️ FeatureFlagContext: positionChangesEnabled is undefined, keeping current value');
            }

            if (user.multiPositionPicksEnabled !== undefined) {
                console.log('✅ FeatureFlagContext: Setting multi position picks flag:', user.multiPositionPicksEnabled);
                setIsMultiPositionPicksEnabled(user.multiPositionPicksEnabled);
                flagsSet++;
            } else {
                console.log('⚠️ FeatureFlagContext: multiPositionPicksEnabled is undefined, keeping current value');
            }

            // If we got at least one flag or user is defined, we can stop loading
            if (flagsSet > 0 || user.id) {
                console.log(`✅ FeatureFlagContext: Set ${flagsSet}/${totalFlags} flags, stopping loading`);
                setIsLoading(false);
            } else {
                console.log('⚠️ FeatureFlagContext: No flags set and no user ID, keeping loading state');
            }
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
        isPositionChangesEnabled,
        isMultiPositionPicksEnabled,
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

// Convenience hook for position changes feature specifically
export const usePositionChanges = () => {
    const { isPositionChangesEnabled, isLoading } = useFeatureFlags();
    return { isPositionChangesEnabled, isLoading };
};

// Convenience hook for multi-position picks feature
export const useMultiPositionPicks = () => {
    const { isMultiPositionPicksEnabled, isLoading } = useFeatureFlags();
    return { isMultiPositionPicksEnabled, isLoading };
};

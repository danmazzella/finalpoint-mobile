import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { useFeatureFlags } from './FeatureFlagContext';
import { chatAPI } from '../services/apiService';

interface UnreadCountContextType {
    unreadCounts: { [leagueId: number]: number };
    isLoading: boolean;
    refreshUnreadCounts: () => Promise<void>;
    getUnreadCount: (leagueId: number) => number;
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined);

interface UnreadCountProviderProps {
    children: ReactNode;
}

export const UnreadCountProvider: React.FC<UnreadCountProviderProps> = ({ children }) => {
    const [unreadCounts, setUnreadCounts] = useState<{ [leagueId: number]: number }>({});
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const { isChatFeatureEnabled } = useFeatureFlags();

    const refreshUnreadCounts = useCallback(async () => {
        if (!user || !isChatFeatureEnabled) {
            setUnreadCounts({});
            return;
        }

        try {
            setIsLoading(true);
            const response = await chatAPI.getAllUnreadCounts();

            if (response.data.success) {
                const counts: { [leagueId: number]: number } = {};
                response.data.unreadCounts.forEach((item: { leagueId: number; unreadCount: number }) => {
                    counts[item.leagueId] = item.unreadCount;
                });
                setUnreadCounts(counts);
            }
        } catch (error) {
            console.error('Error refreshing unread counts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, isChatFeatureEnabled]);

    const getUnreadCount = useCallback((leagueId: number): number => {
        return unreadCounts[leagueId] || 0;
    }, [unreadCounts]);

    // Auto-refresh unread counts when app becomes active
    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'active' && user && isChatFeatureEnabled) {
                refreshUnreadCounts();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Initial load
        if (user && isChatFeatureEnabled) {
            refreshUnreadCounts();
        }

        return () => subscription?.remove();
    }, [user, isChatFeatureEnabled, refreshUnreadCounts]);

    const value: UnreadCountContextType = {
        unreadCounts,
        isLoading,
        refreshUnreadCounts,
        getUnreadCount,
    };

    return (
        <UnreadCountContext.Provider value={value}>
            {children}
        </UnreadCountContext.Provider>
    );
};

export const useUnreadCounts = (): UnreadCountContextType => {
    const context = useContext(UnreadCountContext);
    if (context === undefined) {
        throw new Error('useUnreadCounts must be used within an UnreadCountProvider');
    }
    return context;
};

// Analytics utility functions for mobile using Firebase Analytics

import { isExpoGo, isWebBrowser } from './environment';

export const analyticsUtils = {
    // Log custom events
    logEvent: async (eventName: string, parameters?: Record<string, any>) => {
        try {
            // Skip analytics in Expo Go or web browser
            if (isExpoGo() || isWebBrowser()) {
                console.log(`📊 Analytics Event (Expo Go/Web): ${eventName}`, parameters);
                return;
            }

            // Dynamic import to avoid issues in Expo Go
            const { logEvent: firebaseLogEvent } = await import('firebase/analytics');
            const { analytics } = await import('../config/firebase');

            if (analytics) {
                firebaseLogEvent(analytics, eventName, parameters);
            } else {
                // Fallback to console logging when analytics is not available
                console.log(`📊 Analytics Event (fallback): ${eventName}`, parameters);
            }
        } catch (error) {
            console.error('❌ Firebase Analytics error:', error);
            // Fallback to console logging
            console.log(`📊 Analytics Event (error fallback): ${eventName}`, parameters);
        }
    },

    // Set user properties
    setUserProperties: async (properties: Record<string, any>) => {
        try {
            // Skip analytics in Expo Go or web browser
            if (isExpoGo() || isWebBrowser()) {
                console.log('📊 Analytics User Properties (Expo Go/Web):', properties);
                return;
            }

            // Dynamic import to avoid issues in Expo Go
            const { setUserProperties: firebaseSetUserProperties } = await import('firebase/analytics');
            const { analytics } = await import('../config/firebase');

            if (analytics) {
                firebaseSetUserProperties(analytics, properties);
            } else {
                // Fallback to console logging when analytics is not available
                console.log('Analytics User Properties:', properties);
            }
        } catch (error) {
            console.error('Firebase Analytics error:', error);
            // Fallback to console logging
            console.log('Analytics User Properties:', properties);
        }
    },

    // Set user ID
    setUserId: async (userId: string) => {
        try {
            // Skip analytics in Expo Go or web browser
            if (isExpoGo() || isWebBrowser()) {
                console.log('📊 Analytics User ID (Expo Go/Web):', userId);
                return;
            }

            // Dynamic import to avoid issues in Expo Go
            const { setUserId: firebaseSetUserId } = await import('firebase/analytics');
            const { analytics } = await import('../config/firebase');

            if (analytics) {
                firebaseSetUserId(analytics, userId);
            } else {
                // Fallback to console logging when analytics is not available
                console.log('Analytics User ID:', userId);
            }
        } catch (error) {
            console.error('Firebase Analytics error:', error);
            // Fallback to console logging
            console.log('Analytics User ID:', userId);
        }
    },

    // Common events
    screenView: (screenName: string, screenClass?: string) => {
        analyticsUtils.logEvent('screen_view', {
            screen_name: screenName,
            screen_class: screenClass || screenName
        });
    },

    login: (method: string) => {
        analyticsUtils.logEvent('login', { method });
    },

    signUp: (method: string) => {
        analyticsUtils.logEvent('sign_up', { method });
    },

    buttonPress: (buttonName: string, screen?: string) => {
        analyticsUtils.logEvent('button_press', {
            button_name: buttonName,
            screen: screen || 'unknown'
        });
    },

    search: (searchTerm: string) => {
        analyticsUtils.logEvent('search', {
            search_term: searchTerm
        });
    },

    // League-specific events
    leagueJoin: (leagueId: string, leagueName: string) => {
        analyticsUtils.logEvent('league_join', {
            league_id: leagueId,
            league_name: leagueName
        });
    },

    leagueCreate: (leagueId: string, leagueName: string) => {
        analyticsUtils.logEvent('league_create', {
            league_id: leagueId,
            league_name: leagueName
        });
    },

    raceResultView: (leagueId: string, week: number) => {
        analyticsUtils.logEvent('race_result_view', {
            league_id: leagueId,
            week: week
        });
    },

    notificationReceived: (type: string, source?: string) => {
        analyticsUtils.logEvent('notification_received', {
            notification_type: type,
            source: source || 'unknown'
        });
    },

    notificationOpened: (type: string, source?: string) => {
        analyticsUtils.logEvent('notification_opened', {
            notification_type: type,
            source: source || 'unknown'
        });
    }
};

// Hook for easier usage in React components
export const useAnalytics = () => {
    return analyticsUtils;
};
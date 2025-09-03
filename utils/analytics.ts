// Analytics utility functions for mobile using Firebase Analytics

import { logEvent as firebaseLogEvent, setUserProperties as firebaseSetUserProperties, setUserId as firebaseSetUserId } from 'firebase/analytics';
import { analytics } from '../config/firebase';

export const analyticsUtils = {
    // Log custom events
    logEvent: (eventName: string, parameters?: Record<string, any>) => {
        try {
            firebaseLogEvent(analytics, eventName, parameters);
        } catch (error) {
            console.error('Firebase Analytics error:', error);
            // Fallback to console logging
            console.log('Analytics Event:', eventName, parameters);
        }
    },

    // Set user properties
    setUserProperties: (properties: Record<string, any>) => {
        try {
            firebaseSetUserProperties(analytics, properties);
        } catch (error) {
            console.error('Firebase Analytics error:', error);
            // Fallback to console logging
            console.log('Analytics User Properties:', properties);
        }
    },

    // Set user ID
    setUserId: (userId: string) => {
        try {
            firebaseSetUserId(analytics, userId);
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
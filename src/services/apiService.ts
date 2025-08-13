import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PickV2, NotificationPreferences } from '../types';

// API URL configuration
const getApiBaseUrl = () => {
    // Use environment variable if available, otherwise fall back to hardcoded values
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Fallback for development vs production
    return __DEV__ ? 'http://192.168.0.15:6075' : 'https://api.finalpoint.app';
};

const API_BASE_URL = getApiBaseUrl();

console.log(process.env);
console.log('API_BASE_URL', API_BASE_URL);

export const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
    timeoutErrorMessage: 'Request timed out. Please try again.',
});

// Request interceptor to add auth token
apiService.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
apiService.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Enhanced error logging
        if (error.response) {
            // Server responded with error status
            console.error('API Error Response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                url: error.config?.url,
                data: error.response.data
            });
        } else if (error.request) {
            // Request was made but no response received
            console.error('API No Response:', {
                url: error.config?.url,
                message: 'No response received from server'
            });
            // Add network error code for better error handling
            error.code = 'NETWORK_ERROR';
        } else {
            // Something else happened
            console.error('API Request Error:', {
                message: error.message,
                url: error.config?.url
            });
        }

        // Handle specific error types
        if (error.response?.status === 401) {
            // Token expired or invalid, clear storage
            console.log('🔒 401 Unauthorized, clearing auth data');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        } else if (error.response?.status === 403) {
            console.log('🚫 403 Forbidden - Access denied');
        } else if (error.response?.status === 404) {
            console.log('🔍 404 Not Found - Endpoint or resource not found');
        } else if (error.response?.status === 429) {
            console.log('⏰ 429 Too Many Requests - Rate limited');
        } else if (error.response?.status >= 500) {
            console.log('💥 Server Error - Backend issue');
        }

        return Promise.reject(error);
    }
);

// API methods
export const authAPI = {
    login: (email: string, password: string) =>
        apiService.post('/users/login', { email, password }),
    signup: (email: string, password: string, name: string) =>
        apiService.post('/users/signup', { email, password, name }),
    forgotPassword: (email: string) =>
        apiService.post('/users/forgot-password', { email }),
    resetPassword: (token: string, newPassword: string) =>
        apiService.post('/users/reset-password', { token, newPassword }),
    deleteAccount: (data: { password: string }) =>
        apiService.delete('/users/account', { data }),
    getUserStats: () => apiService.get('/users/stats'),
    getGlobalStats: () => apiService.get('/users/global-stats'),
    getMonthlyStats: () => apiService.get('/users/monthly-stats'),
    updateProfile: (data: { name: string }) => apiService.put('/users/profile', data),
    updateAvatar: (data: FormData) => apiService.put('/users/avatar', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        apiService.put('/users/password', data),
};

export const adminAPI = {
    getDashboardStats: () => apiService.get('/admin/dashboard-stats'),
    getAllUsers: () => apiService.get('/admin/users'),
    updateUserRole: (userId: number, role: 'user' | 'admin') =>
        apiService.put(`/admin/users/${userId}/role`, { role }),
    getAllLeagues: () => apiService.get('/admin/leagues'),
    getPickStatsByWeek: () => apiService.get('/admin/pick-stats-by-week'),
};

export const leaguesAPI = {
    getLeagues: () => apiService.get('/leagues/get'),
    createLeague: (name: string, positions: number[] = []) =>
        apiService.post('/leagues/create', { name, positions }),
    getLeague: (leagueId: number) => apiService.get(`/leagues/get/${leagueId}`),
    joinLeague: (leagueId: number) => apiService.post(`/leagues/${leagueId}/join`),
    joinByCode: (joinCode: string) => apiService.post('/leagues/join-by-code', { joinCode }),
    getLeagueByCode: (joinCode: string) => apiService.get(`/leagues/code/${joinCode}`),
    getLeagueMembers: (leagueId: number) => apiService.get(`/leagues/${leagueId}/members`),
    getLeagueStandings: (leagueId: number) => apiService.get(`/leagues/${leagueId}/standings`),
    getDetailedLeagueStandings: (leagueId: number) =>
        apiService.get(`/leagues/${leagueId}/standings/detailed`),
    getLeagueStats: (leagueId: number) => apiService.get(`/leagues/${leagueId}/stats`),
    updateLeague: (leagueId: number, name: string) =>
        apiService.put(`/leagues/${leagueId}`, { name }),
    deleteLeague: (leagueId: number) => apiService.delete(`/leagues/${leagueId}`),
    leaveLeague: (leagueId: number) => apiService.post(`/leagues/${leagueId}/leave`),
};

export const picksAPI = {
    // Legacy methods for backward compatibility
    makePick: (leagueId: number, weekNumber: number, driverId: number) =>
        apiService.post('/picks/make', { leagueId, weekNumber, driverId }),
    getUserPicks: (leagueId: number) => apiService.get(`/picks/user/${leagueId}`),
    getLeaguePicks: (leagueId: number, weekNumber: number) =>
        apiService.get(`/picks/league/${leagueId}/week/${weekNumber}`),
    getRaceResults: (leagueId: number, weekNumber: number) =>
        apiService.get(`/picks/results/${leagueId}/week/${weekNumber}`),

    // New V2 methods for multiple position support
    makePickV2: (leagueId: number, weekNumber: number, picks: PickV2[]) =>
        apiService.post('/picks/make-v2', { leagueId, weekNumber, picks }),
    removePickV2: (leagueId: number, weekNumber: number, position: number) =>
        apiService.post('/picks/remove-v2', { leagueId, weekNumber, position }),
    getUserPicksV2: (leagueId: number) => apiService.get(`/picks/user/${leagueId}/v2`),
    getLeaguePicksV2: (leagueId: number, weekNumber: number) =>
        apiService.get(`/picks/league/${leagueId}/week/${weekNumber}/v2`),
    getRaceResultsV2: (leagueId: number, weekNumber: number) =>
        apiService.get(`/picks/results/${leagueId}/week/${weekNumber}/v2`),

    // New V2 result views
    getResultsByPositionV2: (leagueId: number, weekNumber: number, position: number) =>
        apiService.get(`/picks/results/${leagueId}/week/${weekNumber}/position/${position}/v2`),
    getMemberPicksV2: (leagueId: number, weekNumber: number, userId: number) =>
        apiService.get(`/picks/results/${leagueId}/week/${weekNumber}/member/${userId}/v2`),

    // League position management
    getLeaguePositions: (leagueId: number) => apiService.get(`/picks/league/${leagueId}/positions`),
    updateLeaguePositions: (leagueId: number, positions: number[]) =>
        apiService.put(`/picks/league/${leagueId}/positions`, { positions }),
};

export const driversAPI = {
    getDrivers: () => apiService.get('/drivers/get'),
};

export const f1racesAPI = {
    getCurrentRace: () => apiService.get('/f1races/current'),
    getAllRaces: (seasonYear = 2025) => apiService.get(`/f1races/all?seasonYear=${seasonYear}`),
    getRaceByWeek: (weekNumber: number, seasonYear = 2025) =>
        apiService.get(`/f1races/week/${weekNumber}?seasonYear=${seasonYear}`),
    populateSeason: () => apiService.post('/f1races/populate-season'),
};

export const activityAPI = {
    getLeagueActivity: (leagueId: number, limit = 20) =>
        apiService.get(`/activity/league/${leagueId}?limit=${limit}`),
    getRecentActivity: (leagueId: number, limit = 10) =>
        apiService.get(`/activity/league/${leagueId}/recent?limit=${limit}`),
};

export const notificationsAPI = {
    getPreferences: () => apiService.get('/notifications/preferences'),
    updatePreferences: (preferences: NotificationPreferences) =>
        apiService.put('/notifications/preferences', preferences),
    registerPushToken: (token: string, platform: 'web' | 'ios' | 'android') =>
        apiService.post('/notifications/push-token', { token, platform }),
    unregisterPushToken: (token: string) =>
        apiService.delete('/notifications/push-token', { data: { token } }),
    getHistory: (page = 1, limit = 20) =>
        apiService.get(`/notifications/history?page=${page}&limit=${limit}`),
    testEmail: () => apiService.post('/notifications/test', { type: 'email' }),
    testPush: () => apiService.post('/notifications/test', { type: 'push' }),
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiService, authAPI } from '../services/apiService';
import { User } from '../types';


interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticating: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    loginWithGoogle: (googleData: { accessToken: string; userInfo: any }) => Promise<{ success: boolean; message?: string; error?: string }>;
    signup: (email: string, password: string, name: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    logout: () => Promise<void>;
    validateToken: () => Promise<boolean>;
    updateAvatar: (avatar: FormData) => Promise<boolean>;
    refreshUser: () => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
    updateProfile: (name: string) => Promise<boolean>;
    forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    registerPushToken: () => Promise<boolean>;
    deleteAccount: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    try {
        const context = useContext(AuthContext);
        if (!context) {
            // Return a more complete default context instead of throwing
            return {
                user: null,
                isLoading: true,
                login: async () => ({ success: false, error: 'Context not available' }),
                loginWithGoogle: async () => ({ success: false, error: 'Context not available' }),
                signup: async () => ({ success: false, error: 'Context not available' }),
                logout: async () => { },
                validateToken: async () => false,
                updateAvatar: async () => false,
                refreshUser: async () => { },
                changePassword: async () => false,
                updateProfile: async () => false,
                forgotPassword: async () => ({ success: false, error: 'Context not available' }),
                resetPassword: async () => ({ success: false, error: 'Context not available' }),
                deleteAccount: async () => false,
                registerPushToken: async () => false,
            };
        }
        return context;
    } catch (error) {
        console.error('Error in useAuth:', error);
        // Return default values if there's any error
        return {
            user: null,
            isLoading: true,
            isAuthenticating: false,
            login: async () => ({ success: false, error: 'Context not available' }),
            loginWithGoogle: async () => ({ success: false, error: 'Context not available' }),
            signup: async () => ({ success: false, error: 'Context not available' }),
            logout: async () => { },
            validateToken: async () => false,
            updateAvatar: async () => false,
            refreshUser: async () => { },
            changePassword: async () => false,
            updateProfile: async () => false,
            forgotPassword: async () => ({ success: false, error: 'Context not available' }),
            resetPassword: async () => ({ success: false, error: 'Context not available' }),
            deleteAccount: async () => false,
            registerPushToken: async () => false,
        };
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        // Simple initialization without immediate API calls
        const initializeAuth = async () => {
            try {
                setIsLoading(true);
                const [storedUser, storedToken] = await Promise.all([
                    AsyncStorage.getItem('user'),
                    AsyncStorage.getItem('token')
                ]);

                if (storedUser && storedToken) {
                    try {
                        const userData = JSON.parse(storedUser);
                        setUser(userData);

                        // Auto-register push token for existing authenticated users
                        try {
                            const { registerForPushNotificationsAsync, sendPushTokenToServer } = await import('../../utils/notifications');
                            const pushToken = await registerForPushNotificationsAsync();
                            if (pushToken) {
                                await sendPushTokenToServer(pushToken, Platform.OS);
                            }
                        } catch (pushError) {
                            console.error('Could not auto-register push token for existing user:', pushError);
                            // Don't fail auth initialization if push token registration fails
                        }
                    } catch (parseError) {
                        console.error('Error parsing stored user data:', parseError);
                        await clearStoredAuth();
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const validateToken = async (): Promise<boolean> => {
        try {
            // Make a simple API call to validate the token
            const response = await apiService.get('/users/stats');
            return response && response.status === 200;
        } catch (error: any) {
            console.error('Token validation error:', error);
            return false;
        }
    };

    const clearStoredAuth = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem('user'),
                AsyncStorage.removeItem('token')
            ]);
        } catch (error) {
            console.error('Error clearing stored auth:', error);
        }
    };

    const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            setIsAuthenticating(true);
            // Don't set isLoading to true here as it can trigger redirects in the layout
            // setIsLoading(true);

            // Prepare login data with optional push token
            const loginData: any = { email, password };

            // Try to get push token for mobile devices (only when notifications are enabled)
            try {
                const { registerForPushNotificationsAsync } = await import('../../utils/notifications');
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken) {
                    loginData.pushToken = pushToken;
                    loginData.platform = Platform.OS;
                }
            } catch (pushError) {
                console.error('Could not get push token during login (will register later):', pushError);
                // Continue with login even if push token registration fails
            }

            const response = await apiService.post('/users/login', loginData);

            if (response.data.success) {
                const userData = response.data.user;
                setUser(userData);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                await AsyncStorage.setItem('token', response.data.token);

                // Register push token with server after successful login
                if (loginData.pushToken) {
                    try {
                        const { sendPushTokenToServer } = await import('../../utils/notifications');
                        await sendPushTokenToServer(loginData.pushToken, loginData.platform);
                    } catch (pushError) {
                        console.error('❌ Failed to register push token with server:', pushError);
                        // Don't fail login if push token registration fails
                    }
                }

                return { success: true, message: 'Login successful!' };
            }
            // Handle API error response structure
            if (response.data.errors && response.data.errors.length > 0) {
                // ErrorClass format: { errors: [{ reason, message }] }
                const errorMessage = response.data.errors[0].message;
                return { success: false, error: errorMessage };
            } else if (response.data.error) {
                // Fallback for other error formats
                return { success: false, error: response.data.error };
            } else {
                return { success: false, error: 'Login failed. Invalid credentials or server error.' };
            }
        } catch (error: any) {
            console.error('Login error:', error);

            // Handle specific error types
            if (error.response?.status === 400) {
                return { success: false, error: error.response.data.error || 'Invalid request. Please check your input.' };
            } else if (error.response?.status === 401) {
                return { success: false, error: 'Invalid credentials. Please check your email and password.' };
            } else if (error.response?.status === 403) {
                return { success: false, error: 'Account locked or suspended. Please contact support.' };
            } else if (error.response?.status === 429) {
                return { success: false, error: 'Too many login attempts. Please try again later.' };
            } else if (error.response?.status === 500) {
                return { success: false, error: 'Server error. Please try again later.' };
            } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                return { success: false, error: 'Network error. Please check your internet connection.' };
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                return { success: false, error: 'Request timed out. Please try again.' };
            } else if (error.message?.includes('Failed to fetch')) {
                return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
            } else {
                return { success: false, error: error.response?.data?.error || 'Login failed. An unexpected error occurred.' };
            }
        } finally {
            // Set isAuthenticating to false immediately after login attempt completes
            setIsAuthenticating(false);
            // Don't set isLoading to false here since we never set it to true
        }
    };

    const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            setIsAuthenticating(true);
            // Don't set isLoading to true here as it can trigger redirects in the layout
            // setIsLoading(true);

            // Prepare signup data with optional push token
            const signupData: any = { email, password, name };

            // Try to get push token for mobile devices (only when notifications are enabled)
            try {
                const { registerForPushNotificationsAsync } = await import('../../utils/notifications');
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken) {
                    signupData.pushToken = pushToken;
                    signupData.platform = Platform.OS;
                }
            } catch (pushError) {
                console.error('Could not get push token during signup (will register later):', pushError);
                // Continue with signup even if push token registration fails
            }

            const response = await apiService.post('/users/signup', signupData);

            if (response.data.success) {
                const userData = response.data.user;
                setUser(userData);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                await AsyncStorage.setItem('token', response.data.token);

                // Register push token with server after successful signup
                if (signupData.pushToken) {
                    try {
                        const { sendPushTokenToServer } = await import('../../utils/notifications');
                        await sendPushTokenToServer(signupData.pushToken, signupData.platform);

                    } catch (pushError) {
                        console.error('❌ Failed to register push token with server:', pushError);
                        // Don't fail signup if push token registration fails
                    }
                }

                return { success: true, message: 'Signup successful!' };
            }
            // Handle API error response structure
            if (response.data.errors && response.data.errors.length > 0) {
                // ErrorClass format: { errors: [{ reason, message }] }
                const errorMessage = response.data.errors[0].message;
                return { success: false, error: errorMessage };
            } else if (response.data.error) {
                // Fallback for other error formats
                return { success: false, error: response.data.error };
            } else {
                return { success: false, error: 'Signup failed. Invalid credentials or server error.' };
            }
        } catch (error: any) {
            console.error('Signup error:', error);

            // Handle specific error types
            if (error.response?.status === 400) {
                const errorMessage = error.response.data.error || 'Invalid request';
                if (errorMessage.includes('email') && errorMessage.includes('already')) {
                    return { success: false, error: 'An account with this email already exists. Please try logging in instead.' };
                } else if (errorMessage.includes('username') && errorMessage.includes('already')) {
                    return { success: false, error: 'This username is already taken. Please choose a different one.' };
                } else if (errorMessage.includes('password')) {
                    return { success: false, error: 'Password does not meet requirements. Please check the requirements below.' };
                } else if (errorMessage.includes('validation')) {
                    return { success: false, error: 'Please check your input and try again.' };
                } else {
                    return { success: false, error: errorMessage };
                }
            } else if (error.response?.status === 409) {
                return { success: false, error: 'Account already exists. Please try logging in instead.' };
            } else if (error.response?.status === 422) {
                return { success: false, error: 'Invalid data provided. Please check your input.' };
            } else if (error.response?.status === 500) {
                return { success: false, error: 'Server error. Please try again later.' };
            } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                return { success: false, error: 'Network error. Please check your internet connection.' };
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                return { success: false, error: 'Request timed out. Please try again.' };
            } else if (error.message?.includes('Failed to fetch')) {
                return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
            } else {
                return { success: false, error: error.response?.data?.error || 'Signup failed. An unexpected error occurred.' };
            }
        } finally {
            // Set isAuthenticating to false immediately after signup attempt completes
            setIsAuthenticating(false);
            // Don't set isLoading to false here since we never set it to true
        }
    };

    const logout = async () => {
        try {
            // Set user to null immediately for instant UI update
            setUser(null);
            // Clear stored auth data in background (don't block UI)
            clearStoredAuth().catch(error => {
                console.error('Logout error:', error);
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateAvatar = async (avatar: FormData): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await apiService.put('/users/avatar', avatar, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success && user) {
                // Don't strip the avatar path - the backend returns the correct format
                const avatarUrl = response.data.avatar;
                const updatedUser = { ...user, avatar: avatarUrl };
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Update avatar error:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        try {
            const [storedUser, storedToken] = await Promise.all([
                AsyncStorage.getItem('user'),
                AsyncStorage.getItem('token')
            ]);

            if (storedUser && storedToken) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                } catch (parseError) {
                    console.error('Error parsing stored user data during refresh:', parseError);
                    await clearStoredAuth();
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
            setUser(null);
        }
    };

    const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await apiService.put('/users/password', { currentPassword, newPassword });
            if (response.data.success) {
                await refreshUser(); // Refresh user to update token if it was changed
                return true;
            }
            return false;
        } catch (error) {
            console.error('Change password error:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (name: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await apiService.put('/users/profile', { name });
            if (response.data.success) {
                const updatedUser = user ? { ...user, name } : null;
                setUser(updatedUser);
                if (updatedUser) {
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Update profile error:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            const response = await authAPI.forgotPassword(email);
            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message || 'If there is an account associated with that email, you will receive a password reset link shortly.'
                };
            }
            // Handle API error response structure
            if (response.data.errors && response.data.errors.length > 0) {
                // ErrorClass format: { errors: [{ reason, message }] }
                const errorMessage = response.data.errors[0].message;
                return { success: false, error: errorMessage };
            } else if (response.data.error) {
                // Fallback for other error formats
                return { success: false, error: response.data.error };
            } else {
                return { success: false, error: 'Failed to send password reset email. Please try again.' };
            }
        } catch (error: any) {
            console.error('Forgot password error:', error);

            // Handle specific error types
            if (error.response?.status === 400) {
                const errorMessage = error.response.data.error || 'Invalid request';
                if (errorMessage.includes('email') && errorMessage.includes('not found')) {
                    return { success: false, error: 'No account found with this email address.' };
                } else if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
                    return { success: false, error: 'Please enter a valid email address.' };
                } else {
                    return { success: false, error: errorMessage };
                }
            } else if (error.response?.status === 429) {
                return { success: false, error: 'Too many reset attempts. Please try again later.' };
            } else if (error.response?.status === 500) {
                return { success: false, error: 'Server error. Please try again later.' };
            } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                return { success: false, error: 'Network error. Please check your internet connection.' };
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                return { success: false, error: 'Request timed out. Please try again.' };
            } else if (error.message?.includes('Failed to fetch')) {
                return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
            } else {
                return { success: false, error: error.response?.data?.error || 'Failed to send password reset email. Please try again.' };
            }
        }
    };

    const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            const response = await authAPI.resetPassword(token, newPassword);
            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message || 'Password reset successful! You can now log in with your new password.'
                };
            }
            // Handle API error response structure
            if (response.data.errors && response.data.errors.length > 0) {
                // ErrorClass format: { errors: [{ reason, message }] }
                const errorMessage = response.data.errors[0].message;
                return { success: false, error: errorMessage };
            } else if (response.data.error) {
                // Fallback for other error formats
                return { success: false, error: response.data.error };
            } else {
                return { success: false, error: 'Failed to reset password. The link may have expired.' };
            }
        } catch (error: any) {
            console.error('Reset password error:', error);

            // Handle specific error types
            if (error.response?.status === 400) {
                const errorMessage = error.response.data.error || 'Invalid request';
                if (errorMessage.includes('token') && errorMessage.includes('invalid')) {
                    return { success: false, error: 'Invalid or expired reset token. Please request a new password reset.' };
                } else if (errorMessage.includes('password')) {
                    return { success: false, error: 'Password does not meet requirements. Please check the requirements.' };
                } else {
                    return { success: false, error: errorMessage };
                }
            } else if (error.response?.status === 401) {
                return { success: false, error: 'Reset token has expired. Please request a new password reset.' };
            } else if (error.response?.status === 404) {
                return { success: false, error: 'Reset token not found. Please request a new password reset.' };
            } else if (error.response?.status === 500) {
                return { success: false, error: 'Server error. Please try again later.' };
            } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                return { success: false, error: 'Network error. Please check your internet connection.' };
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                return { success: false, error: 'Request timed out. Please try again.' };
            } else if (error.message?.includes('Failed to fetch')) {
                return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
            } else {
                return { success: false, error: error.response?.data?.error || 'Failed to reset password. The link may have expired.' };
            }
        }
    };

    const registerPushToken = async (): Promise<boolean> => {
        try {
            const { registerForPushNotificationsAsync, sendPushTokenToServer } = await import('../../utils/notifications');
            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
                await sendPushTokenToServer(pushToken, Platform.OS as 'ios' | 'android');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error registering push token:', error);
            return false;
        }
    };

    const deleteAccount = async (password: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await apiService.delete('/users/account', { data: { password } });
            if (response.data.success) {
                // Clear user data and storage
                setUser(null);
                await clearStoredAuth();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Delete account error:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async (googleData: { accessToken: string; userInfo: any }): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            setIsAuthenticating(true);
            // Don't set isLoading to true here as it can trigger redirects in the layout
            // setIsLoading(true);

            // Prepare Google login data with optional push token
            const loginData: any = {
                googleAccessToken: googleData.accessToken,
                email: googleData.userInfo.email,
                name: googleData.userInfo.name,
                googleId: googleData.userInfo.id,
                avatar: googleData.userInfo.picture
            };

            // Always set platform for Google Sign-In
            loginData.platform = Platform.OS;

            // Try to get push token for mobile devices
            try {
                const { registerForPushNotificationsAsync } = await import('../../utils/notifications');
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken) {
                    loginData.pushToken = pushToken;
                }
            } catch (pushError) {
                console.error('Could not get push token during Google login (will register later):', pushError);
            }



            // Prepare the request payload
            const requestPayload = {
                idToken: googleData.accessToken,
                pushToken: loginData.pushToken,
                platform: loginData.platform
            };



            const response = await apiService.post('/users/google-auth', requestPayload);

            if (response.data.success) {
                const userData = response.data.user;
                setUser(userData);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                await AsyncStorage.setItem('token', response.data.token);

                // Register push token with server after successful Google login
                if (loginData.pushToken) {
                    try {
                        const { sendPushTokenToServer } = await import('../../utils/notifications');
                        await sendPushTokenToServer(loginData.pushToken, loginData.platform);
                    } catch (pushError) {
                        console.error('❌ Failed to register push token with server:', pushError);
                    }
                }

                return { success: true, message: 'Google login successful!' };
            }
            // Handle API error response structure
            if (response.data.errors && response.data.errors.length > 0) {
                // ErrorClass format: { errors: [{ reason, message }] }
                const errorMessage = response.data.errors[0].message;
                return { success: false, error: errorMessage };
            } else if (response.data.error) {
                // Fallback for other error formats
                return { success: false, error: response.data.error };
            } else {
                return { success: false, error: 'Google login failed. Please try again.' };
            }
        } catch (error: any) {
            console.error('Google login error:', error);

            // Log detailed error information
            if (error.response) {
                console.error('📥 Backend response error:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                console.error('📥 No response received:', error.request);
            } else {
                console.error('📥 Request setup error:', error.message);
            }

            // Handle specific error types
            if (error.response?.status === 400) {
                // Handle API error response structure
                let errorMessage = 'Invalid request';
                if (error.response.data.errors && error.response.data.errors.length > 0) {
                    // ErrorClass format: { errors: [{ reason, message }] }
                    errorMessage = error.response.data.errors[0].message;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                }

                if (errorMessage.includes('token') || errorMessage.includes('invalid')) {
                    return { success: false, error: 'Invalid Google token. Please try signing in again.' };
                } else if (errorMessage.includes('email')) {
                    return { success: false, error: 'Email verification failed. Please try again.' };
                } else {
                    return { success: false, error: errorMessage };
                }
            } else if (error.response?.status === 401) {
                return { success: false, error: 'Google authentication failed. Please try again.' };
            } else if (error.response?.status === 403) {
                return { success: false, error: 'Access denied. Please check your Google account permissions.' };
            } else if (error.response?.status === 409) {
                return { success: false, error: 'Account already exists with different login method. Please use email/password login.' };
            } else if (error.response?.status === 500) {
                return { success: false, error: 'Server error. Please try again later.' };
            } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                return { success: false, error: 'Network error. Please check your internet connection.' };
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                return { success: false, error: 'Request timed out. Please try again.' };
            } else if (error.message?.includes('Failed to fetch')) {
                return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
            } else {
                // Handle API error response structure in catch block
                if (error.response?.data?.errors && error.response.data.errors.length > 0) {
                    const errorMessage = error.response.data.errors[0].message;
                    return { success: false, error: errorMessage };
                } else if (error.response?.data?.error) {
                    return { success: false, error: error.response.data.error };
                } else {
                    return { success: false, error: 'Google login failed. An unexpected error occurred.' };
                }
            }
        } finally {
            // Set isAuthenticating to false immediately after Google login attempt completes
            setIsAuthenticating(false);
            // Don't set isLoading to false here since we never set it to true
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticating,
        login,
        loginWithGoogle,
        signup,
        logout,
        validateToken,
        updateAvatar,
        refreshUser,
        changePassword,
        updateProfile,
        forgotPassword,
        resetPassword,
        registerPushToken,
        deleteAccount,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

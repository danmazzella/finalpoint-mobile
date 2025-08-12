import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiService, authAPI } from '../services/apiService';
import { User } from '../types';


interface AuthContextType {
    user: User | null;
    isLoading: boolean;
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
            };
        }
        return context;
    } catch (error) {
        console.error('Error in useAuth:', error);
        // Return default values if there's any error
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
        };
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                        console.log('✅ Auth initialized with stored user data');

                        // Auto-register push token for existing authenticated users
                        try {
                            const { registerForPushNotificationsAsync, sendPushTokenToServer } = await import('../../utils/notifications');
                            const pushToken = await registerForPushNotificationsAsync();
                            if (pushToken) {
                                await sendPushTokenToServer(pushToken, Platform.OS);
                                console.log('✅ Push token auto-registered for existing user');
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
                    console.log('ℹ️ No stored auth data found - user needs to login');
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
                console.log('✅ Auth initialization complete');
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
            setIsLoading(true);

            // Prepare login data with optional push token
            const loginData: any = { email, password };

            // Try to get push token for mobile devices (only when notifications are enabled)
            try {
                const { registerForPushNotificationsAsync } = await import('../../utils/notifications');
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken) {
                    loginData.pushToken = pushToken;
                    loginData.platform = Platform.OS;
                    console.log(`📱 Including ${Platform.OS} push token in login request`);
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
                        console.log('✅ Push token registered with server after login');
                    } catch (pushError) {
                        console.error('❌ Failed to register push token with server:', pushError);
                        // Don't fail login if push token registration fails
                    }
                }

                return { success: true, message: 'Login successful!' };
            }
            return { success: false, error: response.data.error || 'Login failed. Invalid credentials or server error.' };
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, error: error.response?.data?.error || 'Login failed. An unexpected error occurred.' };
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            setIsLoading(true);

            // Prepare signup data with optional push token
            const signupData: any = { email, password, name };

            // Try to get push token for mobile devices (only when notifications are enabled)
            try {
                const { registerForPushNotificationsAsync } = await import('../../utils/notifications');
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken) {
                    signupData.pushToken = pushToken;
                    signupData.platform = Platform.OS;
                    console.log(`📱 Including ${Platform.OS} push token in signup request`);
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
                        console.log('✅ Push token registered with server after signup');
                    } catch (pushError) {
                        console.error('❌ Failed to register push token with server:', pushError);
                        // Don't fail signup if push token registration fails
                    }
                }

                return { success: true, message: 'Signup successful!' };
            }
            return { success: false, error: response.data.error || 'Signup failed. Invalid credentials or server error.' };
        } catch (error: any) {
            console.error('Signup error:', error);
            return { success: false, error: error.response?.data?.error || 'Signup failed. An unexpected error occurred.' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            setUser(null);
            await clearStoredAuth();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoading(false);
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
                // Extract filename from the backend response URL
                const avatarUrl = response.data.avatar;
                const filename = avatarUrl ? avatarUrl.split('/').pop() : null;

                const updatedUser = { ...user, avatar: filename };
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
            return {
                success: false,
                error: response.data.error || 'Failed to send password reset email. Please try again.'
            };
        } catch (error: any) {
            console.error('Forgot password error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to send password reset email. Please try again.'
            };
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
            return {
                success: false,
                error: response.data.error || 'Failed to reset password. The link may have expired.'
            };
        } catch (error: any) {
            console.error('Reset password error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to reset password. The link may have expired.'
            };
        }
    };

    const registerPushToken = async (): Promise<boolean> => {
        try {
            const { registerForPushNotificationsAsync, sendPushTokenToServer } = await import('../../utils/notifications');
            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
                await sendPushTokenToServer(pushToken, Platform.OS as 'ios' | 'android');
                console.log('✅ Push token registered with server');
                return true;
            }
            console.log('ℹ️ No push token available to register.');
            return false;
        } catch (error) {
            console.error('Error registering push token:', error);
            return false;
        }
    };

    const loginWithGoogle = async (googleData: { accessToken: string; userInfo: any }): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            setIsLoading(true);

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
            console.log(`📱 Platform set to: ${Platform.OS}`);

            // Try to get push token for mobile devices
            try {
                const { registerForPushNotificationsAsync } = await import('../../utils/notifications');
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken) {
                    loginData.pushToken = pushToken;
                    console.log(`📱 Including ${Platform.OS} push token in Google login request`);
                } else {
                    console.log('⚠️ No push token received from registerForPushNotificationsAsync');
                }
            } catch (pushError) {
                console.error('Could not get push token during Google login (will register later):', pushError);
            }

            console.log('🔍 Final loginData before request:', {
                pushToken: loginData.pushToken,
                platform: loginData.platform,
                platformType: typeof loginData.platform,
                PlatformOS: Platform.OS
            });

            // Prepare the request payload
            const requestPayload = {
                idToken: googleData.accessToken,
                pushToken: loginData.pushToken,
                platform: loginData.platform
            };

            console.log('📤 Sending Google auth request:', {
                endpoint: '/users/google-auth',
                payload: requestPayload,
                hasIdToken: !!googleData.accessToken,
                hasPushToken: !!loginData.pushToken,
                platform: loginData.platform
            });

            const response = await apiService.post('/users/google-auth', requestPayload);

            if (response.data.success) {
                const userData = response.data.user;
                setUser(userData);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                await AsyncStorage.setItem('token', response.data.token);

                console.log('✅ Google authentication successful:', response.data.message);

                // Register push token with server after successful Google login
                if (loginData.pushToken) {
                    try {
                        const { sendPushTokenToServer } = await import('../../utils/notifications');
                        await sendPushTokenToServer(loginData.pushToken, loginData.platform);
                        console.log('✅ Push token registered with server after Google login');
                    } catch (pushError) {
                        console.error('❌ Failed to register push token with server:', pushError);
                    }
                }

                return { success: true, message: 'Google login successful!' };
            }
            return { success: false, error: response.data.error || 'Google login failed. Please try again.' };
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

            return { success: false, error: error.response?.data?.error || 'Google login failed. An unexpected error occurred.' };
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        user,
        isLoading,
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
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

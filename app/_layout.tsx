import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, usePathname } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, AppState, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SimpleToastProvider, useSimpleToast } from '../src/context/SimpleToastContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../src/context/ThemeContext';
import { FeatureFlagProvider, useFeatureFlags } from '../src/context/FeatureFlagContext';
import { UnreadCountProvider } from '../src/context/UnreadCountContext';
import { lightColors, darkColors } from '../src/constants/Colors';

import { NotificationProvider } from '../components/NotificationProvider';
import ScreenTracker from '../components/ScreenTracker';

import SimpleToast from '../components/SimpleToast';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { shouldEnableNotifications, logEnvironmentInfo } from '../utils/environment';

// Custom screen transition configuration for Android
const getScreenOptions = (theme: string) => ({
  headerShown: false,
  header: () => null,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  animation: 'slide_from_right' as const,
  animationDuration: Platform.OS === 'android' ? 300 : 250,
  contentStyle: {
    backgroundColor: theme === 'dark' ? darkColors.backgroundPrimary : lightColors.backgroundPrimary,
  },
  // iOS-specific gesture handling
  fullScreenGestureEnabled: true,
  // Use card presentation for better Android compatibility
  presentation: 'card' as const,
  // Prevent white flash during transitions
  cardStyle: {
    backgroundColor: theme === 'dark' ? darkColors.backgroundPrimary : lightColors.backgroundPrimary,
  },
});

// Helper function to get screen options with proper background
const getScreenOptionsWithBackground = (theme: string, additionalOptions: any = {}) => ({
  headerShown: false,
  presentation: 'card',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  contentStyle: {
    backgroundColor: theme === 'dark' ? darkColors.backgroundPrimary : lightColors.backgroundPrimary,
  },
  cardStyle: {
    backgroundColor: theme === 'dark' ? darkColors.backgroundPrimary : lightColors.backgroundPrimary,
  },
  ...additionalOptions,
});

// Conditionally initialize Firebase configuration
// Only initialize Firebase in native environments (iOS/Android)
// Web browsers don't support Firebase Cloud Messaging and can cause errors
if (shouldEnableNotifications() && Platform.OS !== 'web') {
  // console.log('🔑 Initializing Firebase...');
  import('../config/firebase');
} else {
  // console.log('🚫 Firebase disabled in Expo Go or web browser');
}

// Log environment information
logEnvironmentInfo();

function AppContent() {
  const { user, isLoading, isAuthenticating } = useAuth();
  const { toast, hideToast } = useSimpleToast();
  const { resolvedTheme } = useTheme();
  const { isChatFeatureEnabled } = useFeatureFlags();
  const pathname = usePathname();

  // Notification handlers (only active when notifications are enabled)
  const handleNotificationReceived = useCallback(async (notification: any) => {
    if (!shouldEnableNotifications()) return;

    // Clear badge when notification is received while app is running
    try {
      const { clearBadgeAsync } = await import('../utils/notifications');
      await clearBadgeAsync();
    } catch (error) {
      console.error('Error clearing badge:', error);
    }

    // You can show a toast or update UI here
  }, []);

  const handleNotificationResponse = useCallback(async (response: any) => {
    if (!shouldEnableNotifications()) return;

    // Clear badge when user responds to notification
    try {
      const { clearBadgeAsync } = await import('../utils/notifications');
      await clearBadgeAsync();
    } catch (error) {
      console.error('Error clearing badge:', error);
    }

    // Handle navigation or actions when user taps notification
    const { notification } = response;
    if (notification.request.content.data) {
      // Handle specific notification data
      const data = notification.request.content.data;
      if (data.type === 'race_reminder' && data.raceId) {
        // Navigate to race or picks screen
        router.push(`/race-results?raceId=${data.raceId}`);
      } else if (data.type === 'score_update' && data.leagueId) {
        // Navigate to league standings
        router.push(`/league/${data.leagueId}/standings`);
      } else if (data.type === 'chat_message' && data.leagueId) {
        // Navigate to league chat only if feature is enabled
        if (isChatFeatureEnabled) {
          router.push(`/chat/${data.leagueId}`);
        } else {
          // Fallback to league detail page if chat is disabled
          router.push(`/league/${data.leagueId}`);
        }
      }
    }
  }, [isChatFeatureEnabled]);

  // Only set up notification listeners when notifications are enabled
  useEffect(() => {
    if (!shouldEnableNotifications()) {
      return;
    }

    let receivedSubscription: any;
    let responseSubscription: any;

    // Import notification functions only when needed
    const setupNotifications = async () => {
      try {
        const { addNotificationReceivedListener, addNotificationResponseReceivedListener } = await import('../utils/notifications');

        receivedSubscription = addNotificationReceivedListener(handleNotificationReceived);
        responseSubscription = addNotificationResponseReceivedListener(handleNotificationResponse);
      } catch (error) {
        console.error('Could not set up notification listeners:', error);
      }
    };

    setupNotifications();

    // Cleanup function - this will be called when the component unmounts
    return () => {
      if (receivedSubscription?.remove) {
        receivedSubscription.remove();
      }
      if (responseSubscription?.remove) {
        responseSubscription.remove();
      }
    };
  }, [handleNotificationReceived, handleNotificationResponse]);

  // Clear badge when app becomes active
  useEffect(() => {
    if (!shouldEnableNotifications()) return;

    const clearBadgeOnAppActive = async () => {
      try {
        const { getAndClearBadgeAsync } = await import('../utils/notifications');
        await getAndClearBadgeAsync();
        // Badge cleared successfully
      } catch (error) {
        console.error('Error clearing badge on app active:', error);
      }
    };

    // Clear badge immediately when component mounts (app is active)
    clearBadgeOnAppActive();

    // Also clear badge when app comes to foreground
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        clearBadgeOnAppActive();

        // Also try smart clearing for dismissed notifications
        try {
          const { smartClearBadgeAsync } = await import('../utils/notifications');
          await smartClearBadgeAsync();
        } catch (error) {
          console.error('Error in smart badge clearing on app active:', error);
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    // Prevent redirects when on auth pages or when authentication is in progress
    if (pathname === '/login' || pathname === '/signup') {
      return;
    }

    if (isAuthenticating) {
      return;
    }

    if (isLoading) {
      return;
    }

    // Allow unauthenticated users to access main app routes
    // This enables the unauthenticated views we want
    if (!user) {
      // Don't redirect to login - let them explore the app
      return;
    }
  }, [user, isLoading, isAuthenticating, pathname]);

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: resolvedTheme === 'dark' ? darkColors.backgroundPrimary : lightColors.backgroundPrimary
      }}>
        {/* Loading screen */}
      </View>
    );
  }

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBarWrapper style="dark">
        <ScreenTracker />
        <View style={{
          flex: 1,
          backgroundColor: resolvedTheme === 'dark' ? darkColors.backgroundPrimary : lightColors.backgroundPrimary
        }}>
          <Stack
            screenOptions={{
              ...getScreenOptions(resolvedTheme),
              // Global background to prevent any white flashes
              contentStyle: {
                backgroundColor: resolvedTheme === 'dark' ? darkColors.backgroundPrimary : lightColors.backgroundPrimary,
              },
              // Smooth transitions
              animation: 'slide_from_right',
              animationDuration: Platform.OS === 'android' ? 300 : 250,
              // Prevent white flash during transitions
              presentation: 'card',
            }}
          >
            {/* Main app routes - accessible to both authenticated and unauthenticated users */}
            <Stack.Screen
              name="(tabs)"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="+not-found"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="activity"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="admin"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="notifications"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="race-results"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="position-results"
              options={({ route }) => getScreenOptionsWithBackground(resolvedTheme, {
                // Dynamic animation based on navigation direction
                animation: (route.params as any)?._direction === 'backward' ? 'slide_from_left' : 'slide_from_right',
                animationDuration: 300,
              })}
            />
            <Stack.Screen
              name="member-picks"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="stats"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="league/[id]"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="join-league"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="change-password"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="edit-profile"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="delete-account"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />
            <Stack.Screen
              name="forgot-password"
              options={getScreenOptionsWithBackground(resolvedTheme)}
            />

            {/* Auth screens - always accessible */}
            <Stack.Screen
              name="login"
              options={getScreenOptionsWithBackground(resolvedTheme, {
                presentation: 'modal',
              })}
            />
            <Stack.Screen
              name="signup"
              options={getScreenOptionsWithBackground(resolvedTheme, {
                presentation: 'modal',
              })}
            />
          </Stack>
        </View>
      </StatusBarWrapper>

      {/* Toast Component - rendered outside StatusBarWrapper to avoid layout warnings */}
      <SimpleToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onHide={hideToast}
        duration={toast.duration}
      />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  return <AppContent />;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [providersReady, setProvidersReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure providers are initialized
    const timer = setTimeout(() => {

      setProvidersReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded || !providersReady) {
    // Async font loading only occurs in development.
    return null;
  }


  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SimpleToastProvider>
          <AppThemeProvider>
            <FeatureFlagProvider>
              <UnreadCountProvider>
                {shouldEnableNotifications() ? (
                  <NotificationProvider
                    autoRegister={false}
                    onNotificationReceived={(notification) => {
                      // console.log('Notification received globally:', notification);
                    }}
                    onNotificationResponse={(response) => {
                      // console.log('Notification response globally:', response);
                    }}
                  >
                    <RootLayoutNav />
                  </NotificationProvider>
                ) : (
                  <RootLayoutNav />
                )}
              </UnreadCountProvider>
            </FeatureFlagProvider>
          </AppThemeProvider>
        </SimpleToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

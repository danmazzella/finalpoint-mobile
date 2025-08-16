import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, AppState } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SimpleToastProvider, useSimpleToast } from '../src/context/SimpleToastContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { NotificationProvider } from '../components/NotificationProvider';

import SimpleToast from '../components/SimpleToast';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { shouldEnableNotifications, logEnvironmentInfo } from '../utils/environment';

// Custom screen transition configuration for Android
const getScreenOptions = (colorScheme: string | null | undefined) => ({
  headerShown: false,
  header: () => null,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  animation: 'slide_from_right' as const,
  animationDuration: Platform.OS === 'android' ? 300 : 250,
  contentStyle: {
    backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#f9fafb',
  },
  // iOS-specific gesture handling
  fullScreenGestureEnabled: true,
  // Use card presentation for better Android compatibility
  presentation: 'card' as const,
});

// Conditionally initialize Firebase configuration
if (shouldEnableNotifications()) {
  // console.log('🔑 Initializing Firebase...');
  import('../config/firebase');
} else {
  // console.log('🚫 Firebase disabled in Expo Go');
}

// Log environment information
logEnvironmentInfo();

function AppContent() {
  const { user, isLoading, isAuthenticating } = useAuth();
  const { toast, hideToast } = useSimpleToast();
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  // Notification handlers (only active when notifications are enabled)
  const handleNotificationReceived = async (notification: any) => {
    if (!shouldEnableNotifications()) return;

    // Clear badge when notification is received while app is running
    try {
      const { clearBadgeAsync } = await import('../utils/notifications');
      await clearBadgeAsync();
    } catch (error) {
      console.error('Error clearing badge:', error);
    }

    // You can show a toast or update UI here
  };

  const handleNotificationResponse = async (response: any) => {
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
      }
    }
  };

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
  }, []);

  // Clear badge when app becomes active
  useEffect(() => {
    if (!shouldEnableNotifications()) return;

    const clearBadgeOnAppActive = async () => {
      try {
        const { getAndClearBadgeAsync } = await import('../utils/notifications');
        const badgeCount = await getAndClearBadgeAsync();
        // if (badgeCount > 0) {
        //   console.log(`Cleared ${badgeCount} notification badges`);
        // }
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

    if (user) {
      return;
    }

    // If we get here, we need to redirect to login
    if (!user) {
      router.replace('/login');
    }
  }, [user, isLoading, isAuthenticating, pathname]);

  if (isLoading) {
    return null; // Show loading screen
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBarWrapper style="dark">
        <Stack
          screenOptions={getScreenOptions(colorScheme)}
        >
          {user ? (
            // Authenticated user - show main app
            <>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen name="+not-found" />
              <Stack.Screen
                name="activity"
                options={{
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="admin"
                options={{
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="notifications"
                options={{
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="race-results"
                options={{
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="position-results"
                options={({ route }) => ({
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                  // Dynamic animation based on navigation direction
                  animation: (route.params as any)?._direction === 'backward' ? 'slide_from_left' : 'slide_from_right',
                  animationDuration: 300,
                  // Fix for Android white screen issue
                  contentStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#f9fafb',
                  },
                })}
              />
              <Stack.Screen
                name="member-picks"
                options={{
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="league"
                options={{
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="join-league"
                options={{
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="change-password"
                options={{
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="edit-profile"
                options={{
                  headerShown: false,
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />

            </>
          ) : (
            // Not authenticated - show auth screens
            <>
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                  header: () => null,
                  presentation: 'modal',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
              <Stack.Screen
                name="signup"
                options={{
                  headerShown: false,
                  header: () => null,
                  presentation: 'modal',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                }}
              />
            </>
          )}
        </Stack>
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
    <SafeAreaProvider style={{ backgroundColor: '#f9fafb' }}>
      <AuthProvider>
        <SimpleToastProvider>
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
        </SimpleToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

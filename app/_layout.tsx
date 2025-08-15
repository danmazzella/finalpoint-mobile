import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SimpleToastProvider, useSimpleToast } from '../src/context/SimpleToastContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { NotificationProvider } from '../components/NotificationProvider';

import SimpleToast from '../components/SimpleToast';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { shouldEnableNotifications, logEnvironmentInfo } from '../utils/environment';

// Conditionally initialize Firebase configuration
if (shouldEnableNotifications()) {
  console.log('🔑 Initializing Firebase...');
  import('../config/firebase');
} else {
  console.log('🚫 Firebase disabled in Expo Go');
}

// Log environment information
logEnvironmentInfo();

function AppContent() {
  const { user, isLoading, isAuthenticating } = useAuth();
  const { toast, hideToast } = useSimpleToast();
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  // Notification handlers (only active when notifications are enabled)
  const handleNotificationReceived = (notification: any) => {
    if (!shouldEnableNotifications()) return;

    console.log('Notification received while app is running:', notification);
    // You can show a toast or update UI here
  };

  const handleNotificationResponse = (response: any) => {
    if (!shouldEnableNotifications()) return;

    console.log('User tapped notification:', response);
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
          screenOptions={{
            headerShown: false,
            header: () => null,
          }}
        >
          {user ? (
            // Authenticated user - show main app
            <>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
              <Stack.Screen name="activity" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="race-results" options={{ headerShown: false }} />
              <Stack.Screen name="position-results" options={{ headerShown: false }} />
              <Stack.Screen name="member-picks" options={{ headerShown: false }} />
              <Stack.Screen name="league" options={{ headerShown: false }} />
              <Stack.Screen name="join-league" options={{ headerShown: false }} />
              <Stack.Screen name="change-password" options={{ headerShown: false }} />
              <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            </>
          ) : (
            // Not authenticated - show auth screens
            <>
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                  header: () => null,
                  presentation: 'modal'
                }}
              />
              <Stack.Screen
                name="signup"
                options={{
                  headerShown: false,
                  header: () => null,
                  presentation: 'modal'
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
    <SafeAreaProvider>
      <AuthProvider>
        <SimpleToastProvider>
          {shouldEnableNotifications() ? (
            <NotificationProvider
              autoRegister={false}
              onNotificationReceived={(notification) => {
                console.log('Notification received globally:', notification);
              }}
              onNotificationResponse={(response) => {
                console.log('Notification response globally:', response);
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

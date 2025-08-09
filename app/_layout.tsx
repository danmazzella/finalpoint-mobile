import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ToastProvider, useToast } from '../src/context/ToastContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Toast from '../components/Toast';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { toast, hideToast } = useToast();
  const colorScheme = useColorScheme();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return null; // Show loading screen
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="light" backgroundColor={Platform.OS === 'android' ? '#007bff' : undefined} />
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

      {/* Toast Component */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
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
        <ToastProvider>
          <RootLayoutNav />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

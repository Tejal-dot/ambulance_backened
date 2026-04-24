import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BookingProvider } from '@/contexts/BookingContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/lib/trpc';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      router.replace('/welcome');
    } else if (user && !inAuthGroup && segments[0] !== 'booking' && segments[0] !== 'hospitals' && segments[0] !== 'emergency-contacts' && segments[0] !== 'bookings' && segments[0] !== 'profile') {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="booking/new" options={{ headerShown: false }} />
      <Stack.Screen name="booking/tracking" options={{ headerShown: false }} />
      <Stack.Screen name="hospitals" options={{ headerShown: false }} />
      <Stack.Screen name="emergency-contacts" options={{ headerShown: false }} />
      <Stack.Screen name="bookings" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BookingProvider>
            <RootLayoutNav />
          </BookingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

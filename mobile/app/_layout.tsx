import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import '../src/global.css';
import { useAuthStore } from '../src/stores';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, userRole } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const currentPath = segments[0];

    if (!currentPath) return;

    const isAuthRoute = ['login', 'register'].includes(currentPath);

    if (isAuthRoute) {
      if (userRole === 'farmer') {
        router.replace('/dashboard');
      } else if (userRole === 'investor') {
        router.replace('/marketplace');
      }
      return;
    }
  }, [isAuthenticated, userRole, segments]);

  return (
    <>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="marketplace" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="property/[id]" />
        <Stack.Screen name="chat/index" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="contracts/index" />
        <Stack.Screen name="contracts/[id]" />
        <Stack.Screen name="listings/index" />
        <Stack.Screen name="listings/create" />
        <Stack.Screen name="updates/[contractId]" />
        <Stack.Screen name="deliveries" />
        <Stack.Screen name="disputes" />
        <Stack.Screen name="reviews" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({});

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return <RootLayoutNav />;
}

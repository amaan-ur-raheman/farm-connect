import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/stores';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, userRole, isRegistrationComplete } = useAuthStore();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const isNavigating = useRef(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (isNavigating.current) return;
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

        if (!hasSeenOnboarding) {
          // First time user - show onboarding
          isNavigating.current = true;
          router.replace('/onboarding');
        } else if (!isAuthenticated) {
          // Returning user but not logged in
          isNavigating.current = true;
          router.replace('/login');
        } else if (!isRegistrationComplete) {
          // User logged in via OTP but didn't complete registration
          isNavigating.current = true;
          if (userRole === 'consumer') {
            router.replace('/register/preferences-investor');
          } else {
            router.replace('/register/preferences-farmer');
          }
        } else {
          // Returning user and fully registered
          isNavigating.current = true;
          router.replace('/(tabs)/dashboard');
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        isNavigating.current = true;
        router.replace('/login');
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [isAuthenticated, userRole, isRegistrationComplete, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fbf9' }}>
      <ActivityIndicator size="large" color="#4cae4f" />
    </View>
  );
}

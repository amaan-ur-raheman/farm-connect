import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/stores';
import { shouldSkipNotifications, getNotificationsModule } from '../src/utils/notifications';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuthStore();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        
        if (!hasSeenOnboarding) {
          // First time user - show onboarding
          router.replace('/onboarding');
        } else if (!isAuthenticated) {
          // Returning user but not logged in
          router.replace('/login');
        } else {
          // Returning user and logged in
          router.replace('/(tabs)/dashboard');
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        router.replace('/login');
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [isAuthenticated, userRole, router]);

  // Deep linking handler for notifications
  useEffect(() => {
    if (shouldSkipNotifications) return;
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;
      if (data.screen) {
        const screen = data.screen as string;
        const id = data.id as string;

        setTimeout(() => {
          switch (screen) {
            case 'chat': router.push(`/chat/${id}`); break;
            case 'contract': router.push(`/contracts/${id}`); break;
            case 'delivery': router.push('/deliveries'); break;
            case 'dispute': router.push('/disputes'); break;
            case 'update': router.push(`/updates/${id}`); break;
            case 'notification': router.push('/notifications'); break;
            default: router.push('/notifications');
          }
        }, 100);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fbf9' }}>
      <ActivityIndicator size="large" color="#4cae4f" />
    </View>
  );
}

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../src/stores';
import { shouldSkipNotifications, getNotificationsModule } from '../src/utils/notifications';

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isAuthenticated, userRole } = useAuthStore();

  useEffect(() => {
    // Wait until navigation is ready
    const unsubscribe = navigation.addListener('state', () => {
      // Navigation is definitely ready here
    });

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      const target = userRole === 'farmer' ? '/dashboard' : '/investor-dashboard';
      router.replace(target as any);
    }, 500); // Robust delay to ensure context is established

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [isAuthenticated, userRole, navigation]);

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
        
        const timer = setTimeout(() => {
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
        return () => clearTimeout(timer);
      }
    });

    return () => subscription.remove();
  }, []);

  return null;
}

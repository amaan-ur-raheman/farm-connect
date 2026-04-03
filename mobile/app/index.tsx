import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/stores';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (userRole === 'farmer') {
      router.replace('/dashboard');
    } else if (userRole === 'investor') {
      router.replace('/investor-dashboard');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, userRole]);

  return null;
}

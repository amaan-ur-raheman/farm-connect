import { router } from 'expo-router';

export function safeGoBack(fallbackRoute: string = '/marketplace') {
  try {
    router.back();
  } catch {
    router.replace(fallbackRoute);
  }
}

export function safeNavigate(route: string) {
  try {
    router.push(route);
  } catch {
    console.warn('Navigation failed:', route);
  }
}

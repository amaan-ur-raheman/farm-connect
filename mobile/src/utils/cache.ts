import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@farmconnect_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export const cache = {
  // Get cached data
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const { data, timestamp, ttl }: CacheEntry = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > ttl;

      if (isExpired) {
        await cache.remove(key);
        return null;
      }

      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Set cache data
  set: async (key: string, data: any, ttl: number = DEFAULT_TTL): Promise<void> => {
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  // Remove cached data
  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  // Clear all cache
  clear: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },
};

// Cache keys for different API endpoints
export const CACHE_KEYS = {
  LISTINGS: 'listings',
  CONTRACTS: 'contracts',
  USER_PROFILE: 'user_profile',
  WALLET: 'wallet',
  NOTIFICATIONS: 'notifications',
};

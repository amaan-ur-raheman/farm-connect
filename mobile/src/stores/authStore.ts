import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { AuthUser } from '../config/api';

export type UserRole = 'investor' | 'farmer' | null;

const mapBackendRoleToMobile = (backendRole: string): UserRole => {
  if (backendRole === 'FARMER') return 'farmer';
  if (backendRole === 'CONSUMER') return 'investor';
  return null;
};

const mapMobileRoleToBackend = (mobileRole: UserRole): string | null => {
  if (mobileRole === 'farmer') return 'FARMER';
  if (mobileRole === 'investor') return 'CONSUMER';
  return null;
};

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  accessToken: string | null;
  refreshToken: string | null;
  phone: string | null;
  authUser: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  setAuthenticated: (isAuthenticated: boolean) => void;
  setUserRole: (role: UserRole) => void;
  loginWithOtp: (phone: string, otp: string) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<boolean>;
  refreshTokens: () => Promise<string | null>;
  logout: () => Promise<void>;
  clearError: () => void;
  setPhone: (phone: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userRole: null,
      accessToken: null,
      refreshToken: null,
      phone: null,
      authUser: null,
      isLoading: false,
      error: null,

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      setUserRole: (userRole) => set({ userRole }),

      setPhone: (phone) => set({ phone }),

      sendOtp: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/auth/otp/send', { phone });
          set({ isLoading: false, phone });
          return true;
        } catch (err: any) {
          const message = err.response?.data?.message || err.message || 'Failed to send OTP';
          set({ isLoading: false, error: message });
          return false;
        }
      },

      loginWithOtp: async (phone: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/auth/otp/verify', { phone, otp });
          const { user, accessToken, refreshToken } = response.data.data;

          const mobileRole = mapBackendRoleToMobile(user.role);

          set({
            isAuthenticated: true,
            userRole: mobileRole,
            accessToken,
            refreshToken,
            phone,
            authUser: user,
            isLoading: false,
          });
          return true;
        } catch (err: any) {
          const message = err.response?.data?.message || err.message || 'Invalid OTP';
          set({ isLoading: false, error: message });
          return false;
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;

        try {
          const response = await api.post('/api/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          set({ accessToken, refreshToken: newRefreshToken });
          return accessToken;
        } catch {
          set({
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            phone: null,
            authUser: null,
          });
          return null;
        }
      },

      logout: async () => {
        const { accessToken } = get();
        try {
          if (accessToken) {
            await api.post('/api/auth/logout', {}, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
          }
        } catch {
          // ignore logout API errors
        } finally {
          set({
            isAuthenticated: false,
            userRole: null,
            accessToken: null,
            refreshToken: null,
            phone: null,
            authUser: null,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        phone: state.phone,
        authUser: state.authUser,
      }),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { AuthUser } from '../config/api';
import { useAuthStore } from './authStore';

export interface UserProfile extends AuthUser {
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface WalletInfo {
  balance: number;
  currency: string;
}

export interface InvestorPreferences {
  investmentRange: string;
  investmentGoals: string[];
  preferredFarmTypes: string[];
}

export interface FarmerPreferences {
  farmSize: string;
  farmType: string;
  cropsGrown: string[];
  irrigationType: string;
}

interface UserState {
  profile: UserProfile | null;
  wallet: WalletInfo;
  holdings: {
    totalAcres: number;
    totalProperties: number;
  };
  investorPreferences: InvestorPreferences | null;
  farmerPreferences: FarmerPreferences | null;
  isProfileComplete: boolean;
  isLoading: boolean;

  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  fetchWallet: () => Promise<void>;
  fetchHoldings: () => Promise<void>;
  setInvestorPreferences: (preferences: InvestorPreferences) => void;
  setFarmerPreferences: (preferences: FarmerPreferences) => void;
  setProfileComplete: (isComplete: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      wallet: {
        balance: 0,
        currency: 'INR',
      },
      holdings: {
        totalAcres: 0,
        totalProperties: 0,
      },
      investorPreferences: null,
      farmerPreferences: null,
      isProfileComplete: false,
      isLoading: false,

      fetchProfile: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get<{ data: AuthUser }>('/api/users/me');
          const user = response.data.data;
          const nameParts = (user.name || '').trim().split(' ');
          set({
            profile: {
              ...user,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              avatar: user.avatar_url ?? undefined,
            },
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      })),

      fetchWallet: async () => {
        try {
          const response = await api.get<{ data: { balance: number; currency: string } }>('/api/wallet/balance');
          const data = response.data.data;
          set({
            wallet: {
              balance: data.balance || 0,
              currency: data.currency || 'INR',
            },
          });
        } catch {
          // ignore wallet errors
        }
      },

      fetchHoldings: async () => {
        try {
          const userRole = useAuthStore.getState().userRole;
          const endpoint = userRole === 'investor'
            ? '/api/contracts/consumer'
            : '/api/contracts/farmer';
          const response = await api.get<{ data: unknown[] }>(endpoint);
          const contracts = response.data.data || [];
          set({
            holdings: {
              totalProperties: contracts.length,
              totalAcres: contracts.reduce((sum: number, c: any) => sum + (c.listing?.area_acres || 0), 0),
            },
          });
        } catch {
          // ignore holdings errors
        }
      },

      setInvestorPreferences: (preferences) => set({ investorPreferences: preferences }),

      setFarmerPreferences: (preferences) => set({ farmerPreferences: preferences }),

      setProfileComplete: (isProfileComplete) => set({ isProfileComplete }),

      clearUser: () => {
        useAuthStore.getState().logout();
        set({
          profile: null,
          wallet: { balance: 0, currency: 'INR' },
          holdings: { totalAcres: 0, totalProperties: 0 },
          investorPreferences: null,
          farmerPreferences: null,
          isProfileComplete: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        wallet: state.wallet,
        holdings: state.holdings,
        investorPreferences: state.investorPreferences,
        farmerPreferences: state.farmerPreferences,
        isProfileComplete: state.isProfileComplete,
      }),
    }
  )
);

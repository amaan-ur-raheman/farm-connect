import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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

  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setWallet: (wallet: Partial<WalletInfo>) => void;
  setHoldings: (holdings: { totalAcres: number; totalProperties: number }) => void;
  setInvestorPreferences: (preferences: InvestorPreferences) => void;
  setFarmerPreferences: (preferences: FarmerPreferences) => void;
  setProfileComplete: (isComplete: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
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

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      })),

      setWallet: (wallet) => set((state) => ({
        wallet: { ...state.wallet, ...wallet },
      })),

      setHoldings: (holdings) => set({ holdings }),

      setInvestorPreferences: (preferences) => set({ investorPreferences: preferences }),

      setFarmerPreferences: (preferences) => set({ farmerPreferences: preferences }),

      setProfileComplete: (isProfileComplete) => set({ isProfileComplete }),

      clearUser: () => set({
        profile: null,
        wallet: { balance: 0, currency: 'INR' },
        holdings: { totalAcres: 0, totalProperties: 0 },
        investorPreferences: null,
        farmerPreferences: null,
        isProfileComplete: false,
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

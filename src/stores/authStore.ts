import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'investor' | 'farmer' | null;

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  isLoading: boolean;
  
  setAuthenticated: (isAuthenticated: boolean) => void;
  setUserRole: (role: UserRole) => void;
  login: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userRole: null,
      isLoading: false,

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      setUserRole: (userRole) => set({ userRole }),

      login: (role) => set({ 
        isAuthenticated: true, 
        userRole: role,
        isLoading: false 
      }),

      logout: () => set({ 
        isAuthenticated: false, 
        userRole: null,
        isLoading: false 
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
      }),
    }
  )
);

import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface UiState {
  theme: Theme;
  searchVisible: boolean;
  globalSearchQuery: string;
  isLoading: boolean;
  loadingMessage: string;
  toasts: UiToast[];

  setTheme: (theme: Theme) => void;
  toggleSearch: () => void;
  setSearchVisible: (visible: boolean) => void;
  setGlobalSearchQuery: (query: string) => void;
  clearSearch: () => void;
  setIsLoading: (isLoading: boolean, message?: string) => void;
  showToast: (toast: Omit<UiToast, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

export interface UiToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

let toastCounter = 0;

export const useUiStore = create<UiState>((set) => ({
  theme: 'system',
  searchVisible: false,
  globalSearchQuery: '',
  isLoading: false,
  loadingMessage: '',
  toasts: [],

  setTheme: (theme) => set({ theme }),

  toggleSearch: () => set((state) => ({ searchVisible: !state.searchVisible })),

  setSearchVisible: (searchVisible) => set({ searchVisible }),

  setGlobalSearchQuery: (globalSearchQuery) => set({ globalSearchQuery }),

  clearSearch: () => set({ 
    globalSearchQuery: '', 
    searchVisible: false 
  }),

  setIsLoading: (isLoading, message = '') => set({ 
    isLoading, 
    loadingMessage: message 
  }),

  showToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    const newToast: UiToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    const duration = toast.duration || 3000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  dismissToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  clearAllToasts: () => set({ toasts: [] }),
}));

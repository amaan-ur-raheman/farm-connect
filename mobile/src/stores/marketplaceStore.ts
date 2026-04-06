import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  size: string;
  soil: string;
  image: string;
  verified?: boolean;
  remoteReady?: boolean;
  newListing?: boolean;
  irrigated?: boolean;
  rating: number;
  type: string;
  isOrganic?: boolean;
}

export interface MarketplaceFilters {
  priceRange: [number, number] | null;
  sizeRange: [number, number] | null;
  soilClass: string[];
  location: string[];
  features: string[];
}

export type ViewMode = 'grid' | 'list';

interface MarketplaceState {
  properties: Property[];
  favorites: Set<string>;
  viewMode: ViewMode;
  currentPage: number;
  itemsPerPage: number;
  filters: MarketplaceFilters;
  searchQuery: string;
  sortBy: 'price' | 'rating' | 'size' | 'newest';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;

  setProperties: (properties: Property[]) => void;
  toggleFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
  setViewMode: (mode: ViewMode) => void;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: MarketplaceState['sortBy']) => void;
  setSortOrder: (order: MarketplaceState['sortOrder']) => void;
  toggleSortOrder: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

const initialFilters: MarketplaceFilters = {
  priceRange: null,
  sizeRange: null,
  soilClass: [],
  location: [],
  features: [],
};

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      properties: [],
      favorites: new Set(),
      viewMode: 'grid',
      currentPage: 1,
      itemsPerPage: 12,
      filters: initialFilters,
      searchQuery: '',
      sortBy: 'newest',
      sortOrder: 'desc',
      isLoading: false,

      setProperties: (properties) => set({ properties }),

      toggleFavorite: (propertyId) => set((state) => {
        const newFavorites = new Set(state.favorites);
        if (newFavorites.has(propertyId)) {
          newFavorites.delete(propertyId);
        } else {
          newFavorites.add(propertyId);
        }
        return { favorites: newFavorites };
      }),

      isFavorite: (propertyId) => get().favorites.has(propertyId),

      setViewMode: (viewMode) => set({ viewMode }),

      setCurrentPage: (currentPage) => set({ currentPage }),

      nextPage: () => set((state) => ({ currentPage: state.currentPage + 1 })),

      prevPage: () => set((state) => ({
        currentPage: Math.max(state.currentPage - 1, 1),
      })),

      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
        currentPage: 1,
      })),

      clearFilters: () => set({
        filters: initialFilters,
        currentPage: 1,
      }),

      setSearchQuery: (searchQuery) => set({
        searchQuery,
        currentPage: 1,
      }),

      setSortBy: (sortBy) => set({ sortBy }),

      setSortOrder: (sortOrder) => set({ sortOrder }),

      toggleSortOrder: () => set((state) => ({
        sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
      })),

      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'marketplace-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favorites: Array.from(state.favorites),
        viewMode: state.viewMode,
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...(persistedState as any),
        favorites: new Set(persistedState?.favorites || []),
      }),
    }
  )
);

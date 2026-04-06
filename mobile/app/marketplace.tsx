import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import {
  MapPin,
  Heart,
  Grid3X3,
  List,
  Search,
  X,
  ShieldCheck,
  Droplets,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Button } from '../src/components/ui/Button';
import { useMarketplaceStore, Property } from '../src/stores';
import api, { Listing } from '../src/config/api';
import { haptic } from '../src/utils/haptics';
import { getCardImage } from '../src/utils/image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SkeletonCard } from '../src/components/ui/SkeletonCard';
import { PropertyCard } from '../src/components/ui/PropertyCard';

const mapListingToProperty = (listing: Listing): Property => ({
  id: listing.id,
  title: listing.name,
  location: listing.location_name,
  price: `₹${(listing.price_per_acre / 1000).toFixed(0)}k`,
  size: `${listing.area_acres} Acres`,
  soil: listing.soil_type || 'Unknown',
  image: getCardImage(listing.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'),
  verified: true,
  newListing: new Date(listing.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
  irrigated: listing.irrigation_type ? listing.irrigation_type !== 'Rainfed' : false,
  remoteReady: true,
  rating: 4.5,
  type: listing.crops?.[0] || 'Farm',
  isOrganic: listing.is_organic,
});

export default function MarketplaceScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toggleFavorite, isFavorite, viewMode, setViewMode } = useMarketplaceStore();

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  const fetchListingsPage = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams();
    params.set('limit', '12');
    params.set('page', pageParam.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (activeFilter === 'organic') params.set('is_organic', 'true');
    if (activeFilter === 'price_low') params.set('sort', 'price_asc');
    if (activeFilter === 'price_high') params.set('sort', 'price_desc');
    if (activeFilter === 'newest') params.set('sort', 'newest');

    // Use getFull to preserve the response envelope including pagination
    // Backend returns: { success: true, data: [...], pagination: {...} }
    const response = await api.getFull<{ success: boolean; data: Listing[]; pagination: { total: number; pages: number } }>(`/api/listings?${params.toString()}`);
    
    const listings = response.data.data || [];
    const pagination = response.data.pagination;
    
    return {
      listings,
      pagination,
      nextPage: pageParam < (pagination?.pages || 1) ? pageParam + 1 : undefined,
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['listings', debouncedSearch, activeFilter],
    queryFn: fetchListingsPage,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const listings = data?.pages.flatMap(page => page.listings) || [];
  const totalCount = data?.pages[0]?.pagination?.total || 0;

  const onRefresh = () => {
    haptic.light();
    refetch();
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: string) => {
    haptic.light();
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const filterOptions = [
    { key: 'organic', label: 'Organic' },
    { key: 'newest', label: 'Newest' },
    { key: 'price_low', label: 'Price: Low' },
    { key: 'price_high', label: 'Price: High' },
  ];

  const renderHeader = () => (
    <View>
      {/* Map Section */}
      <View className="relative w-full h-[200px] bg-[#eaf0ea] dark:bg-[#2a352a] overflow-hidden">
         <Image
           source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2940' }}
           style={{ width: '100%', height: '100%', opacity: 0.6 }}
           contentFit="cover"
         />
      </View>

      {/* Discovery Area */}
      <View className="px-4 py-8">
         {/* Results Header */}
         <View className="flex-col justify-between gap-4 mb-6">
            <View>
               <Text className="text-2xl font-bold text-[#111811] dark:text-white">Find your perfect plot</Text>
               <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                 {isLoading ? 'Searching...' : `Showing ${listings.length} of ${totalCount} properties`}
               </Text>
            </View>
            
            <View className="flex-row items-center gap-3 bg-white dark:bg-[#1e291e] p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
               <TouchableOpacity 
                 onPress={() => { haptic.light(); setViewMode('grid'); }}
                 className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#4cae4f]/10' : ''}`}
               >
                  <Grid3X3 size={18} color={viewMode === 'grid' ? '#4cae4f' : '#6b7280'} />
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => { haptic.light(); setViewMode('list'); }}
                 className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#4cae4f]/10' : ''}`}
               >
                  <List size={18} color={viewMode === 'list' ? '#4cae4f' : '#6b7280'} />
               </TouchableOpacity>
            </View>
         </View>

         {/* Search & Filters */}
         <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-800 mb-8">
            <View className="flex-row items-center gap-2 mb-4">
               <View className="flex-1 flex-row items-center bg-[#f9fbf9] dark:bg-[#151d15] border border-gray-200 dark:border-gray-700 rounded-lg px-3">
                  <Search size={18} color="#94a3b8" />
                  <TextInput
                    className="flex-1 py-2.5 px-2 text-sm text-[#111811] dark:text-white font-medium"
                    placeholder="Search farms, crops, or locations..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={handleSearch}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { haptic.light(); setSearchQuery(''); }}>
                      <X size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
               </View>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
               {filterOptions.map((option) => (
                 <TouchableOpacity
                   key={option.key}
                   onPress={() => handleFilterChange(option.key)}
                   className={`flex-row items-center gap-1 px-3 py-2 rounded-lg border ${
                     activeFilter === option.key
                       ? 'bg-[#4cae4f] border-[#4cae4f]'
                       : 'bg-[#f9fbf9] dark:bg-[#151d15] border-gray-200 dark:border-gray-700'
                   }`}
                 >
                    <Text className={`text-xs font-medium ${
                      activeFilter === option.key ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.label}
                    </Text>
                 </TouchableOpacity>
               ))}
            </ScrollView>
         </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View className="py-8 items-center">
          <ActivityIndicator color="#4cae4f" />
          <Text className="text-xs text-gray-500 mt-2">Loading more properties...</Text>
        </View>
      );
    }
    
    if (!hasNextPage && listings.length > 0) {
      return (
        <View className="py-12 items-center">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">You've reached the end</Text>
        </View>
      );
    }
    
    return <View className="h-20" />;
  };

  const renderEmpty = () => {
    if (isLoading) return (
      <View className="px-4 gap-4 flex-col">
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );

    return (
      <View className="flex items-center justify-center py-20 px-8">
        <Text className="text-4xl mb-4">🌾</Text>
        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">No listings found</Text>
        <Text className="text-sm text-gray-500 text-center leading-relaxed">
          Try adjusting your search or filters to find more properties.
        </Text>
        <TouchableOpacity 
          onPress={() => { haptic.light(); setSearchQuery(''); setActiveFilter(null); }}
          className="mt-6 bg-[#4cae4f] px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-bold text-sm">Clear Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Listing }) => {
    const prop = mapListingToProperty(item);
    return (
      <View className="px-4">
        <PropertyCard
          title={prop.title}
          location={prop.location}
          price={prop.price}
          size={prop.size}
          soil={prop.soil}
          image={prop.image}
          verified={prop.verified}
          remoteReady={prop.remoteReady}
          newListing={prop.newListing}
          irrigated={prop.irrigated}
          isFavorite={isFavorite(item.id)}
          onToggleFavorite={() => { haptic.light(); toggleFavorite(item.id); }}
          onPress={() => { haptic.light(); router.push(`/property/${item.id}`); }}
        />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />

      <Header
        variant="menu"
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <FlatList
        data={listings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={onRefresh} tintColor="#4cae4f" />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

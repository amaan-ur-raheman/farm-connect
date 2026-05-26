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
  useColorScheme,
  StyleProp,
  ViewStyle,
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
  Sprout,
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
import { EmptyState } from '../src/components/ui/EmptyState';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
      <View style={{
        position: 'relative',
        width: '100%',
        height: 200,
        backgroundColor: isDark ? '#2a352a' : '#eaf0ea',
        overflow: 'hidden',
      }}>
         <Image
           source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2940' }}
           style={{ width: '100%', height: '100%', opacity: 0.6 }}
           contentFit="cover"
         />
      </View>

      {/* Discovery Area */}
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing['2xl'] }}>
         {/* Results Header */}
         <View style={{
           flexDirection: 'row',
           justifyContent: 'space-between',
           alignItems: 'center',
           marginBottom: spacing.xl,
         }}>
            <View style={{ flex: 1 }}>
               <Text style={{
                 ...typography.heading,
                 color: currentTheme.text,
               }}>Find your perfect plot</Text>
               <Text style={{
                 ...typography.bodySm,
                 color: currentTheme.textTertiary,
                 marginTop: spacing.xs,
               }}>
                 {isLoading ? 'Searching...' : `Showing ${listings.length} of ${totalCount} properties`}
               </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: currentTheme.surface,
              padding: spacing.xs,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: currentTheme.border,
              ...getShadow('sm', isDark),
            }}>
               <TouchableOpacity
                 onPress={() => { haptic.light(); setViewMode('grid'); }}
                 style={{
                   padding: spacing.sm,
                   borderRadius: radii.sm,
                   backgroundColor: viewMode === 'grid' ? `${colors.primary[500]}1A` : 'transparent',
                   minWidth: 44,
                   minHeight: 44,
                   justifyContent: 'center',
                   alignItems: 'center',
                 }}
               >
                  <Grid3X3 size={18} color={viewMode === 'grid' ? colors.primary[500] : currentTheme.textTertiary} />
               </TouchableOpacity>
               <TouchableOpacity
                 onPress={() => { haptic.light(); setViewMode('list'); }}
                 style={{
                   padding: spacing.sm,
                   borderRadius: radii.sm,
                   backgroundColor: viewMode === 'list' ? `${colors.primary[500]}1A` : 'transparent',
                   minWidth: 44,
                   minHeight: 44,
                   justifyContent: 'center',
                   alignItems: 'center',
                 }}
               >
                  <List size={18} color={viewMode === 'list' ? colors.primary[500] : currentTheme.textTertiary} />
               </TouchableOpacity>
            </View>
         </View>

         {/* Search & Filters */}
         <View style={{
           backgroundColor: currentTheme.surface,
           borderRadius: radii.lg,
           ...getShadow('lg', isDark),
           padding: spacing.lg,
           borderWidth: 1,
           borderColor: currentTheme.border,
           marginBottom: spacing['2xl'],
         }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}>
               <View style={{
                 flex: 1,
                 flexDirection: 'row',
                 alignItems: 'center',
                 backgroundColor: isSearchFocused ? (isDark ? '#1E2D1E' : colors.primary[50]) : (isDark ? '#151d15' : '#f9fbf9'),
                 borderWidth: isSearchFocused ? 2 : 1,
                 borderColor: isSearchFocused ? colors.primary[500] : currentTheme.border,
                 borderRadius: radii.md,
                 paddingHorizontal: spacing.md,
                 minHeight: 44,
               }}>
                  <Search size={18} color={isSearchFocused ? colors.primary[500] : currentTheme.textTertiary} />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.sm,
                      fontSize: typography.bodySm.fontSize,
                      lineHeight: typography.bodySm.lineHeight,
                      fontWeight: typography.bodySm.fontWeight,
                      color: currentTheme.text,
                    }}
                    placeholder="Search farms, crops, or locations..."
                    placeholderTextColor={currentTheme.inputPlaceholder}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => { haptic.light(); setSearchQuery(''); }}
                      style={{
                        padding: spacing.xs,
                        minWidth: 44,
                        minHeight: 44,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={18} color={currentTheme.textTertiary} />
                    </TouchableOpacity>
                  )}
               </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
               {filterOptions.map((option) => (
                 <TouchableOpacity
                   key={option.key}
                   onPress={() => handleFilterChange(option.key)}
                   style={{
                     flexDirection: 'row',
                     alignItems: 'center',
                     gap: spacing.xs,
                     paddingHorizontal: spacing.md,
                     paddingVertical: spacing.sm,
                     borderRadius: radii.md,
                     borderWidth: 1,
                     borderColor: activeFilter === option.key ? colors.primary[500] : currentTheme.border,
                     backgroundColor: activeFilter === option.key ? colors.primary[500] : (isDark ? '#151d15' : '#f9fbf9'),
                     minHeight: 44,
                   }}
                 >
                    <Text style={{
                      ...typography.caption,
                      fontWeight: '600',
                      color: activeFilter === option.key ? colors.neutral[50] : currentTheme.textSecondary,
                    }}>
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
        <View style={{
          paddingVertical: spacing['2xl'],
          alignItems: 'center',
        }}>
          <ActivityIndicator color={colors.primary[500]} />
          <Text style={{
            ...typography.caption,
            color: currentTheme.textTertiary,
            marginTop: spacing.sm,
          }}>Loading more properties...</Text>
        </View>
      );
    }

    if (!hasNextPage && listings.length > 0) {
      return (
        <View style={{
          paddingVertical: spacing['3xl'],
          alignItems: 'center',
        }}>
          <Text style={{
            ...typography.captionXs,
            fontWeight: '700',
            color: currentTheme.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}>You've reached the end</Text>
        </View>
      );
    }

    return <View style={{ height: spacing['4xl'] }} />;
  };

  const renderEmpty = () => {
    if (isLoading) return (
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xl }}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );

    return (
      <EmptyState
        icon={Sprout}
        title="No listings found"
        description="Try adjusting your search or filters to find more properties."
        actionLabel="Clear Filters"
        onAction={() => { haptic.light(); setSearchQuery(''); setActiveFilter(null); }}
      />
    );
  };

  const renderItem = ({ item }: { item: Listing }) => {
    const prop = mapListingToProperty(item);
    return (
      <View style={{ paddingHorizontal: spacing.lg }}>
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
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

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
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </View>
  );
}

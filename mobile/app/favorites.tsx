import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Heart, MapPin, Sprout } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMarketplaceStore } from '../src/stores';
import api, { Listing } from '../src/config/api';
import { Skeleton } from '../src/components/ui/Skeleton';

const mapListingToProperty = (listing: Listing) => ({
  id: listing.id,
  title: listing.name,
  location: listing.location_name,
  price: listing.price_per_acre,
  area: listing.area_acres,
  image: listing.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
  isOrganic: listing.is_organic,
});

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const BATCH_SIZE = 5;

let cache: { data: Record<string, Listing>; timestamp: number } = {
  data: {},
  timestamp: 0,
};

function getFromCache(id: string): Listing | null {
  const age = Date.now() - cache.timestamp;
  if (age < CACHE_TTL_MS && cache.data[id]) {
    return cache.data[id];
  }
  return null;
}

function setInCache(listings: Record<string, Listing>) {
  cache.data = { ...cache.data, ...listings };
  cache.timestamp = Date.now();
}

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useMarketplaceStore();
  const [favoriteListings, setFavoriteListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    if (favorites.size === 0) {
      setFavoriteListings([]);
      setLoading(false);
      return;
    }

    try {
      const ids = Array.from(favorites) as string[];
      const allListings: Listing[] = [];

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const chunk = ids.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          chunk.map(async (id: string) => {
            const cached = getFromCache(id);
            if (cached) return cached;
            try {
              const res = await api.get<Listing>(`/api/listings/${id}`);
              return res.data;
            } catch (err) {
              console.error(`Failed to fetch listing ${id}:`, err);
              return null;
            }
          })
        );
        const valid = results.filter((r): r is Listing => r !== null);
        allListings.push(...valid);
        // Cache results from this chunk
        setInCache(Object.fromEntries(valid.map((l) => [l.id, l])));
      }

      const listings = allListings.map(mapListingToProperty);
      setFavoriteListings(listings);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [favorites]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites().finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
        <StatusBar barStyle="dark-content" />
        <View className="p-4 space-y-4">
          <Skeleton width={200} height={28} />
          <View className="space-y-4">
            {[1, 2, 3].map((i) => (
              <View key={i} className="bg-white dark:bg-[#1e291e] rounded-xl overflow-hidden">
                <Skeleton width={'100%'} height={180} />
                <View className="p-4">
                  <Skeleton width={180} height={20} style={{ marginBottom: 8 }} />
                  <Skeleton width={120} height={14} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color="#4cae4f" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-900 dark:text-white">My Favorites</Text>
          </View>
          <View className="bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-red-600 dark:text-red-400">
              {favoriteListings.length} {favoriteListings.length === 1 ? 'Farm' : 'Farms'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      >
        {favoriteListings.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-8">
            <Heart size={48} color="#94a3b8" />
            <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">No favorites yet</Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
              Heart farms you love to easily find them later.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/marketplace')}
              className="bg-[#4cae4f] px-6 py-3 rounded-xl flex-row items-center gap-2"
            >
              <Sprout size={18} color="white" />
              <Text className="text-white font-bold">Browse Farms</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="p-4 space-y-4">
            {favoriteListings.map((property) => (
              <TouchableOpacity
                key={property.id}
                onPress={() => router.push(`/property/${property.id}`)}
                className="bg-white dark:bg-[#1e291e] rounded-xl overflow-hidden border border-[#eaf0ea] dark:border-[#2a382a]"
              >
                <View className="relative">
                  <Image
                    source={{ uri: property.image }}
                    style={{ width: '100%', height: 180 }}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    onPress={() => toggleFavorite(property.id)}
                    className="absolute top-3 right-3 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg"
                  >
                    <Heart size={20} color="#ef4444" fill="#ef4444" />
                  </TouchableOpacity>
                  {property.isOrganic && (
                    <View className="absolute top-3 left-3 bg-green-500 px-3 py-1 rounded-full">
                      <Text className="text-xs font-bold text-white">Organic</Text>
                    </View>
                  )}
                </View>

                <View className="p-4">
                  <Text className="text-base font-bold text-slate-900 dark:text-white mb-1" numberOfLines={1}>
                    {property.title}
                  </Text>
                  <View className="flex-row items-center gap-1 mb-2">
                    <MapPin size={14} color="#94a3b8" />
                    <Text className="text-xs text-gray-500 dark:text-gray-400">{property.location}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-[#4cae4f]">
                      ₹{property.price.toLocaleString('en-IN')}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {property.area} Acres
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

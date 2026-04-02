import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Plus, MapPin, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import api, { Listing } from '../../src/config/api';

export default function MyListingsScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      const res = await api.get<{ data: Listing[] }>('/api/listings/mine');
      setListings(res.data.data || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings().finally(() => setRefreshing(false));
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/listings/${id}`);
            setListings(prev => prev.filter(l => l.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete listing.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] items-center justify-center">
        <ActivityIndicator size="large" color="#4cae4f" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center justify-between border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#4cae4f" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">My Listings</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/listings/create')} className="bg-[#4cae4f] px-4 py-2 rounded-xl flex-row items-center gap-2">
          <Plus size={16} color="white" />
          <Text className="text-white font-bold text-sm">New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      >
        <View className="px-4 py-4">
          {listings.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-4">🌾</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">No listings yet</Text>
              <Text className="text-sm text-gray-500 text-center px-8 mb-6">Create your first farm listing to attract investors.</Text>
              <TouchableOpacity onPress={() => router.push('/listings/create')} className="bg-[#4cae4f] px-6 py-3 rounded-xl">
                <Text className="text-white font-bold">Create Listing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            listings.map((listing) => (
              <TouchableOpacity
                key={listing.id}
                onPress={() => router.push(`/property/${listing.id}`)}
                className="bg-white dark:bg-[#1e291e] rounded-2xl overflow-hidden mb-4 border border-[#eaf0ea] dark:border-[#2a382a]"
              >
                <Image
                  source={{ uri: listing.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800' }}
                  style={{ width: '100%', height: 160 }}
                  contentFit="cover"
                />
                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-bold text-slate-900 dark:text-white flex-1" numberOfLines={1}>
                      {listing.name}
                    </Text>
                    <View className={`px-2 py-1 rounded-full ${listing.status === 'ACTIVE' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Text className={`text-[10px] font-bold ${listing.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'}`}>
                        {listing.status}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <MapPin size={12} color="#6b7280" />
                    <Text className="text-xs text-gray-500 ml-1">{listing.location_name}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-[10px] text-gray-400 uppercase">Price/Acre</Text>
                      <Text className="text-sm font-bold text-[#4cae4f]">₹{listing.price_per_acre.toLocaleString('en-IN')}</Text>
                    </View>
                    <View>
                      <Text className="text-[10px] text-gray-400 uppercase">Area</Text>
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">{listing.area_acres} Acres</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => router.push(`/property/${listing.id}`)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Text className="text-xs font-bold text-slate-600">View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(listing.id)} className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  );
}

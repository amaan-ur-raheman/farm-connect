// mobile/app/investor-dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { TrendingUp, Wallet, Package, ChevronRight, Bell, MapPin, Sprout } from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import api from '../src/config/api';
import { useAuthStore } from '../src/stores';

export default function InvestorDashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/contracts/consumer/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch investor stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats().finally(() => setRefreshing(false));
  };

  if (loading && !refreshing) {
    return <View className="flex-1 items-center justify-center bg-[#f9fbf9] dark:bg-[#151d15]"><ActivityIndicator color="#4cae4f" /></View>;
  }

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <Header variant="menu" onAvatarPress={() => router.push('/profile')} />
      
      <ScrollView 
        className="flex-1" 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      >
        <View className="p-4">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Investment Overview</Text>
          
          {/* Stats Grid */}
          <View className="flex-row gap-3 mb-8">
            <View className="flex-1 bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a]">
              <TrendingUp size={20} color="#4cae4f" className="mb-2" />
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Invested</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">₹{stats?.totalInvested?.toLocaleString()}</Text>
            </View>
            <View className="flex-1 bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a]">
              <Sprout size={20} color="#3b82f6" className="mb-2" />
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Active Farms</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">{stats?.activeInvestments}</Text>
            </View>
          </View>

          {/* Recent Updates */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Farm Updates</Text>
              <TouchableOpacity onPress={() => router.push('/contracts')}>
                <Text className="text-xs font-bold text-[#4cae4f]">View My Farms</Text>
              </TouchableOpacity>
            </View>
            
            {stats?.recentUpdates?.length === 0 ? (
              <View className="bg-white dark:bg-[#1e291e] p-8 rounded-2xl items-center border border-[#eaf0ea] dark:border-[#2a382a]">
                <Text className="text-gray-400 text-sm">No updates from your farms yet.</Text>
              </View>
            ) : (
              stats?.recentUpdates?.map((update: any) => (
                <TouchableOpacity 
                  key={update.id} 
                  onPress={() => router.push(`/updates/${update.contract_id}`)}
                  className="bg-white dark:bg-[#1e291e] p-4 rounded-2xl mb-3 border border-[#eaf0ea] dark:border-[#2a382a] flex-row gap-4"
                >
                  <Image source={{ uri: update.media_url }} className="size-16 rounded-lg" />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{update.contract.listing.name}</Text>
                    <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>{update.caption}</Text>
                    <Text className="text-[10px] text-gray-400 mt-2">{new Date(update.created_at).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity onPress={() => router.push('/marketplace')} className="bg-[#4cae4f] p-4 rounded-2xl flex-1 items-center">
              <Text className="text-white font-bold">Invest More</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/wallet')} className="bg-slate-900 dark:bg-white p-4 rounded-2xl flex-1 items-center">
              <Text className="text-white dark:text-slate-900 font-bold">Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

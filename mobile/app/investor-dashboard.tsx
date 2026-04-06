import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { TrendingUp, Sprout, Wheat, ChevronRight, Bell, Package, Wallet } from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Skeleton } from '../src/components/ui/Skeleton';
import { Badge } from '../src/components/ui/Badge';
import api, { ConsumerStats, Contract } from '../src/config/api';
import { useAuthStore, useSocketStore } from '../src/stores';
import { useUnreadCounts } from '../src/config/unread-context';
import { haptic } from '../src/utils/haptics';
import { useQuery } from '@tanstack/react-query';
import { ConsumerStatsResponseSchema, ContractsResponseSchema } from '../src/config/schemas';

export default function InvestorDashboardScreen() {
  const { socket } = useSocketStore();
  const { authUser } = useAuthStore();
  const { unreadCounts } = useUnreadCounts();
  const userImage = authUser?.avatar_url ? { uri: authUser.avatar_url } : undefined;
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching: isRefetchingStats } = useQuery({
    queryKey: ['consumerStats'],
    queryFn: async () => {
      const res = await api.get('/api/contracts/consumer/stats', undefined, ConsumerStatsResponseSchema);
      return res.data.data;
    },
  });

  const { data: contracts = [], isLoading: contractsLoading, refetch: refetchContracts, isRefetching: isRefetchingContracts } = useQuery({
    queryKey: ['consumerContracts'],
    queryFn: async () => {
      const res = await api.get('/api/contracts/consumer', undefined, ContractsResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
  });

  const loading = statsLoading || contractsLoading;
  const isRefetching = isRefetchingStats || isRefetchingContracts;

  // Refs to avoid stale closures in socket event handlers
  const refetchStatsRef = useRef(refetchStats);
  const refetchContractsRef = useRef(refetchContracts);
  useEffect(() => { refetchStatsRef.current = refetchStats; }, [refetchStats]);
  useEffect(() => { refetchContractsRef.current = refetchContracts; }, [refetchContracts]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      refetchStatsRef.current();
      refetchContractsRef.current();
    };

    socket.on('contract_update', handleUpdate);
    socket.on('delivery_update', handleUpdate);
    socket.on('new_notification', handleUpdate);

    return () => {
      socket.off('contract_update', handleUpdate);
      socket.off('delivery_update', handleUpdate);
      socket.off('new_notification', handleUpdate);
    };
  }, [socket]);

  const onRefresh = () => {
    haptic.light();
    setRefreshing(true);
    Promise.all([refetchStats(), refetchContracts()]).finally(() => setRefreshing(false));
  };

  const activeContracts = (contracts as Contract[]).filter((c: Contract) => c.status === 'ACTIVE');

  if (loading && !isRefetching) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
        <StatusBar barStyle="dark-content" />
        <Header
          variant="menu"
          userImage={userImage}
          onAvatarPress={() => router.push('/(tabs)/profile')}
          notificationCount={unreadCounts.notifications}
        />
        <View className="p-4">
          <Skeleton width={200} height={28} style={{ marginBottom: 24 }} />
          <View className="flex-row gap-3 mb-8">
            <View className="flex-1 bg-white dark:bg-[#1e291e] p-4 rounded-2xl">
              <Skeleton width={40} height={40} style={{ marginBottom: 8 }} />
              <Skeleton width={80} height={12} style={{ marginBottom: 4 }} />
              <Skeleton width={100} height={20} />
            </View>
            <View className="flex-1 bg-white dark:bg-[#1e291e] p-4 rounded-2xl">
              <Skeleton width={40} height={40} style={{ marginBottom: 8 }} />
              <Skeleton width={80} height={12} style={{ marginBottom: 4 }} />
              <Skeleton width={60} height={20} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />

      <Header
        variant="menu"
        userImage={userImage}
        onAvatarPress={() => router.push('/(tabs)/profile')}
        notificationCount={unreadCounts.notifications}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />
        }
      >
        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-[#111811] dark:text-white mb-6">Portfolio</Text>

          {/* Stats Grid */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a]">
              <View className="size-10 bg-[#4cae4f]/10 rounded-xl items-center justify-center mb-3">
                <TrendingUp size={20} color="#4cae4f" />
              </View>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Total Invested</Text>
              <Text className="text-lg font-bold text-[#111811] dark:text-white">₹{(stats?.totalInvested || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View className="flex-1 bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a]">
              <View className="size-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl items-center justify-center mb-3">
                <Sprout size={20} color="#3b82f6" />
              </View>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Active Farms</Text>
              <Text className="text-lg font-bold text-[#111811] dark:text-white">{stats?.activeInvestments || 0}</Text>
            </View>
          </View>

          <View className="bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] mb-6">
            <View className="flex-row items-center gap-3">
              <View className="size-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl items-center justify-center">
                <Wheat size={20} color="#f59e0b" />
              </View>
              <View>
                <Text className="text-[10px] font-bold text-gray-400 uppercase">Total Yield</Text>
                <Text className="text-lg font-bold text-[#111811] dark:text-white">{(stats?.totalYield || 0).toLocaleString('en-IN')} kg</Text>
              </View>
            </View>
          </View>

          {/* Active Contracts */}
          {activeContracts.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-bold text-[#111811] dark:text-white">Active Contracts</Text>
                <TouchableOpacity onPress={() => router.push('/contracts')}>
                  <Text className="text-xs font-bold text-[#4cae4f]">View My Contracts</Text>
                </TouchableOpacity>
              </View>
              {activeContracts.slice(0, 3).map((contract) => (
                <TouchableOpacity
                  key={contract.id}
                  onPress={() => router.push(`/contracts/${contract.id}`)}
                  className="bg-white dark:bg-[#1e291e] p-4 rounded-xl mb-2 border border-[#eaf0ea] dark:border-[#2a382a] flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-[#111811] dark:text-white">
                      {contract.listing?.name || contract.crop}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {contract.acreage} Acres · {new Date(contract.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View className="items-end gap-2">
                    <Badge
                      variant={contract.status === 'ACTIVE' ? 'success' : 'warning'}
                      label={contract.status}
                    />
                    <Text className="text-sm font-bold text-[#111811] dark:text-white">
                      ₹{contract.total_amount?.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Updates */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-[#111811] dark:text-white">Farm Updates</Text>
              <TouchableOpacity onPress={() => router.push('/contracts')}>
                <Text className="text-xs font-bold text-[#4cae4f]">View My Contracts</Text>
              </TouchableOpacity>
            </View>

            {stats?.recentUpdates?.length === 0 ? (
              <View className="bg-white dark:bg-[#1e291e] p-8 rounded-2xl items-center border border-[#eaf0ea] dark:border-[#2a382a]">
                <Sprout size={40} color="#94a3b8" />
                <Text className="text-gray-400 text-sm mt-3 mb-1 text-center">No updates from your farms yet.</Text>
                <Text className="text-gray-400 text-xs mb-4 text-center">Updates will appear once farmers post from their fields.</Text>
                <TouchableOpacity
                  onPress={() => router.push('/marketplace')}
                  className="bg-[#4cae4f] px-6 py-3 rounded-xl flex-row items-center gap-2"
                >
                  <Sprout size={18} color="white" />
                  <Text className="text-white font-bold">Browse Farms</Text>
                </TouchableOpacity>
              </View>
            ) : (
              stats?.recentUpdates?.map((update) => (
                <TouchableOpacity
                  key={update.id}
                  onPress={() => router.push(`/updates/${update.contract_id}`)}
                  className="bg-white dark:bg-[#1e291e] p-4 rounded-xl mb-2 border border-[#eaf0ea] dark:border-[#2a382a] flex-row gap-4"
                >
                  {update.media_url ? (
                    <Image source={{ uri: update.media_url }} className="size-16 rounded-lg" />
                  ) : (
                    <View className="size-16 rounded-lg bg-[#f9fbf9] dark:bg-[#1a231a] items-center justify-center">
                      <Package size={20} color="#94a3b8" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-[#111811] dark:text-white">
                      {update.contract?.listing?.name || 'Farm Update'}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>{update.caption || 'New update from the farm'}</Text>
                    <Text className="text-[10px] text-gray-400 mt-2">{new Date(update.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity 
              onPress={() => {
                haptic.light();
                router.push('/marketplace');
              }} 
              className="bg-[#4cae4f] p-4 rounded-2xl flex-1 items-center"
            >
              <View className="size-12 bg-white/20 rounded-full items-center justify-center mb-2">
                <Sprout size={24} color="white" />
              </View>
              <Text className="text-white font-bold text-sm">Invest More</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                haptic.light();
                router.push('/contracts');
              }} 
              className="bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] flex-1 items-center"
            >
              <View className="size-12 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-2">
                <TrendingUp size={24} color="#3b82f6" />
              </View>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Portfolio</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                haptic.light();
                router.push('/wallet');
              }} 
              className="bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] flex-1 items-center"
            >
              <View className="size-12 bg-amber-50 dark:bg-amber-900/20 rounded-full items-center justify-center mb-2">
                <Wallet size={24} color="#f59e0b" />
              </View>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-8 px-4">
          <Text className="text-xs text-center text-gray-400">
            © {new Date().getFullYear()} FarmConnect. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

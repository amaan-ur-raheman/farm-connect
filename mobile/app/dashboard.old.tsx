import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  Sun,
  CloudRain,
  Gauge,
  History,
  Wallet,
  Bell,
  Camera,
  Sprout,
  Droplets,
  Wind,
  ThermometerSun,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Skeleton } from '../src/components/ui/Skeleton';
import api, { Contract, FarmUpdate } from '../src/config/api';
import { useAuthStore, useSocketStore } from '../src/stores';
import { useUnreadCounts } from '../src/config/unread-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ContractsResponseSchema, FarmUpdatesResponseSchema, WalletBalanceResponseSchema } from '../src/config/schemas';
import { haptic } from '../src/utils/haptics';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const { socket } = useSocketStore();
  const { isAuthenticated, authUser, userRole } = useAuthStore();
  const { unreadCounts } = useUnreadCounts();
  const userImage = authUser?.avatar_url ? { uri: authUser.avatar_url } : undefined;

  const { data: contracts = [], isLoading: loadingContracts, refetch: refetchContracts, isRefetching: isRefetchingContracts } = useQuery({
    queryKey: ['farmerContracts'],
    queryFn: async () => {
      const res = await api.get('/api/contracts/farmer', undefined, ContractsResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: walletBalance = 0, refetch: refetchWallet, isRefetching: isRefetchingWallet } = useQuery({
    queryKey: ['walletBalance', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/wallet/balance', undefined, WalletBalanceResponseSchema).catch(() => ({ data: { success: true, data: { balance: 0, currency: 'INR', pending: 0 } } }));
      return res.data.data?.balance || 0;
    },
    enabled: isAuthenticated,
  });

  const { data: updates = [], refetch: refetchUpdates, isRefetching: isRefetchingUpdates } = useQuery({
    queryKey: ['farmerUpdates', selectedContract?.id],
    queryFn: async () => {
      if (!selectedContract?.id) return [];
      const res = await api.get(`/api/updates/${selectedContract.id}`, undefined, FarmUpdatesResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
    enabled: isAuthenticated && !!selectedContract?.id,
  });

  const { data: weather } = useQuery({
    queryKey: ['weather', selectedContract?.listing_id],
    queryFn: async () => {
      if (!selectedContract?.listing_id) return null;
      try {
        const res = await api.get(`/api/weather/${selectedContract.listing_id}`);
        return (res as any)?.data?.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated && !!selectedContract?.listing_id,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  const isRefetching = isRefetchingContracts || isRefetchingWallet || isRefetchingUpdates;

  // Refs to avoid stale closures in socket event handlers
  const refetchContractsRef = useRef(refetchContracts);
  const refetchWalletRef = useRef(refetchWallet);
  const refetchUpdatesRef = useRef(refetchUpdates);
  useEffect(() => { refetchContractsRef.current = refetchContracts; }, [refetchContracts]);
  useEffect(() => { refetchWalletRef.current = refetchWallet; }, [refetchWallet]);
  useEffect(() => { refetchUpdatesRef.current = refetchUpdates; }, [refetchUpdates]);

  useEffect(() => {
    if (contracts.length > 0 && !selectedContract) {
      setSelectedContract(contracts[0] as Contract | null);
    }
  }, [contracts]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      refetchContractsRef.current();
      refetchWalletRef.current();
      refetchUpdatesRef.current();
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
    if (!isAuthenticated) return;
    haptic.light();
    setRefreshing(true);
    Promise.all([refetchContracts(), refetchWallet(), refetchUpdates()]).finally(() => setRefreshing(false));
  };

  return (
    <View className="flex-1 bg-[#f6f7f6] dark:bg-[#151d15]">
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4cae4f"
            colors={['#4cae4f']}
          />
        }
      >
        {/* Title Section */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold tracking-tight text-[#111811] dark:text-white mb-1">
                {userRole === 'consumer' ? t('dashboard.portfolio') : t('dashboard.myFarm')}
              </Text>
              <View className="flex-row items-center">
                <MapPin size={14} color="#608562" />
                <Text className="text-sm font-medium text-[#608562] ml-1">
                  {selectedContract?.listing?.location_name || 'Farm Dashboard'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/notifications')} className="p-2">
              <Bell size={22} color="#608562" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Earnings Quick View */}
        <View className="px-4 pt-4">
          <TouchableOpacity 
            onPress={() => {
              haptic.light();
              router.push('/wallet');
            }} 
            className="bg-[#4cae4f]/10 rounded-xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-10 bg-[#4cae4f] rounded-full items-center justify-center">
                <Wallet size={20} color="white" />
              </View>
              <View>
                <Text className="text-[10px] font-semibold text-[#608562] uppercase">{t('dashboard.earnings')}</Text>
                <Text className="text-xl font-bold text-[#111811] dark:text-white">₹{(walletBalance || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs font-bold text-[#4cae4f]">{t('dashboard.withdraw')}</Text>
              <ChevronRight size={16} color="#4cae4f" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Contract Selector */}
        <View className="px-4 pt-4">
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              router.push('/contracts');
            }}
            className="bg-white dark:bg-[#1e291e] border border-[#eaf0ea] dark:border-[#2a382a] rounded-lg px-4 py-3 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-[10px] font-semibold text-[#608562] uppercase">Selected Property</Text>
              <Text className="text-sm font-medium text-[#111811] dark:text-white" numberOfLines={1}>
                {selectedContract?.listing?.name || 'Select Property'}
              </Text>
            </View>
            <ChevronDown size={14} color="#608562" />
          </TouchableOpacity>
        </View>

        {/* Contract Summary Card */}
        <View className="px-4 pt-6">
          {loadingContracts ? (
            <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6 flex items-center justify-center">
              <ActivityIndicator color="#4cae4f" />
            </View>
          ) : selectedContract ? (
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                router.push(`/contracts/${selectedContract.id}`);
              }}
              className="bg-white dark:bg-[#1e291e] rounded-xl shadow-lg border-2 border-[#4cae4f]/20 p-6 relative overflow-hidden"
            >
              <View className="absolute top-0 right-0 p-4 opacity-10">
                <Text className="text-8xl font-black text-[#4cae4f]">₹</Text>
              </View>

              <View className="relative z-10">
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#608562] mb-1">
                  Property Value
                </Text>
                <View className="flex-row items-baseline gap-1 mb-4">
                  <Text className="text-4xl font-bold text-[#111811] dark:text-white">
                    ₹{selectedContract.total_amount?.toLocaleString('en-IN')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {selectedContract.acreage} Acres
                  </Text>
                </View>

                <View className="flex-row justify-between text-sm text-gray-600 dark:text-gray-400 mb-4 bg-[#f9fbf9] dark:bg-black/20 p-3 rounded-lg">
                  <Text className="font-medium">Lease Status</Text>
                  <Text className="font-medium">{selectedContract.status}</Text>
                </View>

                <Text className="text-xs text-center text-[#4cae4f] font-semibold">Tap to view details →</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6 items-center">
              <Text className="text-sm text-gray-500 mb-3">No active leases</Text>
              <TouchableOpacity 
                onPress={() => {
                  haptic.light();
                  router.push('/contracts');
                }} 
                className="bg-[#4cae4f] px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-bold text-sm">View Leases</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Farm Updates */}
        {updates.length > 0 && (
          <View className="px-4 pt-6">
            <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-bold text-[#111811] dark:text-white">Recent Updates</Text>
                <TouchableOpacity onPress={() => selectedContract && router.push(`/updates/${selectedContract.id}`)}>
                  <Text className="text-xs font-bold text-[#4cae4f]">View All</Text>
                </TouchableOpacity>
              </View>
              {(updates as FarmUpdate[]).slice(0, 2).map((update: FarmUpdate) => (
                <View key={update.id} className="mb-3 pb-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
                  <Text className="text-sm font-bold text-[#111811] dark:text-white mb-1" numberOfLines={2}>{update.caption || 'Farm Update'}</Text>
                  <Text className="text-xs text-gray-400">{new Date(update.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Farm Overview / Weather */}
        <View className="px-4 pt-6">
          <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="font-bold text-[#111811] dark:text-white">
                {weather ? weather.description : 'Farm Overview'}
              </Text>
              {weather && (
                <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  <Text className="text-xs font-medium text-green-800 dark:text-green-200">Live Weather</Text>
                </View>
              )}
            </View>

            <View className="flex-row flex-wrap gap-4">
              {weather ? (
                <>
                  {/* Temperature */}
                  <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg flex-1 min-w-[45%]">
                    <View className="flex-row items-center gap-2 mb-1">
                      <ThermometerSun size={14} color="#f59e0b" />
                      <Text className="text-xs font-medium uppercase text-[#608562]">Temp</Text>
                    </View>
                    <Text className="text-lg font-bold text-[#111811] dark:text-white">
                      {weather.temperature}°C
                    </Text>
                    <Text className="text-[10px] text-gray-400">Feels like {weather.feels_like}°C</Text>
                  </View>
                  {/* Humidity */}
                  <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg flex-1 min-w-[45%]">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Droplets size={14} color="#3b82f6" />
                      <Text className="text-xs font-medium uppercase text-[#608562]">Humidity</Text>
                    </View>
                    <Text className="text-lg font-bold text-[#111811] dark:text-white">
                      {weather.humidity}%
                    </Text>
                  </View>
                  {/* Wind */}
                  <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg flex-1 min-w-[45%]">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Wind size={14} color="#608562" />
                      <Text className="text-xs font-medium uppercase text-[#608562]">Wind</Text>
                    </View>
                    <Text className="text-lg font-bold text-[#111811] dark:text-white">
                      {weather.wind_speed} km/h
                    </Text>
                  </View>
                  {/* Season */}
                  <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg flex-1 min-w-[45%]">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Sun size={14} color="#f59e0b" />
                      <Text className="text-xs font-medium uppercase text-[#608562]">Season</Text>
                    </View>
                    <Text className="text-lg font-bold text-[#111811] dark:text-white">
                      {new Date().getMonth() >= 6 && new Date().getMonth() <= 9 ? 'Kharif' : 'Rabi'}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* Fallback: static tiles when weather is loading/unavailable */}
                  <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg flex-1 min-w-[45%]">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Sun size={14} color="#608562" />
                      <Text className="text-xs font-medium uppercase text-[#608562]">Season</Text>
                    </View>
                    <Text className="text-lg font-bold text-[#111811] dark:text-white">
                      {new Date().getMonth() >= 6 && new Date().getMonth() <= 9 ? 'Kharif' : 'Rabi'}
                    </Text>
                  </View>
                  <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg flex-1 min-w-[45%]">
                    <View className="flex-row items-center gap-2 mb-1">
                      <CloudRain size={14} color="#608562" />
                      <Text className="text-xs font-medium uppercase text-[#608562]">Contracts</Text>
                    </View>
                    <Text className="text-lg font-bold text-[#111811] dark:text-white">{contracts.length}</Text>
                  </View>
                  <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg flex-1 min-w-[45%]">
                    <View className="flex-row items-center gap-2 mb-1">
                      <History size={14} color="#608562" />
                      <Text className="text-xs font-medium uppercase text-[#608562]">Updates</Text>
                    </View>
                    <Text className="text-lg font-bold text-[#111811] dark:text-white">{updates.length}</Text>
                  </View>
                  <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg flex-1 min-w-[45%]">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Gauge size={14} color="#608562" />
                      <Text className="text-xs font-medium uppercase text-[#608562]">Status</Text>
                    </View>
                    <Text className="text-lg font-bold text-[#111811] dark:text-white">
                      {selectedContract?.status || 'N/A'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View className="px-4 pt-6">
          <Text className="text-sm font-bold text-[#111811] dark:text-white mb-3">{t('dashboard.quickActions')}</Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity 
              onPress={() => {
                haptic.light();
                selectedContract && router.push(`/updates/${selectedContract.id}`);
              }} 
              className="bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] flex-1 min-w-[140px] items-center"
              accessibilityLabel={t('dashboard.postUpdate')}
              accessibilityRole="button"
            >
              <View className="size-12 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-2">
                <Camera size={24} color="#3b82f6" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">{t('dashboard.postUpdate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                haptic.light();
                router.push('/listings');
              }} 
              className="bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] flex-1 min-w-[140px] items-center"
              accessibilityLabel={t('dashboard.manageListings')}
              accessibilityRole="button"
            >
              <View className="size-12 bg-green-50 dark:bg-green-900/20 rounded-full items-center justify-center mb-2">
                <Sprout size={24} color="#4cae4f" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">{t('dashboard.manageListings')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                haptic.light();
                router.push('/contracts');
              }} 
              className="bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] flex-1 min-w-[140px] items-center"
              accessibilityLabel={t('dashboard.leases')}
              accessibilityRole="button"
            >
              <View className="size-12 bg-amber-50 dark:bg-amber-900/20 rounded-full items-center justify-center mb-2">
                <History size={24} color="#f59e0b" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">{t('dashboard.leases')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                haptic.light();
                router.push('/deliveries');
              }} 
              className="bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] flex-1 min-w-[140px] items-center"
              accessibilityLabel={t('dashboard.deliveries')}
              accessibilityRole="button"
            >
              <View className="size-12 bg-purple-50 dark:bg-purple-900/20 rounded-full items-center justify-center mb-2">
                <Wallet size={24} color="#a855f7" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">{t('dashboard.deliveries')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-12 mb-4 px-4">
          <Text className="text-xs text-center text-gray-400">
            © {new Date().getFullYear()} FarmConnect. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
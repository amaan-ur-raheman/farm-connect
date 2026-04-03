import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Sun,
  Droplets,
  Wind,
  CloudRain,
  Gauge,
  History,
  Wallet,
  Bell,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Button } from '../src/components/ui/Button';
import api, { Contract, FarmUpdate } from '../src/config/api';
import { useAuthStore, useSocketStore } from '../src/stores';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [updates, setUpdates] = useState<FarmUpdate[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [payingWage, setPayingWage] = useState(false);
  const [wageAmount, setWageAmount] = useState('');

  const { socket } = useSocketStore();

  const fetchData = useCallback(async () => {
    setLoadingContracts(true);
    try {
      const [contractsRes, walletRes] = await Promise.all([
        api.get<{ data: Contract[] }>('/api/contracts/farmer'),
        api.get<{ data: { balance: number } }>('/api/wallet/balance').catch(() => ({ data: { data: { balance: 0 } } })),
      ]);
      const data: Contract[] = contractsRes.data.data || [];
      setContracts(data);
      if (data.length > 0 && !selectedContract) {
        setSelectedContract(data[0]);
      }
      const bal = walletRes.data.data;
      setWalletBalance(bal.balance || 0);

      // Fetch updates for selected contract
      if (selectedContract || data[0]) {
        const contractId = selectedContract?.id || data[0]?.id;
        try {
          const updatesRes = await api.get<{ data: FarmUpdate[] }>(`/api/updates/${contractId}`);
          setUpdates(updatesRes.data.data || []);
        } catch (err) {
          console.error('Failed to fetch farm updates:', err);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoadingContracts(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchData();
    };

    socket.on('contract_update', handleUpdate);
    socket.on('delivery_update', handleUpdate);
    socket.on('new_notification', handleUpdate);

    return () => {
      socket.off('contract_update', handleUpdate);
      socket.off('delivery_update', handleUpdate);
      socket.off('new_notification', handleUpdate);
    };
  }, [socket, fetchData]);

  const handlePayWage = async () => {
    if (!selectedContract) return;
    const amount = parseFloat(wageAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid wage amount.');
      return;
    }
    setPayingWage(true);
    try {
      await api.post(`/api/contracts/${selectedContract.id}/action`, { action: 'release_wage', amount });
      setWageAmount('');
      await fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to release wage.');
    } finally {
      setPayingWage(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  // Get user avatar from auth store
  const { authUser } = useAuthStore();
  const userImage = authUser?.avatar_url 
    ? { uri: authUser.avatar_url } 
    : undefined;

  return (
    <View className="flex-1 bg-[#f6f7f6] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />

      <Header
        variant="menu"
        userImage={userImage}
        onAvatarPress={() => router.push('/profile')}
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
                Daily Progress
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

        {/* Wallet Balance Quick View */}
        <View className="px-4 pt-4">
          <TouchableOpacity onPress={() => router.push('/wallet')} className="bg-[#4cae4f]/10 rounded-xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="size-10 bg-[#4cae4f] rounded-full items-center justify-center">
                <Wallet size={20} color="white" />
              </View>
              <View>
                <Text className="text-[10px] font-semibold text-[#608562] uppercase">Wallet Balance</Text>
                <Text className="text-xl font-bold text-[#111811] dark:text-white">₹{(walletBalance || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#4cae4f" />
          </TouchableOpacity>
        </View>

        {/* Field Selector & Date */}
        <View className="px-4 pt-4 flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => router.push('/contracts')}
              className="bg-white dark:bg-[#1e291e] border border-[#eaf0ea] dark:border-[#2a382a] rounded-lg px-4 py-2.5 flex-row items-center justify-between"
            >
              <Text className="text-sm font-medium text-[#111811] dark:text-white" numberOfLines={1}>
                {selectedContract?.listing?.name || 'Select Contract'}
              </Text>
              <ChevronDown size={14} color="#608562" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-white dark:bg-[#1e291e] border border-[#eaf0ea] dark:border-[#2a382a] rounded-lg p-1">
            <TouchableOpacity className="p-1.5">
              <ChevronLeft size={16} color="#608562" />
            </TouchableOpacity>
            <View className="px-3 border-x border-[#eaf0ea] dark:border-[#2a382a]">
              <Text className="text-sm font-bold text-[#111811] dark:text-white">
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity className="p-1.5">
              <ChevronRight size={16} color="#608562" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Action Card */}
        <View className="px-4 pt-6">
          {loadingContracts ? (
            <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6 flex items-center justify-center">
              <ActivityIndicator color="#4cae4f" />
            </View>
          ) : selectedContract ? (
            <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-lg border-2 border-[#4cae4f]/20 p-6 relative overflow-hidden">
              <View className="absolute top-0 right-0 p-4 opacity-10">
                <Text className="text-8xl font-black text-[#4cae4f]">₹</Text>
              </View>

              <View className="relative z-10">
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#608562] mb-1">
                  Contract Value
                </Text>
                <View className="flex-row items-baseline gap-1 mb-4">
                  <Text className="text-4xl font-bold text-[#111811] dark:text-white">
                    ₹{selectedContract.total_amount?.toLocaleString('en-IN')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {selectedContract.acreage} Acres
                  </Text>
                </View>

                <View className="flex-row justify-between text-sm text-gray-600 dark:text-gray-400 mb-6 bg-[#f9fbf9] dark:bg-black/20 p-3 rounded-lg">
                  <Text className="font-medium">Contract Active</Text>
                  <Text className="font-medium">{selectedContract.status}</Text>
                </View>

                <Button
                  title={payingWage ? 'Processing...' : 'Pay Daily Wage'}
                  className="w-full py-3.5 rounded-lg bg-[#4cae4f]"
                  textClassName="text-white font-bold"
                  onPress={handlePayWage}
                  disabled={payingWage || selectedContract.status !== 'ACTIVE'}
                />

                <View className="flex-row items-center justify-center mt-3 gap-1">
                  <Text className="text-xs text-gray-400">Secure transaction via AgriPay</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6 items-center">
              <Text className="text-sm text-gray-500 mb-3">No active contracts</Text>
              <TouchableOpacity onPress={() => router.push('/contracts')} className="bg-[#4cae4f] px-4 py-2 rounded-xl">
                <Text className="text-white font-bold text-sm">View Contracts</Text>
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
              {updates.slice(0, 2).map((update) => (
                <View key={update.id} className="mb-3 pb-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
                  <Text className="text-sm font-bold text-[#111811] dark:text-white mb-1">{update.title}</Text>
                  <Text className="text-xs text-gray-500" numberOfLines={2}>{update.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Field Conditions Card - Hidden until weather API integration */}
        {/* 
          TODO: Integrate weather API (e.g., OpenWeatherMap) 
          For now, showing basic date/time info only
        */}
        <View className="px-4 pt-6">
          <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="font-bold text-[#111811] dark:text-white">Farm Status</Text>
              <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                <Text className="text-xs font-medium text-green-800 dark:text-green-200">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg">
                <View className="flex-row items-center gap-2 mb-1">
                  <Sun size={14} color="#608562" />
                  <Text className="text-xs font-medium uppercase text-[#608562]">Season</Text>
                </View>
                <Text className="text-lg font-bold text-[#111811] dark:text-white">
                  {new Date().getMonth() >= 6 && new Date().getMonth() <= 9 ? 'Kharif' : 'Rabi'}
                </Text>
              </View>
              <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg">
                <View className="flex-row items-center gap-2 mb-1">
                  <CloudRain size={14} color="#608562" />
                  <Text className="text-xs font-medium uppercase text-[#608562]">Contracts</Text>
                </View>
                <Text className="text-lg font-bold text-[#111811] dark:text-white">{contracts.length}</Text>
              </View>
              <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg">
                <View className="flex-row items-center gap-2 mb-1">
                  <Wind size={14} color="#608562" />
                  <Text className="text-xs font-medium uppercase text-[#608562]">Updates</Text>
                </View>
                <Text className="text-lg font-bold text-[#111811] dark:text-white">{updates.length}</Text>
              </View>
              <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg">
                <View className="flex-row items-center gap-2 mb-1">
                  <Gauge size={14} color="#608562" />
                  <Text className="text-xs font-medium uppercase text-[#608562]">Status</Text>
                </View>
                <Text className="text-lg font-bold text-[#111811] dark:text-white">
                  {selectedContract?.status || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View className="px-4 pt-6">
          <Text className="text-sm font-bold text-[#111811] dark:text-white mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity onPress={() => router.push('/contracts')} className="bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] flex-1 min-w-[140px] items-center">
              <Text className="text-2xl mb-2">📋</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Contracts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/listings')} className="bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] flex-1 min-w-[140px] items-center">
              <Text className="text-2xl mb-2">🌾</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">My Listings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/deliveries')} className="bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] flex-1 min-w-[140px] items-center">
              <Text className="text-2xl mb-2">📦</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Deliveries</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/wallet')} className="bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] flex-1 min-w-[140px] items-center">
              <Text className="text-2xl mb-2">💰</Text>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Wallet</Text>
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
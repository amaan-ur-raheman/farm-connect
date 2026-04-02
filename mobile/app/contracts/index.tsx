import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { ChevronLeft, MapPin, Clock, CheckCircle, XCircle, MessageSquare, Package } from 'lucide-react-native';
import { router } from 'expo-router';
import api, { Contract } from '../../src/config/api';
import { useAuthStore } from '../../src/stores/authStore';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  ACTIVE: '#4cae4f',
  COMPLETED: '#3b82f6',
  CANCELLED: '#ef4444',
  DISPUTED: '#ef4444',
};

export default function ContractsScreen() {
  const { userRole } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');

  const fetchContracts = useCallback(async () => {
    try {
      const endpoint = userRole === 'farmer' ? '/api/contracts/farmer' : '/api/contracts/consumer';
      const res = await api.get<{ data: Contract[] }>(endpoint);
      setContracts(res.data.data || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts().finally(() => setRefreshing(false));
  };

  const handleAction = async (contractId: string, action: string) => {
    try {
      await api.post(`/api/contracts/${contractId}/action`, { action });
      fetchContracts();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed.');
    }
  };

  const handleStartChat = async (contract: Contract) => {
    const otherUserId = userRole === 'farmer' ? contract.consumer_id : contract.listing?.farmer_id;
    if (!otherUserId) return;
    try {
      const res = await api.post<{ data: { id: string } }>('/api/chat/conversations', {
        other_user_id: otherUserId,
        contract_id: contract.id,
      });
      const conversationId = res.data.data?.id;
      router.push(`/chat/${conversationId}`);
    } catch {
      Alert.alert('Error', 'Failed to start conversation.');
    }
  };

  const filteredContracts = filter === 'ALL' ? contracts : contracts.filter(c => c.status === filter);

  const filters = ['ALL', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

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
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center gap-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} color="#4cae4f" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">My Contracts</Text>
        <View className="ml-auto bg-[#4cae4f]/10 px-3 py-1 rounded-full">
          <Text className="text-xs font-bold text-[#4cae4f]">{contracts.length} Total</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <View className="flex-row gap-2">
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-2 rounded-full ${filter === f ? 'bg-[#4cae4f]' : 'bg-white dark:bg-[#1e291e] border border-gray-200 dark:border-gray-700'}`}
            >
              <Text className={`text-xs font-bold ${filter === f ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      >
        <View className="px-4 py-4">
          {filteredContracts.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">No contracts found</Text>
              <Text className="text-sm text-gray-500 text-center px-8">
                {filter !== 'ALL' ? `No ${filter.toLowerCase()} contracts.` : userRole === 'investor' ? 'Browse the marketplace to find farms to invest in.' : 'Your contracts will appear here when investors sign up.'}
              </Text>
              {userRole === 'investor' && filter === 'ALL' && (
                <TouchableOpacity onPress={() => router.push('/marketplace')} className="mt-4 bg-[#4cae4f] px-6 py-3 rounded-xl">
                  <Text className="text-white font-bold">Browse Marketplace</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredContracts.map((contract) => (
              <TouchableOpacity
                key={contract.id}
                onPress={() => router.push(`/contracts/${contract.id}`)}
                className="bg-white dark:bg-[#1e291e] rounded-2xl p-4 mb-4 border border-[#eaf0ea] dark:border-[#2a382a]"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className="size-2 rounded-full" style={{ backgroundColor: statusColors[contract.status] || '#6b7280' }} />
                    <Text className="text-xs font-bold uppercase" style={{ color: statusColors[contract.status] || '#6b7280' }}>
                      {contract.status}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-gray-400">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <Text className="text-base font-bold text-slate-900 dark:text-white mb-1" numberOfLines={1}>
                  {contract.listing?.name || 'Farm Contract'}
                </Text>
                {contract.listing && (
                  <View className="flex-row items-center mb-3">
                    <MapPin size={12} color="#6b7280" />
                    <Text className="text-xs text-gray-500 ml-1">{contract.listing.location_name}</Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-[10px] text-gray-400 uppercase">Amount/Cycle</Text>
                    <Text className="text-sm font-bold text-[#4cae4f]">₹{contract.amount_per_cycle.toLocaleString('en-IN')}</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-gray-400 uppercase">Cycles</Text>
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{contract.total_cycles}</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-gray-400 uppercase">Total</Text>
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">
                      ₹{(contract.amount_per_cycle * contract.total_cycles).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  {contract.status === 'PENDING' && userRole === 'farmer' && (
                    <>
                      <TouchableOpacity onPress={() => handleAction(contract.id, 'ACCEPT')} className="flex-1 bg-[#4cae4f] py-2.5 rounded-xl items-center">
                        <Text className="text-white font-bold text-xs">Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleAction(contract.id, 'REJECT')} className="flex-1 bg-red-500 py-2.5 rounded-xl items-center">
                        <Text className="text-white font-bold text-xs">Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {contract.status === 'ACTIVE' && (
                    <>
                      <TouchableOpacity onPress={() => router.push(`/contracts/${contract.id}`)} className="flex-1 bg-[#4cae4f] py-2.5 rounded-xl items-center">
                        <Text className="text-white font-bold text-xs">View Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleStartChat(contract)} className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl items-center">
                        <MessageSquare size={16} color="#4cae4f" />
                      </TouchableOpacity>
                    </>
                  )}
                  {(contract.status === 'COMPLETED' || contract.status === 'CANCELLED') && (
                    <TouchableOpacity onPress={() => router.push(`/contracts/${contract.id}`)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 rounded-xl items-center">
                      <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs">View Details</Text>
                    </TouchableOpacity>
                  )}
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

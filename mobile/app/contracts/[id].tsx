import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft, MapPin, MessageSquare, Package, Star, Clock, Wallet } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api, { Contract, FarmUpdate, Delivery, EscrowLedgerEntry } from '../../src/config/api';
import { useAuthStore } from '../../src/stores/authStore';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b', ACTIVE: '#4cae4f', COMPLETED: '#3b82f6', CANCELLED: '#ef4444', DISPUTED: '#ef4444',
};

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userRole } = useAuthStore();
  const [contract, setContract] = useState<Contract | null>(null);
  const [updates, setUpdates] = useState<FarmUpdate[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [escrow, setEscrow] = useState<EscrowLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [contractRes, updatesRes, deliveriesRes, escrowRes] = await Promise.all([
        api.get(`/api/contracts/${id}`).catch(() => null),
        api.get(`/api/updates/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/deliveries/contract/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/escrow/contracts/${id}/ledger`).catch(() => ({ data: { data: [] } })),
      ]);
      if (contractRes) setContract(contractRes.data.data || contractRes.data);
      setUpdates(updatesRes.data.data || updatesRes.data || []);
      setDeliveries(deliveriesRes.data.data || deliveriesRes.data || []);
      setEscrow(escrowRes.data.data || escrowRes.data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAction = async (action: string) => {
    try {
      await api.post(`/api/contracts/${id}/action`, { action });
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed.');
    }
  };

  const handleStartChat = async () => {
    if (!contract) return;
    const otherUserId = userRole === 'farmer' ? contract.consumer_id : contract.listing?.farmer_id;
    if (!otherUserId) return;
    try {
      const res = await api.post('/api/chat/conversations', {
        other_user_id: otherUserId,
        contract_id: contract.id,
      });
      router.push(`/chat/${res.data.data?.id || res.data.id}`);
    } catch {
      Alert.alert('Error', 'Failed to start conversation.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] items-center justify-center">
        <ActivityIndicator size="large" color="#4cae4f" />
      </View>
    );
  }

  if (!contract) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] items-center justify-center px-8">
        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contract Not Found</Text>
        <TouchableOpacity onPress={() => router.push('/contracts')} className="bg-[#4cae4f] px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Back to Contracts</Text>
        </TouchableOpacity>
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
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Contract Details</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View className="mx-4 mt-4 bg-white dark:bg-[#1e291e] rounded-2xl p-6 border border-[#eaf0ea] dark:border-[#2a382a]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900 dark:text-white" numberOfLines={1}>
              {contract.listing?.name || 'Farm Contract'}
            </Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: `${statusColors[contract.status] || '#6b7280'}20` }}>
              <Text className="text-xs font-bold" style={{ color: statusColors[contract.status] }}>{contract.status}</Text>
            </View>
          </View>
          {contract.listing && (
            <View className="flex-row items-center mb-4">
              <MapPin size={14} color="#6b7280" />
              <Text className="text-sm text-gray-500 ml-1">{contract.listing.location_name}</Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-[10px] text-gray-400 uppercase">Amount/Cycle</Text>
              <Text className="text-lg font-bold text-[#4cae4f]">₹{contract.amount_per_cycle.toLocaleString('en-IN')}</Text>
            </View>
            <View className="items-center">
              <Text className="text-[10px] text-gray-400 uppercase">Cycles</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">{contract.total_cycles}</Text>
            </View>
            <View className="items-center">
              <Text className="text-[10px] text-gray-400 uppercase">Total</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                ₹{(contract.amount_per_cycle * contract.total_cycles).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="mx-4 mt-4 flex-row gap-3">
          {contract.status === 'PENDING' && userRole === 'farmer' && (
            <>
              <TouchableOpacity onPress={() => handleAction('ACCEPT')} className="flex-1 bg-[#4cae4f] py-3 rounded-xl items-center">
                <Text className="text-white font-bold">Accept Contract</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAction('REJECT')} className="flex-1 bg-red-500 py-3 rounded-xl items-center">
                <Text className="text-white font-bold">Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {contract.status === 'ACTIVE' && (
            <>
              {userRole === 'farmer' && (
                <TouchableOpacity onPress={() => handleAction('COMPLETE')} className="flex-1 bg-blue-500 py-3 rounded-xl items-center">
                  <Text className="text-white font-bold">Mark Complete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleAction('CANCEL')} className="flex-1 bg-red-500 py-3 rounded-xl items-center">
                <Text className="text-white font-bold">Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={handleStartChat} className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl items-center">
            <MessageSquare size={20} color="#4cae4f" />
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View className="mx-4 mt-4 flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push(`/updates/${contract.id}`)}
            className="flex-1 bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] items-center"
          >
            <Clock size={20} color="#4cae4f" />
            <Text className="text-xs font-bold text-slate-900 dark:text-white mt-2">Updates ({updates.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/deliveries?contractId=${contract.id}`)}
            className="flex-1 bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] items-center"
          >
            <Package size={20} color="#f59e0b" />
            <Text className="text-xs font-bold text-slate-900 dark:text-white mt-2">Deliveries ({deliveries.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/reviews?contractId=${contract.id}`)}
            className="flex-1 bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] items-center"
          >
            <Star size={20} color="#facc15" />
            <Text className="text-xs font-bold text-slate-900 dark:text-white mt-2">Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Escrow Ledger */}
        <View className="mx-4 mt-4 mb-8">
          <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Escrow Ledger</Text>
          {escrow.length === 0 ? (
            <View className="bg-white dark:bg-[#1e291e] rounded-xl p-6 items-center border border-[#eaf0ea] dark:border-[#2a382a]">
              <Wallet size={24} color="#94a3b8" />
              <Text className="text-sm text-gray-500 mt-2">No escrow transactions yet</Text>
            </View>
          ) : (
            escrow.map((entry) => (
              <View key={entry.id} className="bg-white dark:bg-[#1e291e] rounded-xl p-4 mb-3 border border-[#eaf0ea] dark:border-[#2a382a] flex-row items-center">
                <View className="size-10 rounded-full bg-[#4cae4f]/10 items-center justify-center mr-3">
                  <Wallet size={20} color="#4cae4f" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">{entry.event}</Text>
                  <Text className="text-xs text-gray-500">{entry.description}</Text>
                  <Text className="text-[10px] text-gray-400">{new Date(entry.created_at).toLocaleString()}</Text>
                </View>
                <Text className="text-sm font-bold text-[#4cae4f]">₹{entry.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))
          )}
        </View>

        {/* Farm Updates Preview */}
        {updates.length > 0 && (
          <View className="mx-4 mb-8">
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Updates</Text>
            {updates.slice(0, 3).map((update) => (
              <View key={update.id} className="bg-white dark:bg-[#1e291e] rounded-xl p-4 mb-3 border border-[#eaf0ea] dark:border-[#2a382a]">
                <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1">{update.title}</Text>
                <Text className="text-xs text-gray-500 mb-2" numberOfLines={2}>{update.description}</Text>
                <Text className="text-[10px] text-gray-400">{new Date(update.created_at).toLocaleString()}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => router.push(`/updates/${contract.id}`)} className="items-center py-2">
              <Text className="text-sm font-bold text-[#4cae4f]">View All Updates</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { ChevronLeft, MapPin, MessageSquare, Package, Star, Clock, Wallet, CreditCard, CheckCircle } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api, { Contract, FarmUpdate, Delivery, EscrowLedgerEntry, Listing } from '../../src/config/api';
import { useAuthStore } from '../../src/stores/authStore';
import { startRazorpayPayment } from '../../src/utils/razorpay';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b', ACTIVE: '#4cae4f', COMPLETED: '#3b82f6', CANCELLED: '#ef4444', DISPUTED: '#a855f7',
};

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userRole } = useAuthStore();
  const [contract, setContract] = useState<Contract | null>(null);
  const [updates, setUpdates] = useState<FarmUpdate[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [escrow, setEscrow] = useState<EscrowLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [wageAmount, setWageAmount] = useState('');

  const fetchData = async () => {
    try {
      const [contractRes, updatesRes, deliveriesRes, escrowRes] = await Promise.all([
        api.get<{ data: Contract }>(`/api/contracts/${id}`).catch(() => null),
        api.get<{ data: FarmUpdate[] }>(`/api/updates/${id}`).catch(() => ({ data: { data: [] } })),
        api.get<{ data: Delivery[] }>(`/api/deliveries/contract/${id}`).catch(() => ({ data: { data: [] } })),
        api.get<{ data: EscrowLedgerEntry[] }>(`/api/escrow/contracts/${id}/ledger`).catch(() => ({ data: { data: [] } })),
      ]);
      if (contractRes) setContract(contractRes.data.data || null);
      setUpdates(updatesRes.data.data || []);
      setDeliveries(deliveriesRes.data.data || []);
      setEscrow(escrowRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch contract details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAction = async (action: string, payload: any = {}) => {
    setActionLoading(true);
    try {
      await api.post(`/api/contracts/${id}/action`, { action, ...payload });
      await fetchData();
      if (action === 'release_wage') setWageAmount('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!contract) return;
    const remaining = (contract.total_amount || 0) - (contract.escrow_held || 0);

    if (remaining <= 0) {
      Alert.alert('Escrow Full', 'Total contract amount is already in escrow.');
      return;
    }

    try {
      await startRazorpayPayment({
        amount: remaining,
        contract_id: contract.id,
        description: `Payment for ${contract.listing?.name || 'contract'}`,
        prefill: {
          name: contract.listing?.farmer?.name || '',
          contact: contract.listing?.farmer?.phone || '',
        },
      });
      Alert.alert('Success', 'Escrow deposit successful!');
      fetchData();
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'Deposit failed.');
    }
  };

  const handleStartChat = async () => {
    if (!contract) return;
    const otherUserId = userRole === 'farmer' ? contract.consumer_id : contract.listing?.farmer_id;
    if (!otherUserId) {
      Alert.alert('Error', 'Could not find the other user.');
      return;
    }
    try {
      const res = await api.post<{ data: { id: string } }>('/api/chat/conversations', {
        participant_id: otherUserId,
        contract_id: contract.id,
      });
      router.push(`/chat/${res.data.data?.id || ''}`);
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to start conversation.');
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

  const totalContractAmount = contract.total_amount || 0;

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
          <View className="flex-row justify-between mb-4">
            <View className="items-center">
              <Text className="text-[10px] text-gray-400 uppercase">Price/Acre</Text>
              <Text className="text-lg font-bold text-[#4cae4f]">₹{(contract.price_per_acre || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View className="items-center">
              <Text className="text-[10px] text-gray-400 uppercase">Acreage</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">{contract.acreage || 0}</Text>
            </View>
            <View className="items-center">
              <Text className="text-[10px] text-gray-400 uppercase">Total</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                ₹{totalContractAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View className="pt-4 border-t border-[#eaf0ea] dark:border-[#2a382a] flex-row justify-between">
            <View>
              <Text className="text-[10px] text-gray-400 uppercase">Escrow Held</Text>
              <Text className="text-sm font-bold text-[#f59e0b]">₹{(contract.escrow_held || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] text-gray-400 uppercase">Paid to Farmer</Text>
              <Text className="text-sm font-bold text-[#3b82f6]">₹{(contract.farmer_paid || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="mx-4 mt-4">
          {contract.status === 'PENDING' && userRole === 'farmer' && (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleAction('accept')}
                disabled={actionLoading}
                className="flex-1 bg-[#4cae4f] py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold">{actionLoading ? '...' : 'Accept'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAction('reject')}
                disabled={actionLoading}
                className="flex-1 bg-red-500 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold">Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {contract.status === 'ACTIVE' && (
            <View className="gap-3">
              {userRole === 'investor' && contract.escrow_held < totalContractAmount && (
                <TouchableOpacity
                  onPress={handleDeposit}
                  className="bg-[#4cae4f] py-4 rounded-xl items-center flex-row justify-center gap-2"
                >
                  <CreditCard size={20} color="white" />
                  <Text className="text-white font-bold">Deposit Funds to Escrow</Text>
                </TouchableOpacity>
              )}

              {userRole === 'farmer' && (
                <View className="bg-white dark:bg-[#1e291e] p-4 rounded-xl border border-[#eaf0ea] dark:border-[#2a382a]">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white mb-2">Wage Release Request</Text>
                  <View className="flex-row gap-2">
                    <TextInput
                      placeholder="Amount"
                      keyboardType="numeric"
                      value={wageAmount}
                      onChangeText={setWageAmount}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-slate-900 dark:text-white"
                    />
                    <TouchableOpacity
                      onPress={() => handleAction('release_wage', { amount: parseFloat(wageAmount) })}
                      disabled={actionLoading || !wageAmount}
                      className="bg-[#4cae4f] px-4 py-2 rounded-lg justify-center"
                    >
                      <Text className="text-white font-bold">Release</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View className="flex-row gap-3">
                {userRole === 'farmer' && (
                  <TouchableOpacity
                    onPress={() => handleAction('settlement')}
                    disabled={actionLoading}
                    className="flex-1 bg-blue-500 py-3 rounded-xl items-center flex-row justify-center gap-2"
                  >
                    <CheckCircle size={18} color="white" />
                    <Text className="text-white font-bold">Final Settlement</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleAction('cancel')}
                  disabled={actionLoading}
                  className="flex-1 bg-red-100 dark:bg-red-900/30 py-3 rounded-xl items-center"
                >
                  <Text className="text-red-500 font-bold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <TouchableOpacity onPress={handleStartChat} className="mt-3 bg-slate-100 dark:bg-slate-800 py-3 rounded-xl items-center flex-row justify-center gap-2">
            <MessageSquare size={18} color="#4cae4f" />
            <Text className="text-slate-900 dark:text-white font-bold">Chat with {userRole === 'farmer' ? 'Consumer' : 'Farmer'}</Text>
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

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import {
  MapPin,
  MessageSquare,
  Package,
  Star,
  Clock,
  Wallet,
  CreditCard,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  ChevronRight,
  Sprout,
  Users,
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Header } from '../../src/components/ui/Header';
import api, { Contract, FarmUpdate, Delivery, EscrowLedgerEntry, Listing } from '../../src/config/api';
import { useAuthStore } from '../../src/stores/authStore';
import { startRazorpayPayment } from '../../src/utils/razorpay';

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  PENDING: { color: '#f59e0b', bg: '#fef3c7', icon: Clock, label: 'Pending' },
  ACTIVE: { color: '#4cae4f', bg: '#dcfce7', icon: CheckCircle, label: 'Active' },
  COMPLETED: { color: '#3b82f6', bg: '#dbeafe', icon: FileText, label: 'Completed' },
  CANCELLED: { color: '#ef4444', bg: '#fee2e2', icon: XCircle, label: 'Cancelled' },
  DISPUTED: { color: '#a855f7', bg: '#f3e8ff', icon: AlertCircle, label: 'Disputed' },
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
      const res = await api.post<{ id: string }>('/api/chat/conversations', {
        participant_id: otherUserId,
        contract_id: contract.id,
      });
      router.push(`/chat/${res.data.id}`);
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to start conversation.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] items-center justify-center">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4cae4f" />
      </View>
    );
  }

  if (!contract) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] items-center justify-center px-8">
        <StatusBar barStyle="dark-content" />
        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contract Not Found</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity onPress={() => fetchData()} className="bg-[#4cae4f] px-6 py-3 rounded-xl">
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/contracts')} className="bg-gray-200 dark:bg-gray-700 px-6 py-3 rounded-xl">
            <Text className="text-slate-900 dark:text-white font-bold">Back to Contracts</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalContractAmount = contract.total_amount || 0;
  const escrowHeld = contract.escrow_held || 0;
  const escrowProgress = totalContractAmount > 0 ? Math.min(escrowHeld / totalContractAmount, 1) : 0;
  const config = statusConfig[contract.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <Header variant="back-title" title="Contract" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Status Card */}
        <View className="mx-4 mt-4 bg-white dark:bg-[#1e291e] rounded-2xl overflow-hidden border border-[#eaf0ea] dark:border-[#2a382a]">
          <View className="h-1.5" style={{ backgroundColor: config.color }} />
          <View className="p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2 flex-1 mr-3">
                <View className="size-10 rounded-full items-center justify-center" style={{ backgroundColor: config.bg }}>
                  <StatusIcon size={20} color={config.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                    {contract.listing?.name || 'Farm Contract'}
                  </Text>
                  {contract.listing && (
                    <View className="flex-row items-center mt-0.5">
                      <MapPin size={12} color="#94a3b8" />
                      <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1" numberOfLines={1}>
                        {contract.listing.location_name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: config.bg }}>
                <Text className="text-xs font-bold" style={{ color: config.color }}>{config.label}</Text>
              </View>
            </View>

            {/* Escrow Progress */}
            <View className="mt-2 pt-4 border-t border-[#eaf0ea] dark:border-[#2a382a]">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Escrow Progress</Text>
                <Text className="text-xs font-bold" style={{ color: config.color }}>
                  {Math.round(escrowProgress * 100)}%
                </Text>
              </View>
              <View className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${escrowProgress * 100}%`,
                    backgroundColor: config.color,
                  }}
                />
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-[10px] text-gray-400">₹{escrowHeld.toLocaleString('en-IN')} held</Text>
                <Text className="text-[10px] text-gray-400">₹{totalContractAmount.toLocaleString('en-IN')} total</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Details */}
        <View className="mx-4 mt-4">
          <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">Financial Details</Text>
          <View className="bg-white dark:bg-[#1e291e] rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] overflow-hidden">
            <View className="flex-row border-b border-[#eaf0ea] dark:border-[#2a382a]">
              <View className="flex-1 p-4 items-center border-r border-[#eaf0ea] dark:border-[#2a382a]">
                <View className="size-9 rounded-lg bg-[#4cae4f]/10 items-center justify-center mb-2">
                  <Wallet size={18} color="#4cae4f" />
                </View>
                <Text className="text-[10px] text-gray-400 uppercase mb-0.5">Price/Acre</Text>
                <Text className="text-base font-bold text-[#4cae4f]">
                  ₹{(contract.price_per_acre || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="flex-1 p-4 items-center">
                <View className="size-9 rounded-lg bg-[#3b82f6]/10 items-center justify-center mb-2">
                  <Sprout size={18} color="#3b82f6" />
                </View>
                <Text className="text-[10px] text-gray-400 uppercase mb-0.5">Acreage</Text>
                <Text className="text-base font-bold text-slate-900 dark:text-white">{contract.acreage || 0}</Text>
              </View>
            </View>
            <View className="flex-row">
              <View className="flex-1 p-4 items-center border-r border-[#eaf0ea] dark:border-[#2a382a]">
                <View className="size-9 rounded-lg bg-[#f59e0b]/10 items-center justify-center mb-2">
                  <CreditCard size={18} color="#f59e0b" />
                </View>
                <Text className="text-[10px] text-gray-400 uppercase mb-0.5">Escrow Held</Text>
                <Text className="text-base font-bold text-[#f59e0b]">
                  ₹{escrowHeld.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="flex-1 p-4 items-center">
                <View className="size-9 rounded-lg bg-[#a855f7]/10 items-center justify-center mb-2">
                  <Users size={18} color="#a855f7" />
                </View>
                <Text className="text-[10px] text-gray-400 uppercase mb-0.5">Paid to Farmer</Text>
                <Text className="text-base font-bold text-[#3b82f6]">
                  ₹{(contract.farmer_paid || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-4 mt-4">
          {contract.status === 'PENDING' && userRole === 'farmer' && (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleAction('accept')}
                disabled={actionLoading}
                className="flex-1 bg-[#4cae4f] py-3.5 rounded-xl flex-row items-center justify-center gap-2"
              >
                <CheckCircle size={18} color="white" />
                <Text className="text-white font-bold">{actionLoading ? 'Processing...' : 'Accept Contract'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAction('reject')}
                disabled={actionLoading}
                className="flex-1 bg-red-500 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
              >
                <XCircle size={18} color="white" />
                <Text className="text-white font-bold">Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {contract.status === 'ACTIVE' && (
            <View className="gap-3">
              {userRole === 'consumer' && contract.escrow_held < totalContractAmount && (
                <TouchableOpacity
                  onPress={handleDeposit}
                  className="bg-[#4cae4f] py-4 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <CreditCard size={20} color="white" />
                  <Text className="text-white font-bold">Deposit Funds to Escrow</Text>
                </TouchableOpacity>
              )}

              {userRole === 'farmer' && (
                <View className="bg-white dark:bg-[#1e291e] p-4 rounded-xl border border-[#eaf0ea] dark:border-[#2a382a]">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Wallet size={16} color="#4cae4f" />
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">Wage Release Request</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TextInput
                      placeholder="Enter amount"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={wageAmount}
                      onChangeText={setWageAmount}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-3 text-slate-900 dark:text-white"
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const amount = parseFloat(wageAmount);
                        if (!isNaN(amount) && amount > 0) {
                          handleAction('release_wage', { amount });
                        }
                      }}
                      disabled={actionLoading || !wageAmount}
                      className="bg-[#4cae4f] px-5 rounded-lg flex-row items-center justify-center"
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
                    className="flex-1 bg-[#3b82f6] py-3.5 rounded-xl flex-row items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} color="white" />
                    <Text className="text-white font-bold">Final Settlement</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleAction('cancel')}
                  disabled={actionLoading}
                  className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <XCircle size={18} color="#ef4444" />
                  <Text className="text-red-500 font-bold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleStartChat}
            className="mt-3 bg-white dark:bg-[#1e291e] border border-[#eaf0ea] dark:border-[#2a382a] py-3.5 rounded-xl flex-row items-center justify-center gap-2"
          >
            <MessageSquare size={18} color="#4cae4f" />
            <Text className="text-slate-900 dark:text-white font-bold">
              Chat with {userRole === 'farmer' ? 'Consumer' : 'Farmer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View className="mx-4 mt-6">
          <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">Quick Links</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push(`/updates/${contract.id}`)}
              className="flex-1 bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] items-center"
            >
              <View className="size-10 rounded-full bg-[#4cae4f]/10 items-center justify-center mb-2">
                <Clock size={20} color="#4cae4f" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Updates</Text>
              {updates.length > 0 && (
                <Text className="text-[10px] text-gray-400 mt-0.5">{updates.length}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/deliveries?contractId=${contract.id}`)}
              className="flex-1 bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] items-center"
            >
              <View className="size-10 rounded-full bg-[#f59e0b]/10 items-center justify-center mb-2">
                <Package size={20} color="#f59e0b" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Deliveries</Text>
              {deliveries.length > 0 && (
                <Text className="text-[10px] text-gray-400 mt-0.5">{deliveries.length}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/reviews?contractId=${contract.id}`)}
              className="flex-1 bg-white dark:bg-[#1e291e] rounded-xl p-4 border border-[#eaf0ea] dark:border-[#2a382a] items-center"
            >
              <View className="size-10 rounded-full bg-[#facc15]/10 items-center justify-center mb-2">
                <Star size={20} color="#facc15" />
              </View>
              <Text className="text-xs font-bold text-slate-900 dark:text-white">Reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Escrow Ledger Timeline */}
        <View className="mx-4 mt-6 mb-4">
          <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">Escrow Ledger</Text>
          {escrow.length === 0 ? (
            <View className="bg-white dark:bg-[#1e291e] rounded-xl p-6 items-center border border-[#eaf0ea] dark:border-[#2a382a]">
              <View className="size-12 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-3">
                <Wallet size={24} color="#94a3b8" />
              </View>
              <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Transactions Yet</Text>
              <Text className="text-xs text-gray-500 text-center">Escrow activity will appear here once funds are deposited.</Text>
            </View>
          ) : (
            <View className="bg-white dark:bg-[#1e291e] rounded-xl border border-[#eaf0ea] dark:border-[#2a382a] p-4">
              {escrow.map((entry, index) => (
                <View key={entry.id} className="flex-row items-start">
                  {/* Timeline line + dot */}
                  <View className="items-center mr-3" style={{ paddingTop: 4 }}>
                    <View className="size-8 rounded-full bg-[#4cae4f]/10 items-center justify-center">
                      <Wallet size={16} color="#4cae4f" />
                    </View>
                    {index < escrow.length - 1 && (
                      <View className="w-0.5 h-10 bg-gray-200 dark:bg-gray-700 mt-1" />
                    )}
                  </View>
                  <View className="flex-1 pb-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">{entry.event}</Text>
                      <Text className="text-sm font-bold text-[#4cae4f]">₹{entry.amount.toLocaleString('en-IN')}</Text>
                    </View>
                    {entry.description && (
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.description}</Text>
                    )}
                    <Text className="text-[10px] text-gray-400 mt-1">
                      {new Date(entry.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Farm Updates Preview */}
        {updates.length > 0 && (
          <View className="mx-4 mb-8">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recent Updates</Text>
              <TouchableOpacity onPress={() => router.push(`/updates/${contract.id}`)}>
                <Text className="text-xs font-bold text-[#4cae4f]">View All</Text>
              </TouchableOpacity>
            </View>
            {updates.slice(0, 3).map((update) => (
              <TouchableOpacity
                key={update.id}
                onPress={() => router.push(`/updates/${contract.id}`)}
                className="bg-white dark:bg-[#1e291e] rounded-xl p-4 mb-3 border border-[#eaf0ea] dark:border-[#2a382a] flex-row items-start gap-3"
              >
                <View className="size-9 rounded-lg bg-[#4cae4f]/10 items-center justify-center flex-shrink-0 mt-0.5">
                  <Sprout size={18} color="#4cae4f" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1">{update.caption || 'Farm Update'}</Text>
                  <Text className="text-[10px] text-gray-400">
                    {new Date(update.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" className="flex-shrink-0 mt-2" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

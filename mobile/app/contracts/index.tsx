import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert } from 'react-native';
import {
  Plus,
  Sprout,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Wallet,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../../src/components/ui/Header';
import api, { Contract } from '../../src/config/api';
import { useAuthStore, useSocketStore } from '../../src/stores';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { haptic } from '../../src/utils/haptics';
import { useQuery } from '@tanstack/react-query';
import { ContractsResponseSchema } from '../../src/config/schemas';

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  PENDING: { color: '#f59e0b', bg: '#fef3c7', icon: Clock, label: 'Pending' },
  ACTIVE: { color: '#4cae4f', bg: '#dcfce7', icon: CheckCircle, label: 'Active' },
  COMPLETED: { color: '#3b82f6', bg: '#dbeafe', icon: FileText, label: 'Completed' },
  CANCELLED: { color: '#ef4444', bg: '#fee2e2', icon: XCircle, label: 'Cancelled' },
  DISPUTED: { color: '#a855f7', bg: '#f3e8ff', icon: AlertCircle, label: 'Disputed' },
};

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const config = statusConfig[status] || { color: '#6b7280', bg: '#f3f4f6', icon: FileText, label: status };
  const Icon = config.icon;
  const isMd = size === 'md';

  return (
    <View
      className="flex-row items-center rounded-full px-2.5 py-1"
      style={{ backgroundColor: config.bg }}
    >
      <Icon size={isMd ? 14 : 10} color={config.color} />
      <Text
        className={`font-bold uppercase ${isMd ? 'text-xs ml-1.5' : 'text-[10px] ml-1'}`}
        style={{ color: config.color }}
      >
        {config.label}
      </Text>
    </View>
  );
}

function StatTile({
  label,
  value,
  color,
  onPress,
  active,
}: {
  label: string;
  value: number;
  color: string;
  onPress: () => void;
  active: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        haptic.light();
        onPress();
      }}
      className="flex-1 bg-white dark:bg-[#1e291e] rounded-xl p-3 items-center border-2 transition-colors"
      style={{
        borderColor: active ? color : 'transparent',
      }}
    >
      <Text className="text-2xl font-bold" style={{ color }}>
        {value}
      </Text>
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mt-0.5">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function ContractsScreen() {
  const { isAuthenticated, userRole } = useAuthStore();
  const [filter, setFilter] = useState<string>('ALL');

  const { socket } = useSocketStore();

  const { data: contracts = [], isLoading: loading, refetch: refetchContracts, isRefetching: refreshing } = useQuery({
    queryKey: ['contracts', userRole],
    queryFn: async () => {
      const endpoint = userRole === 'farmer' ? '/api/contracts/farmer' : '/api/contracts/consumer';
      const res = await api.get(endpoint, undefined, ContractsResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      refetchContracts();
    };

    socket.on('contract_update', handleUpdate);
    socket.on('delivery_update', handleUpdate);

    return () => {
      socket.off('contract_update', handleUpdate);
      socket.off('delivery_update', handleUpdate);
    };
  }, [socket, refetchContracts]);

  const onRefresh = () => {
    if (!isAuthenticated) return;
    haptic.light();
    refetchContracts();
  };

  const handleAction = async (contractId: string, action: string) => {
    if (!isAuthenticated) return;
    haptic.light();
    try {
      await api.post(`/api/contracts/${contractId}/action`, { action });
      haptic.success();
      refetchContracts();
    } catch (err: any) {
      haptic.error();
      Alert.alert('Error', err.response?.data?.message || 'Action failed.');
    }
  };

  const handleStartChat = async (contract: Contract) => {
    const otherUserId = userRole === 'farmer' ? contract.consumer_id : contract.farmer_id;
    if (!otherUserId) {
      Alert.alert('Error', 'Could not find the other user.');
      return;
    }
    try {
      const res = await api.post<{ id: string }>('/api/chat/conversations', {
        participant_id: otherUserId,
        contract_id: contract.id,
      });
      const conversationId = res.data.id;
      router.push(`/chat/${conversationId}`);
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to start conversation.');
    }
  };

  const filteredContracts = filter === 'ALL' ? contracts : (contracts as Contract[]).filter((c: Contract) => c.status === filter);

  const getCount = (status: string) =>
    status === 'ALL' ? contracts.length : (contracts as Contract[]).filter((c: Contract) => c.status === status).length;

  if (loading) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
        <StatusBar barStyle="dark-content" />
        <Header variant="back-title" title="Contracts" />
        <View className="px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a]">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Skeleton width={160} height={18} />
                  <Skeleton width={100} height={14} style={{ marginTop: 6 }} />
                </View>
                <Skeleton width={70} height={24} borderRadius={12} />
              </View>
              <Skeleton width={200} height={16} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const activeCount = getCount('ACTIVE');
  const pendingCount = getCount('PENDING');
  const completedCount = getCount('COMPLETED');

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <Header variant="back-title" title="Contracts" />

      {/* Summary Stats */}
      <View className="px-4 py-3">
        <View className="flex-row gap-2">
          <StatTile label="Active" value={activeCount} color="#4cae4f" onPress={() => setFilter('ACTIVE')} active={filter === 'ACTIVE'} />
          <StatTile label="Pending" value={pendingCount} color="#f59e0b" onPress={() => setFilter('PENDING')} active={filter === 'PENDING'} />
          <StatTile label="Done" value={completedCount} color="#3b82f6" onPress={() => setFilter('COMPLETED')} active={filter === 'COMPLETED'} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      >
        <View className="px-4 py-2">
          {filteredContracts.length === 0 ? (
            <View className="items-center py-20">
              <View className="w-20 h-20 rounded-full bg-[#eaf0ea] dark:bg-[#2a382a] items-center justify-center mb-4">
                <FileText size={36} color="#94a3b8" />
              </View>
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                No {filter === 'ALL' ? '' : filter.toLowerCase()} Contracts
              </Text>
              <Text className="text-sm text-gray-500 text-center px-12 leading-relaxed">
                {filter !== 'ALL'
                  ? `You don't have any ${filter.toLowerCase()} contracts right now.`
                  : userRole === 'consumer'
                    ? 'Browse the marketplace to find farms to invest in.'
                    : 'Your contracts will appear here once investors sign up.'}
              </Text>
              {userRole === 'consumer' && filter === 'ALL' && (
                <TouchableOpacity
                  onPress={() => router.push('/marketplace')}
                  className="mt-5 bg-[#4cae4f] px-8 py-3 rounded-xl flex-row items-center gap-2"
                >
                  <TrendingUp size={18} color="white" />
                  <Text className="text-white font-bold">Browse Marketplace</Text>
                </TouchableOpacity>
              )}
              {userRole === 'farmer' && filter === 'ALL' && (
                <TouchableOpacity
                  onPress={() => router.push('/listings/create')}
                  className="mt-5 bg-[#4cae4f] px-8 py-3 rounded-xl flex-row items-center gap-2"
                >
                  <Plus size={18} color="white" />
                  <Text className="text-white font-bold">Create Your First Listing</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''}
                </Text>
                {filter !== 'ALL' && (
                  <TouchableOpacity onPress={() => setFilter('ALL')}>
                    <Text className="text-xs font-bold text-[#4cae4f]">Show All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {(filteredContracts as Contract[]).map((contract: Contract) => {
                const config = statusConfig[contract.status] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                const totalAmount = contract.total_amount || 0;

                return (
                  <TouchableOpacity
                    key={contract.id}
                    onPress={() => router.push(`/contracts/${contract.id}`)}
                    activeOpacity={0.7}
                    className="bg-white dark:bg-[#1e291e] rounded-2xl mb-3 border border-[#eaf0ea] dark:border-[#2a382a] overflow-hidden"
                  >
                    {/* Left accent bar */}
                    <View className="flex-row">
                      <View className="w-1.5 self-stretch" style={{ backgroundColor: config.color }} />

                      <View className="flex-1 p-4">
                        {/* Header row */}
                        <View className="flex-row items-start justify-between mb-3">
                          <View className="flex-1 mr-3">
                            <Text className="text-base font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                              {contract.listing?.name || 'Farm Contract'}
                            </Text>
                            {contract.listing && (
                              <View className="flex-row items-center mt-1">
                                <MapPin size={12} color="#94a3b8" />
                                <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1" numberOfLines={1}>
                                  {contract.listing.location_name}
                                </Text>
                              </View>
                            )}
                          </View>
                          <StatusBadge status={contract.status} />
                        </View>

                        {/* Financial row */}
                        <View className="flex-row items-center gap-4 mb-3 bg-gray-50 dark:bg-black/10 rounded-lg p-3">
                          <View className="flex-row items-center gap-1.5 flex-1">
                            <Wallet size={14} color="#4cae4f" />
                            <View>
                              <Text className="text-[10px] text-gray-400 uppercase">₹/Acre</Text>
                              <Text className="text-sm font-bold text-[#4cae4f]">
                                ₹{(contract.price_per_acre || 0).toLocaleString('en-IN')}
                              </Text>
                            </View>
                          </View>
                          <View className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                          <View className="flex-1">
                            <Text className="text-[10px] text-gray-400 uppercase">Acreage</Text>
                            <Text className="text-sm font-bold text-slate-900 dark:text-white">
                              {contract.acreage || 0}
                            </Text>
                          </View>
                          <View className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                          <View className="flex-1 items-end">
                            <Text className="text-[10px] text-gray-400 uppercase">Total</Text>
                            <Text className="text-sm font-bold text-slate-900 dark:text-white">
                              ₹{totalAmount.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>

                        {/* Action buttons */}
                        <View className="flex-row gap-2">
                          {contract.status === 'PENDING' && userRole === 'farmer' && (
                            <>
                              <TouchableOpacity
                                onPress={() => handleAction(contract.id, 'accept')}
                                className="flex-1 bg-[#4cae4f] py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
                              >
                                <CheckCircle size={14} color="white" />
                                <Text className="text-white font-bold text-xs">Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleAction(contract.id, 'reject')}
                                className="flex-1 bg-red-500 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
                              >
                                <XCircle size={14} color="white" />
                                <Text className="text-white font-bold text-xs">Reject</Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {contract.status === 'ACTIVE' && (
                            <>
                              <TouchableOpacity
                                onPress={() => router.push(`/contracts/${contract.id}`)}
                                className="flex-1 bg-[#4cae4f] py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
                              >
                                <FileText size={14} color="white" />
                                <Text className="text-white font-bold text-xs">View Details</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleStartChat(contract)}
                                className="bg-[#eaf0ea] dark:bg-[#2a382a] px-4 py-2.5 rounded-xl items-center justify-center"
                              >
                                <MessageSquare size={16} color="#4cae4f" />
                              </TouchableOpacity>
                            </>
                          )}
                          {(contract.status === 'COMPLETED' || contract.status === 'CANCELLED') && (
                            <View className="flex-1 flex-row items-center justify-between bg-gray-50 dark:bg-black/10 rounded-xl px-4 py-2.5">
                              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {new Date(contract.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </Text>
                              <ChevronRight size={16} color="#94a3b8" />
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  );
}

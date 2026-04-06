import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { ChevronLeft, Package, CheckCircle, Clock, Truck, X, Plus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api, { Delivery } from '../src/config/api';
import { useAuthStore } from '../src/stores/authStore';

const statusIcons: Record<string, any> = { 
  PENDING: Clock, 
  HARVESTED: Clock,
  IN_TRANSIT: Truck, 
  DELIVERED: Package, 
  VERIFIED: CheckCircle, 
  REJECTED: X 
};

const statusColors: Record<string, string> = { 
  PENDING: '#f59e0b', 
  HARVESTED: '#8b5cf6',
  IN_TRANSIT: '#3b82f6', 
  DELIVERED: '#10b981', 
  VERIFIED: '#4cae4f', 
  REJECTED: '#ef4444' 
};

export default function DeliveriesScreen() {
  const { contractId } = useLocalSearchParams();
  const { userRole } = useAuthStore();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New Delivery Form State
  const [newDelivery, setNewDelivery] = useState({
    batch_number: '',
    quantity_kg: '',
    quality_grade: '',
  });

  const fetchDeliveries = useCallback(async () => {
    try {
      const endpoint = contractId ? `/api/deliveries/contract/${contractId}` : '/api/deliveries';
      const res = await api.get<{ data: Delivery[] }>(endpoint);
      setDeliveries(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries().finally(() => setRefreshing(false));
  };

  const handleCreateDelivery = async () => {
    const quantity = parseFloat(newDelivery.quantity_kg);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }
    if (!contractId) return;
    try {
      await api.post('/api/deliveries', {
        contract_id: contractId,
        batch_number: newDelivery.batch_number,
        quantity_kg: quantity,
        quality_grade: newDelivery.quality_grade,
      });
      setShowCreateModal(false);
      setNewDelivery({ batch_number: '', quantity_kg: '', quality_grade: '' });
      fetchDeliveries();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create delivery.');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/deliveries/${id}/status`, { status });
      fetchDeliveries();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed.');
    }
  };

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await api.patch(`/api/deliveries/${id}/verify`, { status });
      fetchDeliveries();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Verification failed.');
    }
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
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Deliveries</Text>
        </View>
        {userRole === 'farmer' && contractId && (
          <TouchableOpacity onPress={() => setShowCreateModal(true)} className="p-2 bg-[#4cae4f]/10 rounded-full">
            <Plus size={24} color="#4cae4f" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}>
        <View className="px-4 py-4">
          {deliveries.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-4">📦</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">No deliveries yet</Text>
              <Text className="text-sm text-gray-500 text-center px-8">Delivery records will appear here once created by the farmer.</Text>
            </View>
          ) : (
            deliveries.map((delivery) => {
              const Icon = statusIcons[delivery.status] || Clock;
              const color = statusColors[delivery.status] || '#6b7280';
              return (
                <View key={delivery.id} className="bg-white dark:bg-[#1e291e] rounded-2xl p-4 mb-4 border border-[#eaf0ea] dark:border-[#2a382a]">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className="size-10 rounded-full items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                        <Icon size={20} color={color} />
                      </View>
                      <View>
                        <Text className="text-sm font-bold text-slate-900 dark:text-white">Batch #{delivery.batch_number}</Text>
                        <Text className="text-[10px] text-gray-400">{new Date(delivery.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <View className="px-3 py-1 rounded-full" style={{ backgroundColor: `${color}20` }}>
                      <Text className="text-[10px] font-bold" style={{ color }}>{delivery.status}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between mb-4">
                    <View>
                      <Text className="text-[10px] text-gray-400 uppercase">Quantity</Text>
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">{delivery.quantity_kg} kg</Text>
                    </View>
                    <View>
                      <Text className="text-[10px] text-gray-400 uppercase">Quality</Text>
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">{delivery.quality_grade}</Text>
                    </View>
                  </View>

                  {/* Farmer Actions */}
                  {userRole === 'farmer' && (
                    <View className="flex-row gap-2">
                      {delivery.status === 'PENDING' && (
                        <TouchableOpacity onPress={() => handleUpdateStatus(delivery.id, 'HARVESTED')} className="flex-1 bg-[#8b5cf6] py-3 rounded-xl items-center">
                          <Text className="text-white font-bold text-xs">Mark Harvested</Text>
                        </TouchableOpacity>
                      )}
                      {delivery.status === 'HARVESTED' && (
                        <TouchableOpacity onPress={() => handleUpdateStatus(delivery.id, 'IN_TRANSIT')} className="flex-1 bg-[#3b82f6] py-3 rounded-xl items-center">
                          <Text className="text-white font-bold text-xs">Dispatch</Text>
                        </TouchableOpacity>
                      )}
                      {delivery.status === 'IN_TRANSIT' && (
                        <TouchableOpacity onPress={() => handleUpdateStatus(delivery.id, 'DELIVERED')} className="flex-1 bg-[#10b981] py-3 rounded-xl items-center">
                          <Text className="text-white font-bold text-xs">Mark Delivered</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Investor Actions */}
                  {userRole === 'consumer' && delivery.status === 'DELIVERED' && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => handleVerify(delivery.id, 'VERIFIED')} className="flex-1 bg-[#4cae4f] py-3 rounded-xl items-center">
                        <Text className="text-white font-bold text-xs">Verify & Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleVerify(delivery.id, 'REJECTED')} className="flex-1 bg-[#ef4444] py-3 rounded-xl items-center">
                        <Text className="text-white font-bold text-xs">Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
          <View className="h-20" />
        </View>
      </ScrollView>

      {/* Create Delivery Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-[#1e291e] rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900 dark:text-white">Report New Delivery</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-xs font-bold text-gray-500 mb-2 uppercase">Batch Number</Text>
                <TextInput
                  placeholder="e.g. BATCH-001"
                  placeholderTextColor="#94a3b8"
                  value={newDelivery.batch_number}
                  onChangeText={(v) => setNewDelivery({...newDelivery, batch_number: v})}
                  className="bg-[#f9fbf9] dark:bg-[#151d15] p-4 rounded-xl text-slate-900 dark:text-white border border-[#eaf0ea] dark:border-[#2a382a]"
                />
              </View>
              <View>
                <Text className="text-xs font-bold text-gray-500 mb-2 uppercase">Quantity (kg)</Text>
                <TextInput
                  placeholder="e.g. 500"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={newDelivery.quantity_kg}
                  onChangeText={(v) => setNewDelivery({...newDelivery, quantity_kg: v})}
                  className="bg-[#f9fbf9] dark:bg-[#151d15] p-4 rounded-xl text-slate-900 dark:text-white border border-[#eaf0ea] dark:border-[#2a382a]"
                />
              </View>
              <View>
                <Text className="text-xs font-bold text-gray-500 mb-2 uppercase">Quality Grade</Text>
                <TextInput
                  placeholder="e.g. Grade A+"
                  placeholderTextColor="#94a3b8"
                  value={newDelivery.quality_grade}
                  onChangeText={(v) => setNewDelivery({...newDelivery, quality_grade: v})}
                  className="bg-[#f9fbf9] dark:bg-[#151d15] p-4 rounded-xl text-slate-900 dark:text-white border border-[#eaf0ea] dark:border-[#2a382a]"
                />
              </View>

              <TouchableOpacity onPress={handleCreateDelivery} className="bg-[#4cae4f] p-4 rounded-xl items-center mt-2">
                <Text className="text-white font-bold text-lg">Create Delivery Record</Text>
              </TouchableOpacity>
            </View>
            <View className="h-10" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { ChevronLeft, Package, CheckCircle, Clock, Truck } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api, { Delivery } from '../src/config/api';
import { useAuthStore } from '../src/stores/authStore';

const statusIcons: Record<string, any> = { PENDING: Clock, IN_TRANSIT: Truck, DELIVERED: Package, VERIFIED: CheckCircle, REJECTED: Clock };
const statusColors: Record<string, string> = { PENDING: '#f59e0b', IN_TRANSIT: '#3b82f6', DELIVERED: '#4cae4f', VERIFIED: '#22c55e', REJECTED: '#ef4444' };

export default function DeliveriesScreen() {
  const { contractId } = useLocalSearchParams();
  const { userRole } = useAuthStore();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    try {
      const endpoint = contractId ? `/api/deliveries/contract/${contractId}` : '/api/deliveries';
      const res = await api.get<{ data: Delivery[] }>(endpoint).catch(() => ({ data: { data: [] } }));
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

  const handleVerify = async (id: string) => {
    try {
      await api.patch(`/api/deliveries/${id}/verify`);
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
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center gap-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} color="#4cae4f" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Deliveries</Text>
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
                  <View className="flex-row justify-between mb-3">
                    <View>
                      <Text className="text-[10px] text-gray-400 uppercase">Quantity</Text>
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">{delivery.quantity_kg} kg</Text>
                    </View>
                    <View>
                      <Text className="text-[10px] text-gray-400 uppercase">Quality</Text>
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">{delivery.quality_grade}</Text>
                    </View>
                  </View>
                  {delivery.status === 'DELIVERED' && userRole === 'investor' && (
                    <TouchableOpacity onPress={() => handleVerify(delivery.id)} className="bg-[#4cae4f] py-3 rounded-xl items-center">
                      <Text className="text-white font-bold text-sm">Verify Delivery</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  );
}

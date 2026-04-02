import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { ChevronLeft, AlertTriangle, Plus, X } from 'lucide-react-native';
import { router } from 'expo-router';
import api, { Dispute } from '../src/config/api';

const statusColors: Record<string, string> = { OPEN: '#f59e0b', UNDER_REVIEW: '#3b82f6', RESOLVED: '#4cae4f', ESCALATED: '#ef4444' };

export default function DisputesScreen() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [contractId, setContractId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = useCallback(async () => {
    try {
      const res = await api.get('/api/disputes');
      setDisputes(res.data.data || res.data || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDisputes().finally(() => setRefreshing(false));
  };

  const handleSubmit = async () => {
    if (!contractId || !reason || !description) { Alert.alert('Missing Fields', 'All fields are required.'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/disputes', { contract_id: contractId, reason, description, evidence_urls: [] });
      setContractId(''); setReason(''); setDescription(''); setShowForm(false);
      fetchDisputes();
      Alert.alert('Success', 'Dispute filed successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to file dispute.');
    } finally {
      setSubmitting(false);
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
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Disputes</Text>
        </View>
        {!showForm && (
          <TouchableOpacity onPress={() => setShowForm(true)} className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center gap-2">
            <Plus size={16} color="white" />
            <Text className="text-white font-bold text-sm">File</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}>
        <View className="px-4 py-4">
          {showForm && (
            <View className="bg-white dark:bg-[#1e291e] rounded-2xl p-4 mb-4 border border-[#eaf0ea] dark:border-[#2a382a]">
              <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">File a Dispute</Text>
              <TextInput value={contractId} onChangeText={setContractId} placeholder="Contract ID" placeholderTextColor="#9ca3af" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f9fbf9] dark:bg-[#151d15] text-sm text-slate-900 dark:text-white mb-3" />
              <TextInput value={reason} onChangeText={setReason} placeholder="Reason for dispute" placeholderTextColor="#9ca3af" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f9fbf9] dark:bg-[#151d15] text-sm text-slate-900 dark:text-white mb-3" />
              <TextInput value={description} onChangeText={setDescription} placeholder="Describe the issue in detail..." placeholderTextColor="#9ca3af" multiline numberOfLines={4} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f9fbf9] dark:bg-[#151d15] text-sm text-slate-900 dark:text-white mb-3" style={{ textAlignVertical: 'top' }} />
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center">
                  <Text className="text-slate-700 dark:text-slate-300 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} disabled={submitting} className={`flex-1 py-3 rounded-xl bg-red-500 items-center ${submitting ? 'opacity-60' : ''}`}>
                  {submitting ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-bold">File Dispute</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {disputes.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-4">⚖️</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">No disputes</Text>
              <Text className="text-sm text-gray-500 text-center px-8">Your filed disputes will appear here.</Text>
            </View>
          ) : (
            disputes.map((dispute) => (
              <View key={dispute.id} className="bg-white dark:bg-[#1e291e] rounded-2xl p-4 mb-4 border border-[#eaf0ea] dark:border-[#2a382a]">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <AlertTriangle size={20} color={statusColors[dispute.status] || '#6b7280'} />
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{dispute.reason}</Text>
                  </View>
                  <View className="px-3 py-1 rounded-full" style={{ backgroundColor: `${statusColors[dispute.status] || '#6b7280'}20` }}>
                    <Text className="text-[10px] font-bold" style={{ color: statusColors[dispute.status] }}>{dispute.status}</Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-600 dark:text-gray-400 mb-2" numberOfLines={3}>{dispute.description}</Text>
                <Text className="text-[10px] text-gray-400">Filed: {new Date(dispute.created_at).toLocaleDateString()}</Text>
              </View>
            ))
          )}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  );
}

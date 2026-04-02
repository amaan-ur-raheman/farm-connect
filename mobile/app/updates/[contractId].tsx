import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, TextInput, Image, Alert } from 'react-native';
import { ChevronLeft, Plus, Clock, Camera, X } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api, { FarmUpdate } from '../../src/config/api';
import { useAuthStore } from '../../src/stores/authStore';

export default function UpdatesScreen() {
  const { contractId } = useLocalSearchParams();
  const { userRole } = useAuthStore();
  const [updates, setUpdates] = useState<FarmUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await api.get<{ data: FarmUpdate[] }>(`/api/updates/${contractId}`);
      setUpdates(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch farm updates:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUpdates().finally(() => setRefreshing(false));
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Grant photo library permission.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.7 });
    if (!result.canceled) {
      setMediaUrls(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) { Alert.alert('Missing Fields', 'Title and description are required.'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/updates', {
        contract_id: contractId,
        title,
        description,
        media_urls: mediaUrls,
      });
      setTitle(''); setDescription(''); setMediaUrls([]); setShowForm(false);
      fetchUpdates();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post update.');
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
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Farm Updates</Text>
        </View>
        {userRole === 'farmer' && !showForm && (
          <TouchableOpacity onPress={() => setShowForm(true)} className="bg-[#4cae4f] px-4 py-2 rounded-xl flex-row items-center gap-2">
            <Plus size={16} color="white" />
            <Text className="text-white font-bold text-sm">Post</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      >
        <View className="px-4 py-4">
          {/* Post Form */}
          {showForm && (
            <View className="bg-white dark:bg-[#1e291e] rounded-2xl p-4 mb-4 border border-[#eaf0ea] dark:border-[#2a382a]">
              <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">New Update</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Update title" placeholderTextColor="#9ca3af" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f9fbf9] dark:bg-[#151d15] text-sm text-slate-900 dark:text-white mb-3" />
              <TextInput value={description} onChangeText={setDescription} placeholder="Describe the update..." placeholderTextColor="#9ca3af" multiline numberOfLines={4} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f9fbf9] dark:bg-[#151d15] text-sm text-slate-900 dark:text-white mb-3" style={{ textAlignVertical: 'top' }} />
              <View className="flex-row flex-wrap gap-2 mb-3">
                {mediaUrls.map((uri, i) => (
                  <View key={i} className="relative">
                    <Image source={{ uri }} className="w-16 h-16 rounded-lg" resizeMode="cover" />
                    <TouchableOpacity onPress={() => setMediaUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full items-center justify-center">
                      <X size={10} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                {mediaUrls.length < 5 && (
                  <TouchableOpacity onPress={pickMedia} className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center">
                    <Camera size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center">
                  <Text className="text-slate-700 dark:text-slate-300 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} disabled={submitting} className={`flex-1 py-3 rounded-xl bg-[#4cae4f] items-center ${submitting ? 'opacity-60' : ''}`}>
                  {submitting ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-bold">Post Update</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Updates List */}
          {updates.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">No updates yet</Text>
              <Text className="text-sm text-gray-500 text-center px-8">
                {userRole === 'farmer' ? 'Post farm updates to keep investors informed.' : 'Updates from the farmer will appear here.'}
              </Text>
            </View>
          ) : (
            updates.map((update) => (
              <View key={update.id} className="bg-white dark:bg-[#1e291e] rounded-2xl p-4 mb-4 border border-[#eaf0ea] dark:border-[#2a382a]">
                <View className="flex-row items-center gap-2 mb-2">
                  <Clock size={14} color="#4cae4f" />
                  <Text className="text-[10px] text-gray-400">{new Date(update.created_at).toLocaleString()}</Text>
                </View>
                <Text className="text-base font-bold text-slate-900 dark:text-white mb-2">{update.title}</Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{update.description}</Text>
                {update.media_urls && update.media_urls.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                    {update.media_urls.map((url, i) => (
                      <Image key={i} source={{ uri: url }} className="w-40 h-28 rounded-xl" resizeMode="cover" />
                    ))}
                  </ScrollView>
                )}
              </View>
            ))
          )}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  );
}

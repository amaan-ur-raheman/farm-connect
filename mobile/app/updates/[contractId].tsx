import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, TextInput, Image, Alert } from 'react-native';
import { ChevronLeft, Plus, Clock, Camera, X } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api, { FarmUpdate } from '../../src/config/api';
import { useAuthStore } from '../../src/stores/authStore';
import NetInfo from '@react-native-community/netinfo';
import { SyncQueue } from '../../src/utils/syncQueue';
import { haptic } from '../../src/utils/haptics';

export default function UpdatesScreen() {
  const { contractId } = useLocalSearchParams();
  const { userRole } = useAuthStore();
  const [updates, setUpdates] = useState<FarmUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
      if (!caption && !mediaUri) {
        Alert.alert('Error', 'Please provide a caption or image.');
        return;
      }

      setSubmitting(true);
      haptic.light();

      try {
        const netInfo = await NetInfo.fetch();

        const formData = new FormData();
        formData.append('contract_id', contractId as string);
        if (caption) formData.append('caption', caption);
        if (mediaUri) {
          // @ts-ignore - React Native FormData file attachment
          formData.append('media', {
            uri: mediaUri,
            name: 'update.jpg',
            type: 'image/jpeg',
          } as any);
        }

        if (netInfo.isConnected) {
          await api.post('/api/updates', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          haptic.success();
          Alert.alert('Success', 'Update posted successfully!');
          setCaption('');
          setMediaUri(null);
          setShowForm(false);
          fetchUpdates();
        } else {
          await SyncQueue.enqueue({
            url: '/api/updates',
            method: 'POST',
            body: {
              contract_id: contractId,
              caption: caption,
              media_url: mediaUri, // Note: This will be a local URI, uploading requires special handling when online
            },
          });
          haptic.success();
          Alert.alert('Offline Mode', 'Your update has been saved and will sync when you are back online.');
          setCaption('');
          setMediaUri(null);
          setShowForm(false);
        }
      } catch (err: any) {
        haptic.error();
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
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Describe the update..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f9fbf9] dark:bg-[#151d15] text-sm text-slate-900 dark:text-white mb-3"
                style={{ textAlignVertical: 'top' }}
              />

              {/* Media Preview */}
              {mediaUri ? (
                <View className="relative mb-3">
                  <Image source={{ uri: mediaUri }} className="w-full h-40 rounded-xl" resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setMediaUri(null)}
                    className="absolute top-2 right-2 size-6 bg-red-500 rounded-full items-center justify-center"
                  >
                    <X size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickMedia}
                  className="w-full h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center mb-3"
                >
                  <Camera size={24} color="#94a3b8" />
                  <Text className="text-xs text-gray-400 mt-2">Tap to add a photo</Text>
                </TouchableOpacity>
              )}

              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => { setShowForm(false); setCaption(''); setMediaUri(null); }} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center">
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
                {userRole === 'farmer' ? 'Post farm updates with photos to keep investors informed.' : 'Updates from the farmer will appear here.'}
              </Text>
            </View>
          ) : (
            updates.map((update) => (
              <View key={update.id} className="bg-white dark:bg-[#1e291e] rounded-2xl p-4 mb-4 border border-[#eaf0ea] dark:border-[#2a382a]">
                <View className="flex-row items-center gap-2 mb-2">
                  <Clock size={14} color="#4cae4f" />
                  <Text className="text-[10px] text-gray-400">{new Date(update.created_at).toLocaleString()}</Text>
                </View>
                {update.caption && (
                  <Text className="text-sm text-slate-900 dark:text-white mb-2">{update.caption}</Text>
                )}
                {update.media_url && (
                  <Image source={{ uri: update.media_url }} className="w-full h-44 rounded-xl" resizeMode="cover" />
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

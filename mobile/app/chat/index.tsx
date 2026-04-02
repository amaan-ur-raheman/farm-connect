import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';
import api, { Conversation } from '../../src/config/api';

export default function ChatListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get<{ data: Conversation[] }>('/api/chat/conversations');
      setConversations(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations().finally(() => setRefreshing(false));
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
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Messages</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      >
        {conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <MessageSquare size={48} color="#94a3b8" />
            <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">No conversations yet</Text>
            <Text className="text-sm text-gray-500 text-center px-8">
              Start a conversation from a listing or contract to connect with farmers and investors.
            </Text>
          </View>
        ) : (
          <View className="px-4 py-2">
            {conversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                onPress={() => router.push(`/chat/${conv.id}`)}
                className="flex-row items-center py-4 border-b border-[#eaf0ea] dark:border-[#2a382a]"
              >
                <View className="relative mr-3">
                  <Image
                    source={{ uri: conv.other_user.avatar_url || `https://i.pravatar.cc/100?u=${conv.other_user.id}` }}
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                  />
                  {conv.unread_count > 0 && (
                    <View className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full items-center justify-center">
                      <Text className="text-[10px] font-bold text-white">{conv.unread_count}</Text>
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`text-sm font-bold text-slate-900 dark:text-white ${conv.unread_count > 0 ? '' : 'opacity-70'}`}>
                      {conv.other_user.name || 'User'}
                    </Text>
                    <Text className="text-[10px] text-gray-400">
                      {conv.last_message ? new Date(conv.last_message.created_at).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <Text className={`text-xs ${conv.unread_count > 0 ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-gray-500'}`} numberOfLines={1}>
                    {conv.last_message?.text || 'No messages yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

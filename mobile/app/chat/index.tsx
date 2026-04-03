import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, MessageSquare, Sprout } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import api, { Conversation, ChatMessage } from '../../src/config/api';
import { useSocketStore } from '../../src/stores';
import { useUnreadCounts } from '../_layout';
import { Skeleton } from '../../src/components/ui/Skeleton';

export default function ChatListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocketStore();
  const { refreshUnreadCounts } = useUnreadCounts();

  // Reset chat badge when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshUnreadCounts();
    }, [refreshUnreadCounts])
  );

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

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg: ChatMessage) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === msg.conversation_id);
        if (index === -1) {
          fetchConversations();
          return prev;
        }

        const updated = [...prev];
        const conv = { ...updated[index] };
        
        conv.last_message = {
          text: msg.text || '📎 Media',
          created_at: msg.created_at
        };
        
        // Simplified unread increment - in a production app we'd check if we are on the ChatScreen for this ID
        conv.unread_count += 1;

        updated.splice(index, 1);
        updated.unshift(conv);
        return updated;
      });
    };

    socket.on('new_message', onNewMessage);
    return () => { socket.off('new_message', onNewMessage); };
  }, [socket, fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations().finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
        <StatusBar barStyle="dark-content" />
        <View className="px-4 py-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Skeleton width={50} height={50} borderRadius={25} />
              <View className="flex-1 gap-2">
                <Skeleton width={140} height={16} />
                <Skeleton width={200} height={12} />
              </View>
            </View>
          ))}
        </View>
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
          <View className="flex-1 items-center justify-center py-20 px-8">
            <MessageSquare size={48} color="#94a3b8" />
            <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">No conversations yet</Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
              Start a conversation from a listing or contract to connect with farmers and investors.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/marketplace')}
              className="bg-[#4cae4f] px-6 py-3 rounded-xl flex-row items-center gap-2"
            >
              <Sprout size={18} color="white" />
              <Text className="text-white font-bold">Browse Marketplace</Text>
            </TouchableOpacity>
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

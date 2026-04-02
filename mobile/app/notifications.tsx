import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { Bell, CheckCircle, Clock, MessageSquare, AlertTriangle, Wallet, Package, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import api, { Notification } from '../src/config/api';

const typeIcons: Record<string, any> = {
  CONTRACT: Clock,
  PAYMENT: Wallet,
  DELIVERY: Package,
  DISPUTE: AlertTriangle,
  CHAT: MessageSquare,
  SYSTEM: Bell,
};

const typeColors: Record<string, string> = {
  CONTRACT: '#3b82f6',
  PAYMENT: '#4cae4f',
  DELIVERY: '#f59e0b',
  DISPUTE: '#ef4444',
  CHAT: '#8b5cf6',
  SYSTEM: '#6b7280',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ data: Notification[] }>('/api/notifications');
      setNotifications(res.data.data || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center justify-between border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#4cae4f" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Notifications</Text>
          {unreadCount > 0 && (
            <View className="bg-red-500 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-white">{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text className="text-sm font-semibold text-[#4cae4f]">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4cae4f" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Bell size={48} color="#94a3b8" />
          <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">No notifications yet</Text>
          <Text className="text-sm text-gray-500 text-center">You'll see updates about contracts, payments, and messages here.</Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
        >
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            const color = typeColors[notification.type] || '#6b7280';
            return (
              <TouchableOpacity
                key={notification.id}
                onPress={() => markAsRead(notification.id)}
                className={`flex-row items-start px-4 py-4 border-b border-[#eaf0ea] dark:border-[#2a382a] ${
                  !notification.read ? 'bg-[#4cae4f]/5' : ''
                }`}
              >
                <View className="size-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${color}15` }}>
                  <Icon size={20} color={color} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`text-sm font-bold text-slate-900 dark:text-white ${!notification.read ? '' : 'opacity-70'}`}>
                      {notification.title}
                    </Text>
                    {!notification.read && <View className="size-2 bg-[#4cae4f] rounded-full ml-2" />}
                  </View>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{notification.message}</Text>
                  <Text className="text-[10px] text-gray-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View className="h-20" />
        </ScrollView>
      )}
    </View>
  );
}

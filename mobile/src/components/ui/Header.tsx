import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Bell,
  Tractor,
  Video,
  Settings,
  ArrowLeft,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useUiStore, useUserStore } from '../../stores';
import { useUnreadCounts } from '../../config/unread-context';
import { haptic } from '../../utils/haptics';

export type HeaderVariant = 'menu' | 'back-title' | 'back-avatar' | 'back';

interface HeaderProps {
  variant: HeaderVariant;
  title?: string;
  userName?: string;
  userStatus?: string;
  userAvatar?: string;
  userImage?: { uri: string };
  onActionPress?: () => void;
  onAvatarPress?: () => void;
  onMenuPress?: () => void;
  onBack?: () => void;
  showSearch?: boolean;
  onSearchToggle?: () => void;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  notificationCount?: number;
}

export function Header({
  variant,
  title,
  userName,
  userStatus,
  userAvatar,
  userImage,
  onActionPress,
  onAvatarPress,
  onBack,
  showSearch,
  onSearchToggle,
  onSearchChange,
  searchPlaceholder = 'Search farms, crops, or reports...',
  notificationCount: propNotificationCount,
}: HeaderProps) {
  const { searchVisible, setSearchVisible, setGlobalSearchQuery } = useUiStore();
  const { profile } = useUserStore();
  const { unreadCounts } = useUnreadCounts();
  const actualNotificationCount = propNotificationCount !== undefined ? propNotificationCount : unreadCounts.notifications;

  const actualShowSearch = showSearch !== undefined ? showSearch : searchVisible;
  const actualOnSearchToggle = onSearchToggle || (() => setSearchVisible(!searchVisible));
  const actualOnSearchChange = onSearchChange || setGlobalSearchQuery;
  
  const displayUserImage = userImage || (profile?.avatar ? { uri: profile.avatar } : undefined);
  const displayUserName = userName || profile?.firstName || 'User';

  const handleSearchChange = (text: string) => {
    actualOnSearchChange(text);
  };

  return (
    <>
      <SafeAreaView className="bg-white dark:bg-[#1e291e] border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <View className="h-16 px-4 flex-row items-center justify-between">
          {/* LEFT SECTION */}
          {variant === 'back' && (
            <View className="flex-row items-center gap-3">
              <TouchableOpacity 
                onPress={() => {
                  haptic.light();
                  onBack ? onBack() : router.back();
                }}
                className="size-11 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center border border-gray-100 dark:border-gray-700"
                accessibilityLabel="Go Back"
                accessibilityRole="button"
              >
                <ArrowLeft size={20} color="#4cae4f" strokeWidth={2.5} />
              </TouchableOpacity>
              {title && (
                <Text className="text-lg font-bold text-[#1e293b] dark:text-white uppercase tracking-tight">
                  {title}
                </Text>
              )}
            </View>
          )}

          {variant === 'menu' && (
            <View className="flex-row items-center">
              {/* FarmConnect Logo - Consistent pill style */}
              <View className="flex-row items-center bg-[#4cae4f] px-3 py-1.5 rounded-full">
                <Tractor size={14} color="white" strokeWidth={2.5} className="mr-1.5" />
                <Text className="text-xs font-black text-white tracking-tight uppercase">
                  FarmConnect
                </Text>
              </View>
            </View>
          )}

          {variant === 'back-title' && (
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center bg-[#4cae4f] px-3 py-1.5 rounded-full">
                <Tractor size={14} color="white" strokeWidth={2.5} className="mr-1.5" />
                <Text className="text-xs font-black text-white tracking-tight uppercase">FarmConnect</Text>
              </View>
              {title && (
                <Text className="text-base font-semibold text-[#1e293b] dark:text-white">
                  {title}
                </Text>
              )}
            </View>
          )}

          {variant === 'back-avatar' && (
            <View className="flex-row items-center flex-1">
              <View className="flex-row items-center bg-[#4cae4f] px-3 py-1.5 rounded-full mr-3">
                <Tractor size={14} color="white" strokeWidth={2.5} className="mr-1.5" />
                <Text className="text-xs font-black text-white tracking-tight uppercase">FarmConnect</Text>
              </View>
              <View className="flex-row items-center gap-3 flex-1">
                <View className="relative">
                  <View className="size-10 rounded-full border-2 border-primary overflow-hidden bg-slate-100">
                    {displayUserImage || userAvatar ? (
                      <Image
                        source={displayUserImage || { uri: userAvatar }}
                        className="w-full h-full"
                      />
                    ) : (
                      <View className="w-full h-full bg-[#4cae4f]/20 items-center justify-center">
                        <Text className="text-sm font-bold text-[#4cae4f]">
                          {displayUserName.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1e291e]" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-[#1e293b] dark:text-white leading-tight">
                    {displayUserName}
                  </Text>
                  {userStatus && (
                    <Text className="text-xs font-medium text-[#608562]">{userStatus}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* RIGHT SECTION */}
          <View className="flex-row items-center gap-2">
            {variant === 'menu' && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    haptic.light();
                    actualOnSearchToggle();
                  }}
                  className="p-2"
                  accessibilityLabel="Search"
                  accessibilityRole="button"
                >
                  <Search size={20} color="#608562" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    haptic.light();
                    router.push('/notifications');
                  }}
                  className="p-2 relative"
                  accessibilityLabel="Notifications"
                  accessibilityRole="button"
                >
                  <Bell size={20} color="#608562" />
                  {actualNotificationCount > 0 && (
                    <View className="absolute top-1 right-1 min-w-[12px] h-4 bg-red-500 rounded-full items-center justify-center px-1">
                      <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>
                        {actualNotificationCount > 99 ? '99+' : actualNotificationCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    haptic.light();
                    onAvatarPress ? onAvatarPress() : router.push('/profile');
                  }} 
                  className="size-11 rounded-full border border-[#eaf0ea] overflow-hidden"
                  accessibilityLabel="View Profile"
                  accessibilityRole="button"
                >
                  {displayUserImage || userAvatar ? (
                    <Image
                      source={displayUserImage || { uri: userAvatar || '' }}
                      className="w-full h-full"
                    />
                  ) : (
                    <View className="w-full h-full bg-[#4cae4f]/20 items-center justify-center">
                      <Text className="text-sm font-bold text-[#4cae4f]">{displayUserName.charAt(0)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            {variant === 'back-title' && (
              <>
                <TouchableOpacity 
                  onPress={() => {
                    haptic.light();
                    actualOnSearchToggle();
                  }}
                  className="p-2"
                >
                  <Search size={20} color="#608562" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    haptic.light();
                    router.push('/notifications');
                  }}
                  className="p-2 relative"
                  accessibilityLabel="Notifications"
                  accessibilityRole="button"
                >
                  <Bell size={20} color="#608562" />
                  {actualNotificationCount > 0 && (
                    <View className="absolute top-1 right-1 min-w-[12px] h-4 bg-red-500 rounded-full items-center justify-center px-1">
                      <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>
                        {actualNotificationCount > 99 ? '99+' : actualNotificationCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {onActionPress && (
                  <TouchableOpacity 
                    onPress={() => {
                      haptic.light();
                      onActionPress();
                    }} 
                    className="p-2"
                  >
                    <Settings size={20} color="#608562" />
                  </TouchableOpacity>
                )}
              </>
            )}

            {variant === 'back-avatar' && (
              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  onActionPress && onActionPress();
                }}
                className="bg-[#4cae4f] size-11 rounded-full items-center justify-center shadow-lg active:scale-95"
              >
                <Video size={20} color="white" fill="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar - Shown when active */}
        {variant === 'menu' && actualShowSearch && (
          <View className="px-4 pb-3">
            <View className="bg-[#eaf0ea] dark:bg-[#2a382a] rounded-lg px-4 py-2.5 flex-row items-center">
              <Search size={18} color="#608562" className="mr-3" />
              <TextInput
                placeholder={searchPlaceholder}
                placeholderTextColor="#608562"
                className="flex-1 text-sm font-medium text-[#1e293b] dark:text-white"
                onChangeText={handleSearchChange}
                autoFocus
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

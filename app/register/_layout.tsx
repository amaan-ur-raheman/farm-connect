import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Tractor } from 'lucide-react-native';

export default function RegisterLayout() {
  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between whitespace-nowrap border-b border-solid border-[#eaf0ea] dark:border-[#2a382a] bg-surface-light dark:bg-surface-dark px-6 py-4">
        <View className="flex-row items-center gap-3">
          <View className="size-8 text-primary flex items-center justify-center">
            <Tractor size={24} color="#2be619" strokeWidth={2.5} />
          </View>
          <Text className="text-lg font-bold leading-tight tracking-tight text-text-main dark:text-white">FarmConnect</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/login')}
          className="px-4 py-2"
        >
          <Text className="text-sm font-semibold text-primary">Log In</Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

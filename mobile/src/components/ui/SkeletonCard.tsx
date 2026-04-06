import React from 'react';
import { View } from 'react-native';
import { Skeleton } from './Skeleton';

export function SkeletonCard() {
  return (
    <View className="bg-white dark:bg-[#1a2c15] rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm mb-6 w-full">
      {/* Image Skeleton */}
      <View className="relative h-56 overflow-hidden">
        <Skeleton width="100%" height="100%" borderRadius={0} />
        <View className="absolute top-4 left-4 gap-2">
          <Skeleton width={80} height={24} borderRadius={12} />
        </View>
        <View className="absolute top-4 right-4">
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>
      </View>

      {/* Content Skeleton */}
      <View className="p-5">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-4">
            <Skeleton width="80%" height={24} borderRadius={4} />
            <View className="mt-3">
              <Skeleton width="50%" height={16} borderRadius={4} />
            </View>
          </View>
          <View className="items-end">
            <Skeleton width={60} height={24} borderRadius={4} />
            <View className="mt-2">
              <Skeleton width={40} height={12} borderRadius={2} />
            </View>
          </View>
        </View>

        {/* Info Grid Skeleton */}
        <View className="flex-row gap-3 my-6">
          <View className="flex-1 bg-[#f8fafc] dark:bg-slate-900/50 p-3 rounded-2xl items-center border border-slate-50 dark:border-slate-800">
            <Skeleton width={40} height={12} borderRadius={2} className="mb-2" />
            <Skeleton width={60} height={16} borderRadius={4} />
          </View>
          <View className="flex-1 bg-[#f8fafc] dark:bg-slate-900/50 p-3 rounded-2xl items-center border border-slate-50 dark:border-slate-800">
            <Skeleton width={40} height={12} borderRadius={2} className="mb-2" />
            <Skeleton width={60} height={16} borderRadius={4} />
          </View>
        </View>

        {/* CTA Skeleton */}
        <Skeleton width="100%" height={44} borderRadius={12} />
      </View>
    </View>
  );
}

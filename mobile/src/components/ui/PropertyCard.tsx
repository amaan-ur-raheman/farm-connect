import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Heart, ShieldCheck, Droplets, Wifi } from 'lucide-react-native';
import { Button } from './Button';

interface PropertyCardProps {
  title: string;
  location: string;
  price: string;
  size: string;
  soil: string;
  image: string;
  verified?: boolean;
  remoteReady?: boolean;
  newListing?: boolean;
  irrigated?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
}

export function PropertyCard({ 
  title, 
  location, 
  price, 
  size, 
  soil, 
  image, 
  verified, 
  remoteReady,
  newListing,
  irrigated,
  isFavorite,
  onToggleFavorite,
  onPress
}: PropertyCardProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      className="bg-white dark:bg-[#1a2c15] rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm mb-6 w-full"
    >
      {/* Image & Tags */}
      <View className="relative aspect-[4/3] overflow-hidden">
        <Image 
          source={{ uri: image }} 
          style={{ width: '100%', height: '100%' }} 
          contentFit="cover"
        />
        <View className="absolute top-3 left-3 z-10 flex-row gap-2">
          {verified && (
            <View className="bg-[#4cae4f]/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex-row items-center gap-1">
              <ShieldCheck size={10} color="white" />
              <Text className="text-[10px] font-bold text-white uppercase tracking-tight">Verified</Text>
            </View>
          )}
          {newListing && (
            <View className="bg-[#f59e0b]/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-white uppercase tracking-tight">New</Text>
            </View>
          )}
          {irrigated && (
            <View className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex-row items-center gap-1">
              <Droplets size={10} color="#111811" />
              <Text className="text-[10px] font-medium text-[#111811] uppercase tracking-tight">Irrigated</Text>
            </View>
          )}
          {remoteReady && (
            <View className="bg-white/95 dark:bg-black/70 px-3 py-1 rounded-full flex-row items-center border border-slate-100 dark:border-slate-800">
              <Wifi size={10} color="#4cae4f" />
              <Text className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight">Remote Ready</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/20 backdrop-blur-sm"
          onPress={(e: any) => {
            e.stopPropagation();
            onToggleFavorite && onToggleFavorite();
          }}
        >
          <Heart size={16} color="white" fill={isFavorite ? '#ef4444' : 'transparent'} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="p-5">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-lg font-bold text-slate-900 dark:text-white leading-tight" numberOfLines={1}>{title}</Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={12} color="#6b7280" />
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1" numberOfLines={1}>{location}</Text>
            </View>
          </View>
          <Text className="text-lg font-bold text-[#4cae4f]">{price}</Text>
        </View>

        {/* Info Grid */}
        <View className="flex-row gap-3 my-4">
          <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] p-3 rounded-2xl items-center border border-slate-50 dark:border-slate-800">
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Size</Text>
            <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">{size}</Text>
          </View>
          <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] p-3 rounded-2xl items-center border border-slate-50 dark:border-slate-800">
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Soil</Text>
            <Text className="text-xs font-bold text-gray-700 dark:text-gray-300" numberOfLines={1}>{soil}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress || (() => {})}
          style={{
            backgroundColor: '#4cae4f',
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#4cae4f',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: '800',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            View Details
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin, Heart, ShieldCheck, Wifi } from 'lucide-react-native';
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
  onPress
}: PropertyCardProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      className="bg-white dark:bg-[#1a2c15] rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm mb-6"
    >
      {/* Image & Tags */}
      <View className="relative h-56 overflow-hidden">
        <Image 
          source={{ uri: image }} 
          className="w-full h-full" 
          resizeMode="cover"
        />
        <View className="absolute top-4 left-4 gap-2">
          {verified && (
            <View className="bg-[#4cae4f] px-3 py-1.5 rounded-full flex-row items-center">
              <ShieldCheck size={12} color="black" className="mr-1.5" strokeWidth={3} />
              <Text className="text-[10px] font-black text-black uppercase tracking-tight">Verified Soil</Text>
            </View>
          )}
          {remoteReady && (
            <View className="bg-white/95 dark:bg-black/70 px-3 py-1.5 rounded-full flex-row items-center border border-slate-100 dark:border-slate-800">
              <Wifi size={12} color="#4cae4f" className="mr-1.5" strokeWidth={3} />
              <Text className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight">Remote Ready</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          className="absolute top-4 right-4 size-10 rounded-full bg-black/10 backdrop-blur-md items-center justify-center"
          onPress={(e) => {
            e.stopPropagation();
            // Handle favorite
          }}
        >
          <Heart size={20} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="p-5">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-4">
            <Text className="text-xl font-black text-slate-900 dark:text-white leading-tight">{title}</Text>
            <View className="flex-row items-center mt-2">
              <MapPin size={14} color="#94a3b8" className="mr-1.5" />
              <Text className="text-sm font-bold text-slate-400 dark:text-slate-500">{location}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-xl font-black text-[#4cae4f]">{price}</Text>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/Month</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View className="flex-row gap-3 my-6">
          <View className="flex-1 bg-[#f8fafc] dark:bg-slate-900/50 p-3 rounded-2xl items-center border border-slate-50 dark:border-slate-800">
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Size</Text>
            <Text className="text-sm font-black text-slate-700 dark:text-slate-200">{size}</Text>
          </View>
          <View className="flex-1 bg-[#f8fafc] dark:bg-slate-900/50 p-3 rounded-2xl items-center border border-slate-50 dark:border-slate-800">
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Soil</Text>
            <Text className="text-sm font-black text-slate-700 dark:text-slate-200">{soil}</Text>
          </View>
        </View>

        {/* CTA */}
        <Button 
          title="View Details" 
          variant="outline" 
          size="md" 
          className="w-full border-slate-100 dark:border-slate-800"
          onPress={onPress}
        />
      </View>
    </TouchableOpacity>
  );
}

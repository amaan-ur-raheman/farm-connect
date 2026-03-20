import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {
  Share2,
  Heart,
  MapPin,
  ChevronRight,
  Maximize2,
  IndianRupee,
  CheckCircle2,
  Ruler,
  Coins,
  Droplets,
  Grape,
  Leaf,
  Wheat,
  TrendingUp,
  MessageSquare,
  Phone,
  Star,
  Tractor,
  Mail,
  Instagram,
  Twitter,
  Facebook,
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Header } from '../../src/components/ui/Header';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const userImage = { uri: 'https://i.pravatar.cc/100?u=amaan' };

  const property = {
    title: 'Sahyadri Farms - Plot #14',
    subtitle: 'Premium Agricultural Land',
    location: 'Nashik District, Maharashtra',
    price: '₹25,000',
    totalPrice: '₹31,50,000',
    area: '45.8',
    areaUnit: 'Acres',
    status: 'Active',
    roi: '18.4%',
    soilHealth: 92,
    phValue: 6.8,
    moistureLevel: 42,
    crops: [
      { name: 'Cotton', icon: Grape, suitability: '95%', color: '#4cae4f' },
      { name: 'Sugarcane', icon: Leaf, suitability: '88%', color: '#22c55e' },
      { name: 'Wheat', icon: Wheat, suitability: '82%', color: '#86efac' },
      { name: 'Rice', icon: Droplets, suitability: '76%', color: '#4ade80' },
    ],
    yields: [
      { year: '2019', value: 68 },
      { year: '2020', value: 72 },
      { year: '2021', value: 65 },
      { year: '2022', value: 78 },
      { year: '2023', value: 85 },
    ],
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2940&auto=format&fit=crop',
  };

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />

      {/* Header - Using unified Header component */}
      <Header
        variant="menu"
        userImage={userImage}
        showSearch={showSearch}
        onSearchToggle={() => setShowSearch(!showSearch)}
        onAvatarPress={() => router.push('/profile')}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Breadcrumb */}
        <View className="px-4 py-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/marketplace')}>
            <Text className="text-xs font-semibold text-[#608562]">Marketplace</Text>
          </TouchableOpacity>
          <ChevronRight size={12} color="#94a3b8" className="mx-2" />
          <TouchableOpacity>
            <Text className="text-xs font-semibold text-[#608562]">Maharashtra</Text>
          </TouchableOpacity>
          <ChevronRight size={12} color="#94a3b8" className="mx-2" />
          <Text className="text-xs font-semibold text-slate-900 dark:text-white">
            {property.title}
          </Text>
        </View>

        {/* Hero Image */}
        <View className="px-4">
          <ImageBackground
            source={{ uri: property.image }}
            className="h-[300px] md:h-[400px] rounded-3xl overflow-hidden"
          >
            <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <View className="absolute top-4 left-4 flex-row gap-2">
              <View className="bg-[#4cae4f] px-3 py-1.5 rounded-full flex-row items-center">
                <CheckCircle2 size={12} color="black" className="mr-1.5" />
                <Text className="text-[10px] font-black text-black">Verified Soil</Text>
              </View>
              <View className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex-row items-center">
                <Text className="text-[10px] font-black text-white">Remote Ready</Text>
              </View>
            </View>

            <View className="absolute bottom-4 left-4 right-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    {property.title}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={14} color="#4cae4f" className="mr-1" />
                    <Text className="text-sm font-semibold text-white/80">
                      {property.location}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity className="size-10 bg-white/20 backdrop-blur-sm items-center justify-center rounded-full">
                    <Share2 size={18} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsFavorite(!isFavorite)}
                    className="size-10 bg-white/20 backdrop-blur-sm items-center justify-center rounded-full"
                  >
                    <Heart
                      size={18}
                      color={isFavorite ? '#ef4444' : 'white'}
                      fill={isFavorite ? '#ef4444' : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Stats Grid */}
        <View className="px-4 py-6">
          <View className="flex-row gap-3">
            <StatCard
              icon={<Ruler size={20} color="#4cae4f" />}
              label="Total Area"
              value={property.area}
              unit={property.areaUnit}
            />
            <StatCard
              icon={<IndianRupee size={20} color="#4cae4f" />}
              label="Lease Price"
              value={property.price}
              unit="/acre/year"
            />
            <StatCard
              icon={<CheckCircle2 size={20} color="#4cae4f" />}
              label="Status"
              value={property.status}
              unit=""
              valueColor="#4cae4f"
            />
          </View>
        </View>

        {/* Main Content Grid - 2/3 + 1/3 */}
        <View className="px-4 pb-32">
          <View className="flex-col md:flex-row gap-6">
            {/* Left Column - 2/3 */}
            <View className="md:w-[65%]">
              {/* Soil & Crop Suitability */}
              <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 mb-6 border border-slate-100 dark:border-slate-800">
                <Text className="text-lg font-black text-slate-900 dark:text-white mb-6">
                  Soil Composition
                </Text>
                <View className="flex-col md:flex-row items-center gap-8">
                  {/* pH Ring */}
                  <View className="items-center">
                    <View className="size-28 rounded-full border-[10px] border-slate-100 dark:border-slate-800 items-center justify-center relative">
                      <View
                        className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-[#4cae4f] border-r-[#4cae4f]"
                        style={{ transform: [{ rotate: '-45deg' }] }}
                      />
                      <Text className="text-3xl font-black text-slate-900 dark:text-white">
                        {property.phValue}
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold text-slate-500 mt-3">pH Level</Text>
                    <Text className="text-[10px] font-medium text-[#608562]">Optimal: 6.5-7.2</Text>
                  </View>

                  {/* Moisture Ring */}
                  <View className="items-center">
                    <View className="size-28 rounded-full border-[10px] border-slate-100 dark:border-slate-800 items-center justify-center relative">
                      <View
                        className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-[#3b82f6] border-r-[#3b82f6]"
                        style={{
                          transform: [{ rotate: `${(property.moistureLevel / 100) * 360 - 45}deg` }],
                        }}
                      />
                      <Text className="text-3xl font-black text-slate-900 dark:text-white">
                        {property.moistureLevel}%
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold text-slate-500 mt-3">Moisture</Text>
                    <Text className="text-[10px] font-medium text-[#608562]">Current Level</Text>
                  </View>

                  {/* NPK Values */}
                  <View className="flex-1 gap-4">
                    <NutrientBar label="Nitrogen (N)" value={85} color="#4cae4f" />
                    <NutrientBar label="Phosphorus (P)" value={62} color="#facc15" />
                    <NutrientBar label="Potassium (K)" value={78} color="#3b82f6" />
                  </View>
                </View>
              </View>

              {/* Recommended Crops */}
              <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 mb-6 border border-slate-100 dark:border-slate-800">
                <Text className="text-lg font-black text-slate-900 dark:text-white mb-6">
                  Recommended Crops
                </Text>
                <View className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {property.crops.map((crop, index) => (
                    <TouchableOpacity
                      key={index}
                      className="items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"
                    >
                      <View
                        className="size-12 rounded-full items-center justify-center mb-3"
                        style={{ backgroundColor: `${crop.color}20` }}
                      >
                        <crop.icon size={24} color={crop.color} />
                      </View>
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        {crop.name}
                      </Text>
                      <Text className="text-xs font-semibold" style={{ color: crop.color }}>
                        {crop.suitability}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 5-Year Yield History */}
              <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className="text-lg font-black text-slate-900 dark:text-white">
                      5-Year Yield History
                    </Text>
                    <Text className="text-xs font-medium text-[#608562]">
                      Productivity index based on harvest data
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <TrendingUp size={16} color="#4cae4f" className="mr-1" />
                    <Text className="text-sm font-bold text-[#4cae4f]">+25%</Text>
                  </View>
                </View>

                {/* Bar Chart */}
                <View className="flex-row items-end justify-between h-40 px-2">
                  {property.yields.map((item, index) => (
                    <View key={index} className="items-center flex-1">
                      <View
                        className="w-10 rounded-t-lg"
                        style={{
                          height: `${item.value}%`,
                          backgroundColor:
                            index === property.yields.length - 1 ? '#4cae4f' : '#d1d5db',
                        }}
                      />
                      <Text className="text-[10px] font-semibold text-slate-500 mt-2">
                        {item.year}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Legend */}
                <View className="flex-row justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <View className="flex-row items-center">
                    <View className="size-2 bg-[#4cae4f] rounded-full mr-2" />
                    <Text className="text-xs font-medium text-slate-500">2023 (Current)</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="size-2 bg-slate-300 rounded-full mr-2" />
                    <Text className="text-xs font-medium text-slate-500">Previous Years</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Column - 1/3 (Sticky Sidebar) */}
            <View className="md:w-[35%]">
              <View               className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                <Text className="text-xs font-black text-[#608562] uppercase tracking-widest mb-2">
                  Contract Summary
                </Text>
                <Text className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                  {property.totalPrice}
                </Text>
                <Text className="text-sm font-medium text-slate-500 mb-6">Total Lease Value</Text>

                <View className="gap-4 mb-6">
                  <SummaryRow label="Annual Lease" value="₹25,000/acre" />
                  <SummaryRow label="Lease Duration" value="5-10 Years" />
                  <SummaryRow label="Payment Cycle" value="Annual" />
                  <SummaryRow label="ROI Potential" value={property.roi} valueColor="#4cae4f" />
                  <SummaryRow label="Soil Health Score" value={`${property.soilHealth}/100`} />
                </View>

                <TouchableOpacity className="bg-[#4cae4f] py-4 rounded-2xl items-center mb-3">
                  <Text className="text-base font-black text-black">Acquire Digital Lease</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push(`/chat/${id}`)}
                  className="bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl items-center"
                >
                  <Text className="text-base font-black text-slate-900 dark:text-white">
                    Contact Farmer
                  </Text>
                </TouchableOpacity>

                {/* Agent Card */}
                <View className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <Text className="text-xs font-black text-[#608562] uppercase tracking-widest mb-4">
                    Land Representative
                  </Text>
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: 'https://i.pravatar.cc/100?u=rajesh' }}
                      className="size-12 rounded-full"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        Rajesh Patil
                      </Text>
                      <View className="flex-row items-center">
                        <Star size={10} color="#facc15" fill="#facc15" />
                        <Text className="text-[10px] font-medium text-slate-500 ml-1">4.9 (127 reviews)</Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-row gap-3 mt-4">
                    <TouchableOpacity 
                      onPress={() => router.push(`/chat/${id}`)}
                      className="flex-1 flex-row items-center justify-center py-3 bg-slate-50 dark:bg-slate-800 rounded-xl gap-2"
                    >
                      <MessageSquare size={16} color="#4cae4f" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 flex-row items-center justify-center py-3 bg-slate-50 dark:bg-slate-800 rounded-xl gap-2">
                      <Phone size={16} color="#4cae4f" />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Call</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="bg-[#1e291e] px-4 py-8">
          <View className="flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <View className="flex-row items-center gap-2">
              <Tractor size={24} color="#4cae4f" />
              <Text className="text-xl font-black text-white">FarmConnect</Text>
            </View>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity className="size-10 bg-slate-800 items-center justify-center rounded-full">
                <Mail size={18} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity className="size-10 bg-slate-800 items-center justify-center rounded-full">
                <Instagram size={18} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity className="size-10 bg-slate-800 items-center justify-center rounded-full">
                <Twitter size={18} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity className="size-10 bg-slate-800 items-center justify-center rounded-full">
                <Facebook size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-800">
            <Text className="text-xs font-medium text-slate-500">
              © 2024 FarmConnect. All rights reserved.
            </Text>
            <View className="flex-row items-center gap-4">
              {['Privacy Policy', 'Terms of Service', 'Support'].map((item) => (
                <TouchableOpacity key={item}>
                  <Text className="text-xs font-medium text-slate-500">{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, unit, valueColor = '#1e293b' }: any) {
  return (
    <View className="flex-1 bg-white dark:bg-[#1e291e] rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
      <View className="size-10 bg-slate-50 dark:bg-slate-800 rounded-xl items-center justify-center mb-3">
        {icon}
      </View>
      <Text className="text-[10px] font-semibold text-[#608562] uppercase tracking-wide">{label}</Text>
      <View className="flex-row items-baseline">
        <Text className="text-xl font-black" style={{ color: valueColor }}>{value}</Text>
        <Text className="text-[10px] font-medium text-slate-400 ml-1">{unit}</Text>
      </View>
    </View>
  );
}

function NutrientBar({ label, value, color }: any) {
  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</Text>
        <Text className="text-xs font-bold" style={{ color }}>{value}%</Text>
      </View>
      <View className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

function SummaryRow({ label, value, valueColor = '#1e293b' }: any) {
  return (
    <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
      <Text className="text-sm font-medium text-slate-500">{label}</Text>
      <Text className="text-sm font-bold" style={{ color: valueColor }}>{value}</Text>
    </View>
  );
}

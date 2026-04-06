import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Heart,
  MapPin,
  ChevronRight,
  IndianRupee,
  CheckCircle2,
  Ruler,
  Grape,
  Leaf,
  Droplets,
  MessageSquare,
  Star,
  Tractor,
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Header } from '../../src/components/ui/Header';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';
import { useMarketplaceStore } from '../../src/stores';
import api, { Listing, Review } from '../../src/config/api';
import { useAuthStore } from '../../src/stores/authStore';
import { haptic } from '../../src/utils/haptics';
import { getCardImage, getFullImage } from '../../src/utils/image';
import { useQuery } from '@tanstack/react-query';
import { ListingDetailResponseSchema, ReviewsResponseSchema } from '../../src/config/schemas';

const cropIcons: Record<string, any> = {
  Cotton: Grape,
  Sugarcane: Leaf,
  Wheat: Leaf,
  Rice: Droplets,
  default: Grape,
};

const cropColors = ['#4cae4f', '#22c55e', '#86efac', '#4ade80', '#a7f3d0'];

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const { toggleFavorite, isFavorite } = useMarketplaceStore();
  const { isAuthenticated, authUser } = useAuthStore();
  const [creatingContract, setCreatingContract] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const isPropertyFavorite = isFavorite(id as string);
  const { width } = Dimensions.get('window');

  const { data: listing, isLoading: listingLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await api.get(`/api/listings/${id}`, undefined, ListingDetailResponseSchema);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const res = await api.get(`/api/reviews/listing/${id}`, undefined, ReviewsResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
    enabled: !!id,
  });

  const loading = listingLoading || reviewsLoading;

  const handleCreateContract = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to acquire a lease.');
      router.push('/login');
      return;
    }
    if (!listing) return;
    setCreatingContract(true);
    try {
      // Calculate total amount based on acreage and price per acre
      const totalAmount = listing.area_acres * listing.price_per_acre;
      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 6); // 6 months contract
      
      await api.post('/api/contracts', {
        listing_id: listing.id,
        crop: listing.crops?.[0] || 'General',
        acreage: listing.area_acres,
        price_per_acre: listing.price_per_acre,
        start_date: today.toISOString(),
        end_date: endDate.toISOString(),
      });
      haptic.success();
      Alert.alert('Success', 'Contract request sent to the farmer!');
      router.push('/contracts');
    } catch (err: any) {
      haptic.error();
      Alert.alert('Error', err.response?.data?.message || 'Failed to create contract.');
    } finally {
      setCreatingContract(false);
    }
  };

  const handleStartChat = async () => {
    if (!listing?.farmer_id) {
      haptic.error();
      Alert.alert('Error', 'Could not find the farmer.');
      return;
    }
    try {
      haptic.light();
      const res = await api.post<{ id: string }>('/api/chat/conversations', {
        participant_id: listing.farmer_id,
      });
      const conversationId = res.data.id;
      router.push(`/chat/${conversationId}`);
    } catch (err: any) {
      haptic.error();
      console.error('Failed to start chat:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to start conversation.');
    }
  };

  if (loading || !listing) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] p-4 pt-12">
        <SkeletonCard />
      </View>
    );
  }

  const totalPrice = (listing.price_per_acre || 0) * (listing.area_acres || 0);
  const crops = (listing.crops || []).map((crop: string, i: number) => ({
    name: crop,
    icon: cropIcons[crop] || cropIcons.default,
    suitability: `${85 - i * 5}%`,
    color: cropColors[i % cropColors.length],
  }));
  const avgRating = reviews.length > 0
    ? ((reviews as Review[]).reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />

      <Header
        variant="menu"
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Breadcrumb */}
        <View className="px-4 py-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/marketplace')}>
            <Text className="text-xs font-semibold text-[#608562]">Marketplace</Text>
          </TouchableOpacity>
          <ChevronRight size={12} color="#94a3b8" className="mx-2" />
          <Text className="text-xs font-semibold text-slate-900 dark:text-white">
            {listing.name}
          </Text>
        </View>

        {/* Image Carousel */}
        <View className="px-4 mb-4">
          <View className="relative">
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
              contentContainerStyle={{ paddingHorizontal: 0 }}
            >
              {/* @ts-expect-error - expo-image class component type incompatibility */}
              {((listing.images?.length || 0) > 0 ? listing.images : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2940&auto=format&fit=crop']).map((img: string | undefined, idx: number) => (
                <Image
                  key={idx}
                  source={{ uri: getFullImage(img)! }}
                  style={{ width: width - 32, height: 300, borderRadius: 24 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            
            {/* Badges */}
            <View className="absolute top-4 left-4 flex-row gap-2">
              {listing.is_organic && (
                <View className="bg-[#4cae4f] px-3 py-1.5 rounded-full flex-row items-center">
                  <CheckCircle2 size={12} color="black" />
                  <Text className="text-[10px] font-black text-black ml-1">Organic</Text>
                </View>
              )}
              {listing.status === 'ACTIVE' && (
                <View className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Text className="text-[10px] font-black text-white">Active</Text>
                </View>
              )}
            </View>
            
            {/* Page Indicators */}
            {((listing.images?.length || 0) > 1) && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5">
                {(listing.images || []).map((_: string, idx: number) => (
                  <View
                    key={idx}
                    style={{
                      width: currentImageIndex === idx ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: currentImageIndex === idx ? '#4cae4f' : 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Title & Location */}
        <View className="px-4 pt-4">
          <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {listing.name}
          </Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={14} color="#4cae4f" />
            <Text className="text-sm font-semibold text-slate-500 ml-1">
              {listing.location_name}
            </Text>
          </View>
          {listing.farmer && (
            <View className="flex-row items-center mt-2">
              <Text className="text-xs text-gray-400">by </Text>
              <Text className="text-xs font-semibold text-[#608562]">{listing.farmer.name || 'Farmer'}</Text>
              {listing.farmer.kyc_status === 'VERIFIED' && (
                <CheckCircle2 size={12} color="#4cae4f" className="ml-1" />
              )}
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View className="px-4 py-6">
          <View className="flex-row gap-3">
            <StatCard
              icon={<Ruler size={20} color="#4cae4f" />}
              label="Total Area"
              value={`${listing.area_acres}`}
              unit="Acres"
            />
            <StatCard
              icon={<IndianRupee size={20} color="#4cae4f" />}
              label="Price/Acre"
              value={`₹${listing.price_per_acre.toLocaleString('en-IN')}`}
              unit="/year"
            />
            <StatCard
              icon={<Star size={20} color="#4cae4f" />}
              label="Rating"
              value={avgRating}
              unit={reviews.length > 0 ? `/5 (${reviews.length})` : 'reviews'}
            />
          </View>
        </View>

        {/* Main Content */}
        <View className="px-4 pb-32">
          <View className="flex-col md:flex-row gap-6">
            {/* Left Column */}
            <View className="md:w-[65%]">
              {/* Description */}
              {listing.description && (
                <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 mb-6 border border-slate-100 dark:border-slate-800">
                  <Text className="text-lg font-black text-slate-900 dark:text-white mb-4">Description</Text>
                  <Text className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {listing.description}
                  </Text>
                </View>
              )}

              {/* Soil & Land Details */}
              <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 mb-6 border border-slate-100 dark:border-slate-800">
                <Text className="text-lg font-black text-slate-900 dark:text-white mb-6">
                  Land Details
                </Text>
                <View className="gap-4">
                  {listing.soil_type && <DetailRow label="Soil Type" value={listing.soil_type} />}
                  {listing.irrigation_type && <DetailRow label="Irrigation" value={listing.irrigation_type} />}
                  {listing.expected_harvest_month && <DetailRow label="Harvest Month" value={listing.expected_harvest_month} />}
                  <DetailRow label="Organic" value={listing.is_organic ? 'Yes' : 'No'} />
                  <DetailRow label="Status" value={listing.status || 'N/A'} />
                </View>
              </View>

              {/* Recommended Crops */}
              {crops.length > 0 && (
                <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 mb-6 border border-slate-100 dark:border-slate-800">
                  <Text className="text-lg font-black text-slate-900 dark:text-white mb-6">
                    Crops Grown
                  </Text>
                  <View className="flex-row flex-wrap gap-4">
                    {crops.map((crop, index) => (
                      <View
                        key={index}
                        className="items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"
                        style={{ minWidth: 100 }}
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
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-lg font-black text-slate-900 dark:text-white">
                      Reviews
                    </Text>
                    <View className="flex-row items-center">
                      <Star size={16} color="#facc15" fill="#facc15" />
                      <Text className="text-sm font-bold text-slate-900 dark:text-white ml-1">
                        {avgRating} ({reviews.length})
                      </Text>
                    </View>
                  </View>
                  {reviews.slice(0, 5).map((review) => (
                    <View key={review.id} className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <View className="flex-row items-center mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} color="#facc15" fill={i < review.rating ? '#facc15' : 'transparent'} />
                        ))}
                        <Text className="text-xs text-gray-400 ml-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text className="text-sm text-slate-600 dark:text-slate-400">
                        {review.comment}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Right Column - Sidebar */}
            <View className="md:w-[35%]">
              <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                <Text className="text-xs font-black text-[#608562] uppercase tracking-widest mb-2">
                  Contract Summary
                </Text>
                <Text className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </Text>
                <Text className="text-sm font-medium text-slate-500 mb-6">Total Lease Value</Text>

                <View className="gap-4 mb-6">
                  <SummaryRow label="Price/Acre" value={`₹${listing.price_per_acre.toLocaleString('en-IN')}`} />
                  <SummaryRow label="Total Area" value={`${listing.area_acres} Acres`} />
                  <SummaryRow label="Total Value" value={`₹${totalPrice.toLocaleString('en-IN')}`} valueColor="#4cae4f" />
                  {listing.expected_harvest_month && (
                    <SummaryRow label="Harvest" value={listing.expected_harvest_month} />
                  )}
                </View>

                {/* Farmer Card */}
                {listing.farmer && (
                  <View className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Text className="text-xs font-black text-[#608562] uppercase tracking-widest mb-4">
                      Land Representative
                    </Text>
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: listing.farmer.avatar_url || `https://i.pravatar.cc/100?u=${listing.farmer.id}` }}
                        className="size-12 rounded-full"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-sm font-bold text-slate-900 dark:text-white">
                          {listing.farmer.name || 'Farmer'}
                        </Text>
                        <View className="flex-row items-center">
                          <Star size={10} color="#facc15" fill="#facc15" />
                          <Text className="text-[10px] font-medium text-slate-500 ml-1">
                            {avgRating} ({reviews.length} reviews)
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="bg-[#1e291e] px-4 py-8">
          <View className="flex-row items-center justify-center gap-2 mb-8">
            <Tractor size={24} color="#4cae4f" />
            <Text className="text-xl font-black text-white">FarmConnect</Text>
          </View>
          <Text className="text-center text-xs text-gray-500">Alpha v2.4.0 — Connecting Farmers with Investors</Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View className="bg-white dark:bg-[#1e291e] border-t border-gray-200 dark:border-[#2a382a] px-4 py-3 pb-6">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Total Lease Value</Text>
            <Text className="text-2xl font-black text-[#4cae4f]">
              ₹{totalPrice.toLocaleString('en-IN')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              haptic.medium();
              toggleFavorite(id as string);
            }}
            className="p-2"
          >
            <Heart
              size={24}
              color={isPropertyFavorite ? '#ef4444' : '#94a3b8'}
              fill={isPropertyFavorite ? '#ef4444' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
        {listing.farmer_id !== authUser?.id && (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                haptic.medium();
                handleStartChat();
              }}
              className="flex-1 bg-slate-100 dark:bg-slate-800 py-3.5 rounded-xl items-center"
            >
              <View className="flex-row items-center gap-2">
                <MessageSquare size={18} color="#1e293b" className="dark:text-white" />
                <Text className="text-sm font-black text-slate-900 dark:text-white">
                  Contact Farmer
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                haptic.medium();
                handleCreateContract();
              }}
              disabled={creatingContract}
              className="flex-1 bg-[#4cae4f] py-3.5 rounded-xl items-center"
            >
              <Text className="text-sm font-black text-black">
                {creatingContract ? 'Processing...' : 'Acquire Lease'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
      <Text className="text-sm font-medium text-slate-500">{label}</Text>
      <Text className="text-sm font-bold text-slate-900 dark:text-white">{value}</Text>
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

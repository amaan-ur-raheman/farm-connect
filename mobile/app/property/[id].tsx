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
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Card, Skeleton, EmptyState, Button, StatTile } from '../../src/components/ui';
import { colors, spacing, radii, typography, theme, getShadow } from '../../src/config/theme';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? theme.dark : theme.light;
  const insets = useSafeAreaInsets();

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
      const totalAmount = listing.area_acres * listing.price_per_acre;
      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 6);

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
      <View style={{ flex: 1, backgroundColor: t.background, padding: spacing.lg, paddingTop: spacing['3xl'] }}>
        <Card padding="lg">
          <Skeleton height={24} width="70%" borderRadius={radii.md} />
          <Skeleton height={16} width="50%" borderRadius={radii.sm} style={{ marginTop: spacing.sm }} />
          <Skeleton height={200} width="100%" borderRadius={radii.xl} style={{ marginTop: spacing.lg }} />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <Skeleton height={80} width="33%" borderRadius={radii.lg} />
            <Skeleton height={80} width="33%" borderRadius={radii.lg} />
            <Skeleton height={80} width="33%" borderRadius={radii.lg} />
          </View>
        </Card>
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
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Header
        variant="menu"
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Breadcrumb */}
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push('/marketplace')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSecondary }}>Marketplace</Text>
          </TouchableOpacity>
          <ChevronRight size={12} color={t.textTertiary} style={{ marginHorizontal: spacing.sm }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: t.text, flexShrink: 1 }} numberOfLines={1}>
            {listing.name}
          </Text>
        </View>

        {/* Image Carousel */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <View style={{ position: 'relative' }}>
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
                  style={{ width: width - 32, height: 300, borderRadius: radii.xl }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Badges */}
            <View style={{ position: 'absolute', top: spacing.md, left: spacing.md, flexDirection: 'row', gap: spacing.sm }}>
              {listing.is_organic && (
                <View style={{ backgroundColor: t.success, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.full, flexDirection: 'row', alignItems: 'center', minHeight: 44, justifyContent: 'center' }}>
                  <CheckCircle2 size={12} color={isDark ? colors.primary[900] : '#000000'} />
                  <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? colors.primary[900] : '#000000', marginLeft: 4 }}>Organic</Text>
                </View>
              )}
              {listing.status === 'ACTIVE' && (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.full, minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>Active</Text>
                </View>
              )}
            </View>

            {/* Page Indicators */}
            {((listing.images?.length || 0) > 1) && (
              <View style={{ position: 'absolute', bottom: spacing.md, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                {(listing.images || []).map((_: string, idx: number) => (
                  <View
                    key={idx}
                    style={{
                      width: currentImageIndex === idx ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: currentImageIndex === idx ? t.success : 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Title & Location */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Text style={{ ...typography.display, color: t.text }}>
            {listing.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <MapPin size={14} color={t.success} />
            <Text style={{ ...typography.bodySm, color: t.textTertiary, marginLeft: 4 }}>
              {listing.location_name}
            </Text>
          </View>
          {listing.farmer && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
              <Text style={{ ...typography.caption, color: t.textTertiary }}>by </Text>
              <Text style={{ ...typography.caption, fontWeight: '600', color: t.textSecondary }}>{listing.farmer.name || 'Farmer'}</Text>
              {listing.farmer.kyc_status === 'VERIFIED' && (
                <CheckCircle2 size={12} color={t.success} style={{ marginLeft: 4 }} />
              )}
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatTile
              icon={Ruler}
              iconColor={t.success}
              label="Total Area"
              value={`${listing.area_acres}`}
              subtitle="Acres"
            />
            <StatTile
              icon={IndianRupee}
              iconColor={t.success}
              label="Price/Acre"
              value={`₹${listing.price_per_acre.toLocaleString('en-IN')}`}
              subtitle="/year"
            />
            <StatTile
              icon={Star}
              iconColor={t.accent}
              label="Rating"
              value={avgRating}
              subtitle={reviews.length > 0 ? `/5 (${reviews.length})` : 'reviews'}
            />
          </View>
        </View>

        {/* Main Content */}
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] }}>
          {/* Description */}
          {listing.description && (
            <Card padding="xl" style={{ marginBottom: spacing.lg }}>
              <Text style={{ ...typography.heading, color: t.text, marginBottom: spacing.md }}>Description</Text>
              <Text style={{ ...typography.bodySm, color: t.textSecondary, lineHeight: 24 }}>
                {listing.description}
              </Text>
            </Card>
          )}

          {/* Soil & Land Details */}
          <Card padding="xl" style={{ marginBottom: spacing.lg }}>
            <Text style={{ ...typography.heading, color: t.text, marginBottom: spacing.xl }}>
              Land Details
            </Text>
            <View style={{ gap: spacing.md }}>
              {listing.soil_type && <DetailRow label="Soil Type" value={listing.soil_type} isDark={isDark} theme={t} />}
              {listing.irrigation_type && <DetailRow label="Irrigation" value={listing.irrigation_type} isDark={isDark} theme={t} />}
              {listing.expected_harvest_month && <DetailRow label="Harvest Month" value={listing.expected_harvest_month} isDark={isDark} theme={t} />}
              <DetailRow label="Organic" value={listing.is_organic ? 'Yes' : 'No'} isDark={isDark} theme={t} />
              <DetailRow label="Status" value={listing.status || 'N/A'} isDark={isDark} theme={t} />
            </View>
          </Card>

          {/* Recommended Crops */}
          {crops.length > 0 && (
            <Card padding="xl" style={{ marginBottom: spacing.lg }}>
              <Text style={{ ...typography.heading, color: t.text, marginBottom: spacing.xl }}>
                Crops Grown
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                {crops.map((crop, index) => (
                  <View
                    key={index}
                    style={{ alignItems: 'center', padding: spacing.md, backgroundColor: isDark ? t.surfaceElevated : colors.primary[50], borderRadius: radii.lg, borderWidth: 1, borderColor: isDark ? t.borderStrong : t.border, minWidth: 100 }}
                  >
                    <View
                      style={{ width: 48, height: 48, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, backgroundColor: `${crop.color}20` }}
                    >
                      <crop.icon size={24} color={crop.color} />
                    </View>
                    <Text style={{ ...typography.bodySm, fontWeight: '700', color: t.text }}>
                      {crop.name}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Reviews */}
          {reviews.length > 0 ? (
            <Card padding="xl">
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
                <Text style={{ ...typography.heading, color: t.text }}>
                  Reviews
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Star size={16} color={t.accent} fill={t.accent} />
                  <Text style={{ ...typography.bodySm, fontWeight: '700', color: t.text, marginLeft: 4 }}>
                    {avgRating} ({reviews.length})
                  </Text>
                </View>
              </View>
              {reviews.slice(0, 5).map((review, reviewIdx) => (
                <View key={review.id} style={{ marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: reviewIdx < 4 ? 1 : 0, borderBottomColor: t.divider }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} color={t.accent} fill={i < review.rating ? t.accent : 'transparent'} />
                    ))}
                    <Text style={{ ...typography.captionXs, color: t.textTertiary, marginLeft: spacing.sm }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={{ ...typography.bodySm, color: t.textSecondary }}>
                    {review.comment}
                  </Text>
                </View>
              ))}
            </Card>
          ) : (
            <EmptyState
              icon={Star}
              title="No Reviews Yet"
              description="Be the first to review this property."
            />
          )}
        </View>

        {/* Footer */}
        <View style={{ backgroundColor: t.surfaceElevated, paddingHorizontal: spacing.lg, paddingVertical: spacing['2xl'] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
            <Tractor size={24} color={t.success} />
            <Text style={{ ...typography.heading, color: t.text }}>FarmConnect</Text>
          </View>
          <Text style={{ ...typography.caption, textAlign: 'center', color: t.textTertiary }}>Alpha v2.4.0 \u2014 Connecting Farmers with Investors</Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={{ backgroundColor: t.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, borderTopWidth: 1, borderTopColor: t.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={{ ...typography.caption, color: t.textTertiary }}>Total Lease Value</Text>
            <Text style={{ ...typography.display, color: t.success }} numberOfLines={1} adjustsFontSizeToFit>
              ₹{totalPrice.toLocaleString('en-IN')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              haptic.medium();
              toggleFavorite(id as string);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 12, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
          >
            <Heart
              size={24}
              color={isPropertyFavorite ? t.error : t.textTertiary}
              fill={isPropertyFavorite ? t.error : 'transparent'}
            />
          </TouchableOpacity>
        </View>
        {listing.farmer_id !== authUser?.id && (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              label="Contact Farmer"
              onPress={() => {
                haptic.medium();
                handleStartChat();
              }}
              variant="secondary"
              size="lg"
              style={{ flex: 1 }}
              leftIcon={<MessageSquare size={18} color={t.text} />}
            />
            <Button
              label={creatingContract ? 'Processing...' : 'Acquire Lease'}
              onPress={() => {
                haptic.medium();
                handleCreateContract();
              }}
              variant="primary"
              size="lg"
              loading={creatingContract}
              disabled={creatingContract}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function DetailRow({ label, value, isDark, theme: t }: { label: string; value: string; isDark: boolean; theme: typeof theme.light }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: t.divider }}>
      <Text style={{ ...typography.bodySm, color: t.textTertiary }}>{label}</Text>
      <Text style={{ ...typography.bodySm, fontWeight: '700', color: t.text }}>{value}</Text>
    </View>
  );
}

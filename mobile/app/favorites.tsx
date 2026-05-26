import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Heart, MapPin, Sprout } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMarketplaceStore } from '../src/stores';
import api, { Listing } from '../src/config/api';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';
import { Card, Skeleton, EmptyState } from '../src/components/ui';

const mapListingToProperty = (listing: Listing) => ({
  id: listing.id,
  title: listing.name,
  location: listing.location_name,
  price: listing.price_per_acre,
  area: listing.area_acres,
  image: listing.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
  isOrganic: listing.is_organic,
});

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const BATCH_SIZE = 5;

let cache: { data: Record<string, Listing>; timestamp: number } = {
  data: {},
  timestamp: 0,
};

function getFromCache(id: string): Listing | null {
  const age = Date.now() - cache.timestamp;
  if (age < CACHE_TTL_MS && cache.data[id]) {
    return cache.data[id];
  }
  return null;
}

function setInCache(listings: Record<string, Listing>) {
  cache.data = { ...cache.data, ...listings };
  cache.timestamp = Date.now();
}

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useMarketplaceStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const [favoriteListings, setFavoriteListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    if (favorites.size === 0) {
      setFavoriteListings([]);
      setLoading(false);
      return;
    }

    try {
      const ids = Array.from(favorites) as string[];
      const allListings: Listing[] = [];

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const chunk = ids.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          chunk.map(async (id: string) => {
            const cached = getFromCache(id);
            if (cached) return cached;
            try {
              const res = await api.get<Listing>(`/api/listings/${id}`);
              return res.data;
            } catch (err) {
              console.error(`Failed to fetch listing ${id}:`, err);
              return null;
            }
          })
        );
        const valid = results.filter((r): r is Listing => r !== null);
        allListings.push(...valid);
        setInCache(Object.fromEntries(valid.map((l) => [l.id, l])));
      }

      const listings = allListings.map(mapListingToProperty);
      setFavoriteListings(listings);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [favorites]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites().finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.headerSkeleton}>
          <Skeleton width={200} height={28} />
          <View style={styles.loadingCards}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeletonCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, borderWidth: 1 }]}>
                <Skeleton width={'100%'} height={180} />
                <View style={styles.sCardContent}>
                  <Skeleton width={180} height={20} style={{ marginBottom: spacing.sm }} />
                  <Skeleton width={120} height={14} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: currentTheme.surface,
            borderBottomColor: currentTheme.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={currentTheme.primary} />
            </TouchableOpacity>
            <Text style={[typography.heading, { color: currentTheme.text }]}>My Favorites</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : `${colors.error.light}14` }]}>
            <Text
              style={[
                typography.captionXs,
                {
                  color: isDark ? colors.error.dark : colors.error.light,
                  fontWeight: '700',
                },
              ]}
            >
              {favoriteListings.length} {favoriteListings.length === 1 ? 'Farm' : 'Farms'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.primary} />
        }
      >
        {favoriteListings.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Heart farms you love to easily find them later."
            actionLabel="Browse Farms"
            onAction={() => router.push('/marketplace')}
            style={styles.emptyState}
          />
        ) : (
          <View style={styles.content}>
            {favoriteListings.map((property) => (
              <View
                key={property.id}
                style={[styles.card, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, borderWidth: 1 }]}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/property/${property.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: property.image }}
                      style={styles.image}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      onPress={() => toggleFavorite(property.id)}
                      style={[styles.heartButton, { backgroundColor: currentTheme.surface, ...getShadow('md', isDark) }]}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <Heart size={20} color={colors.error.light} fill={colors.error.light} />
                    </TouchableOpacity>
                    {property.isOrganic && (
                      <View style={styles.organicBadge}>
                        <Text style={[typography.captionXs, { color: '#FFFFFF', fontWeight: '700' }]}>
                          Organic
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardContent}>
                    <Text
                      style={[typography.titleSm, { color: currentTheme.text }]}
                      numberOfLines={1}
                    >
                      {property.title}
                    </Text>
                    <View style={styles.locationRow}>
                      <MapPin size={14} color={currentTheme.textTertiary} />
                      <Text style={[typography.caption, { color: currentTheme.textTertiary }]}>
                        {property.location}
                      </Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={[typography.heading, { color: currentTheme.primary }]}>
                        {property.price.toLocaleString('en-IN')}
                      </Text>
                      <Text style={[typography.caption, { color: currentTheme.textTertiary }]}>
                        {property.area} Acres
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSkeleton: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  loadingCards: {
    gap: spacing.lg,
  },
  skeletonCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  sCardContent: {
    padding: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
  },
  heartButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organicBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.success.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  cardContent: {
    padding: spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  emptyState: {
    flex: 1,
    minHeight: 400,
  },
});

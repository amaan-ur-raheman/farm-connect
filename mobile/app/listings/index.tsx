import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Alert, useColorScheme, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Plus, MapPin, Trash2, Pencil, Loader2, Sprout } from 'lucide-react-native';
import { router } from 'expo-router';
import api, { Listing } from '../../src/config/api';
import { colors, spacing, radii, typography, theme, getShadow } from '../../src/config/theme';
import { Card, Skeleton, EmptyState, Button } from '../../src/components/ui';

export default function MyListingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      const res = await api.get<{ data: Listing[] }>('/api/listings/mine');
      setListings(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings().finally(() => setRefreshing(false));
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await api.delete(`/api/listings/${id}`);
            setListings(prev => prev.filter(l => l.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete listing.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, {
        backgroundColor: currentTheme.surface,
        borderBottomColor: currentTheme.border,
      }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={spacing.md}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={currentTheme.primary} />
          </TouchableOpacity>
          <Text style={[typography.heading, { color: currentTheme.text }]}>My Listings</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/listings/create')}
          style={[styles.newButton, { backgroundColor: currentTheme.primary }]}
          activeOpacity={0.8}
        >
          <Plus size={16} color={currentTheme.onPrimary} />
          <Text style={[typography.labelSm, { color: currentTheme.onPrimary }]}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.primary}
          />
        }
      >
        <View style={styles.content}>
          {listings.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title="No listings yet"
              description="Create your first farm listing to attract investors."
              actionLabel="Create Listing"
              onAction={() => router.push('/listings/create')}
            />
          ) : (
            listings.map((listing) => (
              <Card key={listing.id} variant="interactive" onPress={() => router.push(`/property/${listing.id}`)} style={styles.card}>
                <Image
                  source={{ uri: listing.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800' }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={[typography.titleSm, { color: currentTheme.text, flex: 1 }]} numberOfLines={1}>
                      {listing.name}
                    </Text>
                    <View style={[
                      styles.badge,
                      { backgroundColor: listing.status === 'ACTIVE' ? colors.secondary[100] : colors.neutral[100] },
                    ]}>
                      <Text style={[
                        typography.captionXs,
                        {
                          fontWeight: '700',
                          color: listing.status === 'ACTIVE' ? colors.secondary[700] : colors.neutral[500],
                        },
                      ]}>
                        {listing.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.locationRow}>
                    <MapPin size={12} color={currentTheme.textSecondary} />
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginLeft: spacing.xs }]}>
                      {listing.location_name}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <View>
                      <Text style={[typography.captionXs, { color: currentTheme.textSecondary, textTransform: 'uppercase' }]}>Price/Acre</Text>
                      <Text style={[typography.bodySm, { color: currentTheme.primary, fontWeight: '700' }]}>
                        {'₹'}{listing.price_per_acre.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View>
                      <Text style={[typography.captionXs, { color: currentTheme.textSecondary, textTransform: 'uppercase' }]}>Area</Text>
                      <Text style={[typography.bodySm, { color: currentTheme.text, fontWeight: '700' }]}>{listing.area_acres} Acres</Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        onPress={() => router.push(`/property/${listing.id}`)}
                        style={[styles.iconButton, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100] }]}
                        hitSlop={spacing.sm}
                        activeOpacity={0.7}
                      >
                        <Text style={[typography.caption, { color: isDark ? colors.neutral[300] : colors.neutral[600], fontWeight: '700' }]}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => router.push(`/listings/edit/${listing.id}`)}
                        style={[styles.iconButton, { backgroundColor: isDark ? colors.info[900] + '4D' : colors.info[50] }]}
                        hitSlop={spacing.sm}
                        activeOpacity={0.7}
                      >
                        <Pencil size={16} color={currentTheme.info} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(listing.id)}
                        disabled={deletingId === listing.id}
                        style={[
                          styles.iconButton,
                          {
                            backgroundColor: deletingId === listing.id
                              ? (isDark ? colors.error[900] + '33' : colors.error[100])
                              : (isDark ? colors.error[900] + '4D' : colors.error[50]),
                          },
                        ]}
                        hitSlop={spacing.sm}
                        activeOpacity={0.7}
                      >
                        {deletingId === listing.id ? (
                          <ActivityIndicator size="small" color={currentTheme.error} />
                        ) : (
                          <Trash2 size={16} color={currentTheme.error} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 48,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    minHeight: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: 0,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardBody: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: radii.md,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 80,
  },
});

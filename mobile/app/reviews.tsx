import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  useColorScheme,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ChevronLeft, Star, Plus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';
import { Card, Skeleton, EmptyState, Button } from '../src/components/ui';
import api, { Review, Contract } from '../src/config/api';

export default function ReviewsScreen() {
  const { contractId, listingId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolvedListingId, setResolvedListingId] = useState<string | null>(null);

  // Resolve listing_id from contract if only contractId is provided
  useEffect(() => {
    const resolveListingId = async () => {
      if (typeof listingId === 'string') {
        setResolvedListingId(listingId);
        return;
      }
      if (typeof contractId === 'string') {
        try {
          const res = await api.get<{ data: Contract }>(`/api/contracts/${contractId}`);
          setResolvedListingId(res.data.data?.listing_id || null);
        } catch (err) {
          console.error('Failed to fetch contract for listing_id:', err);
          setResolvedListingId(null);
        }
      } else {
        setResolvedListingId(null);
      }
    };
    resolveListingId();
  }, [listingId, contractId]);

  const fetchReviews = useCallback(async () => {
    try {
      const id = resolvedListingId;
      if (!id) { setLoading(false); return; }
      const endpoint = `/api/reviews/listing/${id}`;
      const res = await api.get<{ data: Review[] }>(endpoint).catch(() => ({ data: { data: [] } }));
      setReviews(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [resolvedListingId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews().finally(() => setRefreshing(false));
  };

  const handleSubmit = async () => {
    if (!rating || !comment) { Alert.alert('Missing Fields', 'Rating and comment are required.'); return; }
    if (!contractId) { Alert.alert('Error', 'Contract ID is required to submit a review.'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/reviews', { contract_id: contractId, rating, comment });
      setRating(0); setComment(''); setShowForm(false);
      fetchReviews();
      Alert.alert('Success', 'Review submitted!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (size: number, ratingValue: number, onPress?: (star: number) => void) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onPress?.(star)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.starButton}
        >
          <Star
            size={size}
            color={colors.accent[400]}
            fill={star <= ratingValue ? colors.accent[400] : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.flexCenter, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.flex1, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: currentTheme.surface,
          borderBottomColor: currentTheme.border,
        },
      ]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={currentTheme.primary} />
          </TouchableOpacity>
          <Text style={[typography.heading, { color: currentTheme.text }]}>Reviews</Text>
        </View>
        {contractId && !showForm && (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={[styles.writeButton, { backgroundColor: currentTheme.primary }]}
          >
            <Plus size={16} color={currentTheme.onPrimary} />
            <Text style={[typography.labelSm, { color: currentTheme.onPrimary }]}>Write</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.flex1}
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
          {showForm && (
            <Card variant="outlined" padding="lg" style={styles.formCard}>
              <Text style={[typography.title, { color: currentTheme.text, marginBottom: spacing.md }]}>
                Write a Review
              </Text>

              {renderStarRating(32, rating, setRating)}

              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Share your experience..."
                placeholderTextColor={currentTheme.inputPlaceholder}
                multiline
                numberOfLines={4}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: currentTheme.inputBackground,
                    borderColor: currentTheme.inputBorder,
                    color: currentTheme.inputText,
                  },
                ]}
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  onPress={() => setShowForm(false)}
                  style={[styles.cancelButton, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100] }]}
                >
                  <Text style={[typography.label, { color: currentTheme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={[styles.submitButton, { backgroundColor: currentTheme.primary, opacity: submitting ? 0.6 : 1 }]}
                >
                  {submitting ? (
                    <ActivityIndicator color={currentTheme.onPrimary} size="small" />
                  ) : (
                    <Text style={[typography.label, { color: currentTheme.onPrimary }]}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {reviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No reviews yet"
              description="Be the first to leave a review."
            />
          ) : (
            reviews.map((review) => (
              <Card key={review.id} variant="default" padding="lg" style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  {renderStarRating(16, review.rating)}
                  <Text style={[typography.captionXs, { color: currentTheme.textTertiary, marginLeft: spacing.sm }]}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[typography.bodySm, { color: currentTheme.textSecondary, lineHeight: 22 }]}>
                  {review.comment}
                </Text>
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
  flex1: {
    flex: 1,
  },
  flexCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.lg,
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
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    minHeight: 44,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  starRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  starButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: typography.bodySm.fontSize,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    minHeight: 44,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    minHeight: 44,
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    minHeight: 44,
  },
  reviewCard: {
    marginBottom: spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bottomSpacer: {
    height: spacing['3xl'],
  },
});

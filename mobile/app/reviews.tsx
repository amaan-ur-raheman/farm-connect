import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { ChevronLeft, Star, Plus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api, { Review } from '../src/config/api';

export default function ReviewsScreen() {
  const { contractId, listingId } = useLocalSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const id = (listingId || contractId) as string;
      if (!id) { setLoading(false); return; }
      const endpoint = `/api/reviews/listing/${id}`;
      const res = await api.get(endpoint).catch(() => ({ data: { data: [] } }));
      setReviews(res.data.data || res.data || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [listingId, contractId]);

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

  if (loading) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] items-center justify-center">
        <ActivityIndicator size="large" color="#4cae4f" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center justify-between border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#4cae4f" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Reviews</Text>
        </View>
        {contractId && !showForm && (
          <TouchableOpacity onPress={() => setShowForm(true)} className="bg-[#4cae4f] px-4 py-2 rounded-xl flex-row items-center gap-2">
            <Plus size={16} color="white" />
            <Text className="text-white font-bold text-sm">Write</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}>
        <View className="px-4 py-4">
          {showForm && (
            <View className="bg-white dark:bg-[#1e291e] rounded-2xl p-4 mb-4 border border-[#eaf0ea] dark:border-[#2a382a]">
              <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">Write a Review</Text>
              <View className="flex-row gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Star size={32} color="#facc15" fill={s <= rating ? '#facc15' : 'transparent'} />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput value={comment} onChangeText={setComment} placeholder="Share your experience..." placeholderTextColor="#9ca3af" multiline numberOfLines={4} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f9fbf9] dark:bg-[#151d15] text-sm text-slate-900 dark:text-white mb-3" style={{ textAlignVertical: 'top' }} />
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center">
                  <Text className="text-slate-700 dark:text-slate-300 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} disabled={submitting} className={`flex-1 py-3 rounded-xl bg-[#4cae4f] items-center ${submitting ? 'opacity-60' : ''}`}>
                  {submitting ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-bold">Submit Review</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {reviews.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-4">⭐</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">No reviews yet</Text>
              <Text className="text-sm text-gray-500 text-center px-8">Be the first to leave a review.</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} className="bg-white dark:bg-[#1e291e] rounded-2xl p-4 mb-4 border border-[#eaf0ea] dark:border-[#2a382a]">
                <View className="flex-row items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} color="#facc15" fill={i < review.rating ? '#facc15' : 'transparent'} />
                  ))}
                  <Text className="text-[10px] text-gray-400 ml-2">{new Date(review.created_at).toLocaleDateString()}</Text>
                </View>
                <Text className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.comment}</Text>
              </View>
            ))
          )}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  );
}

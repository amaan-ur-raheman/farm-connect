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
  Image,
  Alert,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import { ChevronLeft, Plus, Clock, Camera, X, Sprout } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api, { FarmUpdate } from '../../src/config/api';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, spacing, radii, typography, theme } from '../../src/config/theme';
import { Card, Skeleton, EmptyState } from '../../src/components/ui';
import NetInfo from '@react-native-community/netinfo';
import { SyncQueue } from '../../src/utils/syncQueue';
import { haptic } from '../../src/utils/haptics';

export default function UpdatesScreen() {
  const { contractId } = useLocalSearchParams();
  const { userRole } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [updates, setUpdates] = useState<FarmUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await api.get<{ data: FarmUpdate[] }>(`/api/updates/${contractId}`);
      setUpdates(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch farm updates:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUpdates().finally(() => setRefreshing(false));
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Grant photo library permission.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
      if (!caption && !mediaUri) {
        Alert.alert('Error', 'Please provide a caption or image.');
        return;
      }

      setSubmitting(true);
      haptic.light();

      try {
        const netInfo = await NetInfo.fetch();

        const formData = new FormData();
        formData.append('contract_id', contractId as string);
        if (caption) formData.append('caption', caption);
        if (mediaUri) {
          // @ts-ignore - React Native FormData file attachment
          formData.append('media', {
            uri: mediaUri,
            name: 'update.jpg',
            type: 'image/jpeg',
          } as any);
        }

        if (netInfo.isConnected) {
          await api.post('/api/updates', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          haptic.success();
          Alert.alert('Success', 'Update posted successfully!');
          setCaption('');
          setMediaUri(null);
          setShowForm(false);
          fetchUpdates();
        } else {
          await SyncQueue.enqueue({
            url: '/api/updates',
            method: 'POST',
            body: {
              contract_id: contractId,
              caption: caption,
              media_url: mediaUri, // Note: This will be a local URI, uploading requires special handling when online
            },
          });
          haptic.success();
          Alert.alert('Offline Mode', 'Your update has been saved and will sync when you are back online.');
          setCaption('');
          setMediaUri(null);
          setShowForm(false);
        }
      } catch (err: any) {
        haptic.error();
        Alert.alert('Error', err.response?.data?.message || 'Failed to post update.');
      } finally {
        setSubmitting(false);
      }
    };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Skeleton width={48} height={48} borderRadius={radii.lg} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={touch.hitSlop}
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={currentTheme.primary} />
          </TouchableOpacity>
          <Text style={[typography.heading, { color: currentTheme.text }]}>Farm Updates</Text>
        </View>
        {userRole === 'farmer' && !showForm && (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={[styles.postButton, { backgroundColor: currentTheme.primary }]}
            activeOpacity={0.8}
            hitSlop={touch.hitSlop}
          >
            <Plus size={16} color={currentTheme.onPrimary} />
            <Text style={[typography.labelSm, { color: currentTheme.onPrimary }]}>Post</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.primary}
          />
        }
      >
        {/* Post Form */}
        {showForm && (
          <Card variant="outlined" padding="lg" style={styles.formCard}>
            <Text style={[typography.titleSm, { color: currentTheme.text, marginBottom: spacing.md }]}>
              New Update
            </Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Describe the update..."
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

            {/* Media Preview */}
            {mediaUri ? (
              <View style={styles.mediaPreviewContainer}>
                <Image source={{ uri: mediaUri }} style={styles.mediaImage} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setMediaUri(null)}
                  style={styles.mediaRemoveButtonInner}
                  hitSlop={touch.hitSlop}
                  accessibilityLabel="Remove image"
                >
                  <View style={styles.mediaRemoveButton}>
                    <X size={14} color={currentTheme.onPrimary} />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickMedia}
                style={[
                  styles.mediaPickButton,
                  { borderColor: isDark ? colors.neutral[600] : colors.neutral[300] },
                ]}
                hitSlop={touch.hitSlop}
                accessibilityLabel="Add a photo"
              >
                <Camera size={24} color={currentTheme.textTertiary} />
                <Text style={[typography.caption, { color: currentTheme.textTertiary, marginTop: spacing.sm }]}>
                  Tap to add a photo
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.formActions}>
              <TouchableOpacity
                onPress={() => { setShowForm(false); setCaption(''); setMediaUri(null); }}
                style={[styles.formButton, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100] }]}
                activeOpacity={0.8}
                hitSlop={touch.hitSlop}
              >
                <Text style={[typography.labelSm, { color: currentTheme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={[styles.formButton, styles.submitButton, { backgroundColor: currentTheme.primary, opacity: submitting ? 0.6 : 1 }]}
                activeOpacity={0.8}
                hitSlop={touch.hitSlop}
                accessibilityLabel={submitting ? 'Posting update...' : 'Post update'}
              >
                {submitting ? (
                  <ActivityIndicator color={currentTheme.onPrimary} size="small" />
                ) : (
                  <Text style={[typography.label, { color: currentTheme.onPrimary }]}>Post Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Updates List */}
        {updates.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="No updates yet"
            description={
              userRole === 'farmer'
                ? 'Post farm updates with photos to keep investors informed.'
                : 'Updates from the farmer will appear here.'
            }
          />
        ) : (
          updates.map((update) => (
            <Card key={update.id} variant="default" padding="lg" style={styles.updateCard}>
              <View style={styles.timestampRow}>
                <Clock size={14} color={currentTheme.primary} />
                <Text style={[typography.captionXs, { color: currentTheme.textTertiary }]}>
                  {new Date(update.created_at).toLocaleString()}
                </Text>
              </View>
              {update.caption && (
                <Text style={[typography.bodySm, { color: currentTheme.text, marginBottom: spacing.sm }]}>
                  {update.caption}
                </Text>
              )}
              {update.media_url && (
                <Image source={{ uri: update.media_url }} style={styles.updateMedia} resizeMode="cover" />
              )}
            </Card>
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const touch = {
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 48,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  textInput: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    minHeight: 44,
  },
  mediaPreviewContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  mediaImage: {
    width: '100%',
    height: 160,
    borderRadius: radii.lg,
  },
  mediaRemoveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    backgroundColor: colors.error.light,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaRemoveButtonInner: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPickButton: {
    width: '100%',
    height: 160,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    minHeight: 44,
  },
  submitButton: {},
  bottomSpacer: {
    height: 80,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  updateMedia: {
    width: '100%',
    height: 176,
    borderRadius: radii.lg,
  },
});

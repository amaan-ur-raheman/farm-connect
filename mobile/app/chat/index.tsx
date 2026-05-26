import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { ChevronLeft, MessageSquare, Sprout } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import api, { Conversation, ChatMessage } from '../../src/config/api';
import { useSocketStore } from '../../src/stores';
import { useUnreadCounts } from '../../src/config/unread-context';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { colors, spacing, radii, typography, theme, getShadow } from '../../src/config/theme';

export default function ChatListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocketStore();
  const { refreshUnreadCounts } = useUnreadCounts();
  const lastFetchRef = useRef(0);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get<{ data: Conversation[] }>('/api/chat/conversations');
      setConversations(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshUnreadCounts();
      fetchConversations();
    }, [refreshUnreadCounts, fetchConversations])
  );

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg: ChatMessage) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === msg.conversation_id);
        if (index === -1) {
          if (Date.now() - lastFetchRef.current < 2000) return prev;
          lastFetchRef.current = Date.now();
          fetchConversations();
          return prev;
        }

        const updated = [...prev];
        const conv = { ...updated[index] };

        conv.last_message = {
          text: msg.text || '📎 Media',
          created_at: msg.created_at
        };

        conv.unread_count += 1;

        updated.splice(index, 1);
        updated.unshift(conv);
        return updated;
      });
    };

    socket.on('new_message', onNewMessage);
    return () => { socket.off('new_message', onNewMessage); };
  }, [socket, fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations().finally(() => setRefreshing(false));
  };

  const styles = createStyles(isDark, currentTheme);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.headerSkeleton}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Skeleton width={24} height={24} borderRadius={radii.sm} />
          </TouchableOpacity>
          <Skeleton width={120} height={28} />
        </View>
        <View style={styles.listSkeleton}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={48} height={48} borderRadius={radii.full} />
              <View style={styles.skeletonTextGroup}>
                <Skeleton width={140} height={16} />
                <Skeleton width={200} height={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={currentTheme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
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
        {conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Start a conversation from a listing or contract to connect with farmers and investors."
            actionLabel="Browse Marketplace"
            onAction={() => router.push('/marketplace')}
          />
        ) : (
          <View style={styles.listContainer}>
            {conversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={styles.convItem}
                onPress={() => router.push(`/chat/${conv.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={{
                      uri: conv.other_user?.avatar_url || `https://i.pravatar.cc/100?u=${conv.other_user?.id || 'unknown'}`,
                    }}
                    style={styles.avatar}
                  />
                  {conv.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{conv.unread_count}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.convContent}>
                  <View style={styles.convHeader}>
                    <Text
                      style={[
                        styles.convName,
                        conv.unread_count > 0 ? null : styles.convNameRead,
                      ]}
                    >
                      {conv.other_user?.name || 'User'}
                    </Text>
                    <Text style={styles.convDate}>
                      {conv.last_message
                        ? new Date(conv.last_message.created_at).toLocaleDateString()
                        : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.convMessage,
                      conv.unread_count > 0 ? styles.convMessageUnread : null,
                    ]}
                    numberOfLines={1}
                  >
                    {conv.last_message?.text || 'No messages yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(isDark: boolean, currentTheme: typeof theme.light) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    header: {
      backgroundColor: currentTheme.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing['3xl'],
      paddingBottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
      ...getShadow('sm', isDark),
    },
    headerSkeleton: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing['3xl'],
      paddingBottom: spacing.lg,
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
    headerTitle: {
      ...typography.heading,
      color: currentTheme.text,
    },
    scrollView: {
      flex: 1,
    },
    listContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    convItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
      minHeight: 44,
    },
    avatarContainer: {
      position: 'relative',
      marginRight: spacing.sm,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radii.full,
    },
    unreadBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: radii.full,
      backgroundColor: colors.error.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadText: {
      ...typography.captionXs,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    convContent: {
      flex: 1,
    },
    convHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    convName: {
      ...typography.bodySm,
      fontWeight: '700',
      color: currentTheme.text,
    },
    convNameRead: {
      opacity: 0.7,
    },
    convDate: {
      ...typography.captionXs,
      color: currentTheme.textTertiary,
    },
    convMessage: {
      ...typography.caption,
      color: currentTheme.textSecondary,
    },
    convMessageUnread: {
      fontWeight: '600',
      color: currentTheme.text,
    },
    listSkeleton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    skeletonTextGroup: {
      flex: 1,
      gap: spacing.sm,
    },
  });
}

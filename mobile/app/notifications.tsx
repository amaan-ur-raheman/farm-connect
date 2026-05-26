import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import {
  Bell,
  CheckCircle,
  Clock,
  MessageSquare,
  AlertTriangle,
  Wallet,
  Package,
  ChevronLeft,
} from 'lucide-react-native';
import { router } from 'expo-router';
import api, { Notification } from '../src/config/api';
import { useUnreadCounts } from '../src/config/unread-context';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';
import { Card, Skeleton, EmptyState, Button } from '../src/components/ui';

const typeIcons: Record<string, any> = {
  CONTRACT: Clock,
  PAYMENT: Wallet,
  DELIVERY: Package,
  DISPUTE: AlertTriangle,
  CHAT: MessageSquare,
  SYSTEM: Bell,
};

const typeColors: Record<string, string> = {
  CONTRACT: colors.info.light,
  PAYMENT: colors.success.light,
  DELIVERY: colors.warning.light,
  DISPUTE: colors.error.light,
  CHAT: '#8b5cf6',
  SYSTEM: colors.neutral[500],
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { refreshUnreadCounts } = useUnreadCounts();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<any>('/api/notifications');
      const responseData = res.data?.data;

      const notificationsArray = responseData?.notifications || responseData || [];

      if (!Array.isArray(notificationsArray)) {
        console.error('Notifications API returned unexpected format:', typeof responseData);
        setNotifications([]);
      } else {
        setNotifications(notificationsArray);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      refreshUnreadCounts();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshUnreadCounts();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={spacing.md}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={currentTheme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: currentTheme.error }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}
            hitSlop={spacing.sm}
            activeOpacity={0.7}
          >
            <Text style={[styles.markAllText, { color: currentTheme.primary }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll see updates about contracts, payments, and messages here."
        />
      ) : (
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
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            const iconColor = typeColors[notification.type] || colors.neutral[500];
            const isUnread = !notification.read;

            return (
              <Card
                key={notification.id}
                variant="interactive"
                padding="md"
                onPress={() => markAsRead(notification.id)}
                style={isUnread ? { backgroundColor: isDark ? `${colors.primary[500]}10` : `${colors.primary[500]}0D` } : undefined}
              >
                <View style={styles.notificationRow}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${iconColor}15` },
                    ]}
                  >
                    <Icon size={20} color={iconColor} />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          {
                            color: currentTheme.text,
                            opacity: isUnread ? 1 : 0.7,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {notification.title}
                      </Text>
                      {isUnread && (
                        <View style={[styles.unreadDot, { backgroundColor: currentTheme.primary }]} />
                      )}
                    </View>
                    <Text
                      style={[styles.notificationMessage, { color: currentTheme.textSecondary }]}
                      numberOfLines={2}
                    >
                      {notification.message}
                    </Text>
                    <Text style={[styles.timestamp, { color: currentTheme.textTertiary }]}>
                      {new Date(notification.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
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
  headerTitle: {
    ...typography.heading,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.captionXs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  markAllButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    ...typography.labelSm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  notificationCard: {
    marginBottom: 0,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    ...typography.labelSm,
    flex: 1,
    marginRight: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    marginLeft: spacing.xs,
  },
  notificationMessage: {
    ...typography.bodySm,
    marginBottom: spacing.xs,
  },
  timestamp: {
    ...typography.caption,
  },
  bottomSpacer: {
    height: spacing['3xl'],
  },
});

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import { TrendingUp, Sprout, Wheat, Package, Wallet } from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Card, Skeleton, EmptyState, StatTile } from '../src/components/ui';
import { Badge } from '../src/components/ui/Badge';
import api, { ConsumerStats, Contract } from '../src/config/api';
import { useAuthStore, useSocketStore } from '../src/stores';
import { useUnreadCounts } from '../src/config/unread-context';
import { haptic } from '../src/utils/haptics';
import { useQuery } from '@tanstack/react-query';
import { ConsumerStatsResponseSchema, ContractsResponseSchema } from '../src/config/schemas';
import { colors, spacing, radii, typography, theme, touch } from '../src/config/theme';

export default function InvestorDashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { socket } = useSocketStore();
  const { authUser } = useAuthStore();
  const { unreadCounts } = useUnreadCounts();
  const userImage = authUser?.avatar_url ? { uri: authUser.avatar_url } : undefined;
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching: isRefetchingStats } = useQuery({
    queryKey: ['consumerStats'],
    queryFn: async () => {
      const res = await api.get('/api/contracts/consumer/stats', undefined, ConsumerStatsResponseSchema);
      return res.data.data;
    },
  });

  const { data: contracts = [], isLoading: contractsLoading, refetch: refetchContracts, isRefetching: isRefetchingContracts } = useQuery({
    queryKey: ['consumerContracts'],
    queryFn: async () => {
      const res = await api.get('/api/contracts/consumer', undefined, ContractsResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
  });

  const loading = statsLoading || contractsLoading;
  const isRefetching = isRefetchingStats || isRefetchingContracts;

  // Refs to avoid stale closures in socket event handlers
  const refetchStatsRef = useRef(refetchStats);
  const refetchContractsRef = useRef(refetchContracts);
  useEffect(() => { refetchStatsRef.current = refetchStats; }, [refetchStats]);
  useEffect(() => { refetchContractsRef.current = refetchContracts; }, [refetchContracts]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      refetchStatsRef.current();
      refetchContractsRef.current();
    };

    socket.on('contract_update', handleUpdate);
    socket.on('delivery_update', handleUpdate);
    socket.on('new_notification', handleUpdate);

    return () => {
      socket.off('contract_update', handleUpdate);
      socket.off('delivery_update', handleUpdate);
      socket.off('new_notification', handleUpdate);
    };
  }, [socket]);

  const onRefresh = () => {
    haptic.light();
    setRefreshing(true);
    Promise.all([refetchStats(), refetchContracts()]).finally(() => setRefreshing(false));
  };

  const activeContracts = (contracts as Contract[]).filter((c: Contract) => c.status === 'ACTIVE');

  if (loading && !isRefetching) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Header
          variant="menu"
          userImage={userImage}
          onAvatarPress={() => router.push('/(tabs)/profile')}
          notificationCount={unreadCounts.notifications}
        />
        <View style={styles.content}>
          <Skeleton width={200} height={28} style={{ marginBottom: spacing['2xl'] }} />
          <View style={styles.statsRow}>
            <Card padding="md" style={styles.statCard}>
              <Skeleton width={40} height={40} style={{ marginBottom: spacing.sm }} />
              <Skeleton width={80} height={12} style={{ marginBottom: spacing.xs }} />
              <Skeleton width={100} height={20} />
            </Card>
            <Card padding="md" style={styles.statCard}>
              <Skeleton width={40} height={40} style={{ marginBottom: spacing.sm }} />
              <Skeleton width={80} height={12} style={{ marginBottom: spacing.xs }} />
              <Skeleton width={60} height={20} />
            </Card>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Header
        variant="menu"
        userImage={userImage}
        onAvatarPress={() => router.push('/(tabs)/profile')}
        notificationCount={unreadCounts.notifications}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.primary} />
        }
      >
        <View style={styles.section}>
          <Text style={[typography.heading, { color: currentTheme.text, marginBottom: spacing.xl }]}>Portfolio</Text>

          {/* Stats Grid */}
          <View style={styles.statsRow}>
            <StatTile
              icon={TrendingUp}
              iconColor={currentTheme.primary}
              label="Total Invested"
              value={`₹${(stats?.totalInvested || 0).toLocaleString('en-IN')}`}
            />
            <StatTile
              icon={Sprout}
              iconColor={currentTheme.info}
              label="Active Farms"
              value={stats?.activeInvestments || 0}
            />
          </View>

          <Card padding="md" style={styles.yieldCard}>
            <View style={styles.yieldRow}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? `${colors.accent[400]}20` : `${colors.accent[600]}10` }]}>
                <Wheat size={20} color={currentTheme.accent} />
              </View>
              <View>
                <Text style={[typography.caption, { color: currentTheme.textTertiary, fontWeight: '700', textTransform: 'uppercase' }]}>Total Yield</Text>
                <Text style={[typography.titleSm, { color: currentTheme.text, fontWeight: '700' }]}>{(stats?.totalYield || 0).toLocaleString('en-IN')} kg</Text>
              </View>
            </View>
          </Card>

          {/* Active Contracts */}
          {activeContracts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[typography.title, { color: currentTheme.text }]}>Active Contracts</Text>
                <TouchableOpacity
                  onPress={() => router.push('/contracts')}
                  hitSlop={touch.hitSlop}
                  style={styles.linkButton}
                >
                  <Text style={[typography.labelSm, { color: currentTheme.primary }]}>View My Contracts</Text>
                </TouchableOpacity>
              </View>
              {activeContracts.slice(0, 3).map((contract) => (
                <TouchableOpacity
                  key={contract.id}
                  onPress={() => router.push(`/contracts/${contract.id}`)}
                  style={[styles.contractCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                  hitSlop={touch.hitSlop}
                >
                  <View style={styles.contractInfo}>
                    <Text style={[typography.labelSm, { color: currentTheme.text }]} numberOfLines={1}>
                      {contract.listing?.name || contract.crop}
                    </Text>
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.xs }]}>
                      {contract.acreage} Acres · {new Date(contract.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.contractActions}>
                    <Badge
                      variant={contract.status === 'ACTIVE' ? 'success' : 'warning'}
                      label={contract.status}
                    />
                    <Text style={[typography.titleSm, { color: currentTheme.text }]}>
                      ₹{contract.total_amount?.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Updates */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.title, { color: currentTheme.text }]}>Farm Updates</Text>
              <TouchableOpacity
                onPress={() => router.push('/contracts')}
                hitSlop={touch.hitSlop}
                style={styles.linkButton}
              >
                <Text style={[typography.labelSm, { color: currentTheme.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>

            {stats?.recentUpdates?.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No updates yet"
                description="Updates will appear once farmers post from their fields."
                actionLabel="Browse Farms"
                onAction={() => router.push('/marketplace')}
              />
            ) : (
              stats?.recentUpdates?.map((update) => (
                <TouchableOpacity
                  key={update.id}
                  onPress={() => router.push(`/updates/${update.contract_id}`)}
                  style={[styles.updateCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                  hitSlop={touch.hitSlop}
                >
                  {update.media_url ? (
                    <Image source={{ uri: update.media_url }} style={styles.updateImage} />
                  ) : (
                    <View style={[styles.updatePlaceholder, { backgroundColor: isDark ? `${currentTheme.text}10` : colors.primary[50] }]}>
                      <Package size={20} color={currentTheme.textTertiary} />
                    </View>
                  )}
                  <View style={styles.updateContent}>
                    <Text style={[typography.labelSm, { color: currentTheme.text }]} numberOfLines={1}>
                      {update.contract?.listing?.name || 'Farm Update'}
                    </Text>
                    <Text style={[typography.bodySm, { color: currentTheme.textSecondary, marginTop: spacing.xs }]} numberOfLines={2}>
                      {update.caption || 'New update from the farm'}
                    </Text>
                    <Text style={[typography.captionXs, { color: currentTheme.textTertiary, marginTop: spacing.sm }]}>
                      {new Date(update.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                router.push('/marketplace');
              }}
              style={[styles.quickActionCard, { backgroundColor: currentTheme.primary, minHeight: touch.minTarget }]}
              hitSlop={touch.hitSlop}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Sprout size={24} color={currentTheme.onPrimary} />
              </View>
              <Text style={[typography.labelSm, { color: currentTheme.onPrimary }]}>Invest More</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                router.push('/contracts');
              }}
              style={[styles.quickActionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, borderWidth: 1, minHeight: touch.minTarget }]}
              hitSlop={touch.hitSlop}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: isDark ? `${colors.info.dark}20` : `${colors.info.light}10` }]}>
                <TrendingUp size={24} color={currentTheme.info} />
              </View>
              <Text style={[typography.labelSm, { color: currentTheme.text }]}>Portfolio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                router.push('/wallet');
              }}
              style={[styles.quickActionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, borderWidth: 1, minHeight: touch.minTarget }]}
              hitSlop={touch.hitSlop}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: isDark ? `${colors.accent[400]}20` : `${colors.accent[600]}10` }]}>
                <Wallet size={24} color={currentTheme.accent} />
              </View>
              <Text style={[typography.labelSm, { color: currentTheme.text }]}>Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[typography.captionXs, { color: currentTheme.textTertiary, textAlign: 'center' }]}>
            \u00A9 {new Date().getFullYear()} FarmConnect. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  linkButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: touch.minTarget,
    justifyContent: 'center',
  },
  yieldCard: {
    marginBottom: spacing.xl,
  },
  yieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    minHeight: touch.minTarget,
  },
  contractInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  contractActions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  updateCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    gap: spacing.lg,
    minHeight: touch.minTarget,
  },
  updateImage: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
  },
  updatePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateContent: {
    flex: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '30%',
    padding: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  footer: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
});

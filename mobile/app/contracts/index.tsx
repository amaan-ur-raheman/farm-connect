import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert, useColorScheme, StyleSheet } from 'react-native';
import {
  Plus,
  MessageSquare,
  FileText,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../../src/components/ui/Header';
import api, { Contract } from '../../src/config/api';
import { useAuthStore, useSocketStore } from '../../src/stores';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { haptic } from '../../src/utils/haptics';
import { useQuery } from '@tanstack/react-query';
import { ContractsResponseSchema } from '../../src/config/schemas';
import { colors, spacing, radii, typography, theme, getShadow } from '../../src/config/theme';

const statusConfig: Record<string, { colorLight: string; colorDark: string; bgLight: string; bgDark: string; icon: React.ElementType; label: string }> = {
  PENDING: { colorLight: colors.warning.light, colorDark: colors.warning.dark, bgLight: `${colors.warning.light}15`, bgDark: `${colors.warning.dark}20`, icon: Clock, label: 'Pending' },
  ACTIVE: { colorLight: colors.success.light, colorDark: colors.success.dark, bgLight: `${colors.success.light}15`, bgDark: `${colors.success.dark}20`, icon: CheckCircle, label: 'Active' },
  COMPLETED: { colorLight: colors.info.light, colorDark: colors.info.dark, bgLight: `${colors.info.light}15`, bgDark: `${colors.info.dark}20`, icon: FileText, label: 'Completed' },
  CANCELLED: { colorLight: colors.error.light, colorDark: colors.error.dark, bgLight: `${colors.error.light}15`, bgDark: `${colors.error.dark}20`, icon: XCircle, label: 'Cancelled' },
  DISPUTED: { colorLight: '#a855f7', colorDark: '#a855f7', bgLight: '#f3e8ff', bgDark: '#a855f720', icon: AlertCircle, label: 'Disputed' },
};

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const config = statusConfig[status] || { colorLight: currentTheme.textTertiary, colorDark: currentTheme.textTertiary, bgLight: `${colors.neutral[400]}15`, bgDark: `${colors.neutral[400]}20`, icon: FileText, label: status };
  const Icon = config.icon;
  const isMd = size === 'md';
  const statusColor = isDark ? config.colorDark : config.colorLight;
  const statusBg = isDark ? config.bgDark : config.bgLight;

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: statusBg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
      ]}
    >
      <Icon size={isMd ? 14 : 10} color={statusColor} />
      <Text
        style={[
          isMd ? styles.statusTextMd : styles.statusTextSm,
          { color: statusColor, marginLeft: isMd ? spacing.sm : spacing.xs },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

function StatTile({
  label,
  value,
  color,
  onPress,
  active,
}: {
  label: string;
  value: number;
  color: string;
  onPress: () => void;
  active: boolean;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  return (
    <TouchableOpacity
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={[
        styles.statTile,
        {
          backgroundColor: currentTheme.surface,
          borderColor: active ? color : currentTheme.border,
          borderWidth: active ? 2 : 1,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: currentTheme.textTertiary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ContractsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { isAuthenticated, userRole } = useAuthStore();
  const [filter, setFilter] = useState<string>('ALL');

  const { socket } = useSocketStore();

  const { data: contracts = [], isLoading: loading, refetch: refetchContracts, isRefetching: refreshing } = useQuery({
    queryKey: ['contracts', userRole],
    queryFn: async () => {
      const endpoint = userRole === 'farmer' ? '/api/contracts/farmer' : '/api/contracts/consumer';
      const res = await api.get(endpoint, undefined, ContractsResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      refetchContracts();
    };

    socket.on('contract_update', handleUpdate);
    socket.on('delivery_update', handleUpdate);

    return () => {
      socket.off('contract_update', handleUpdate);
      socket.off('delivery_update', handleUpdate);
    };
  }, [socket, refetchContracts]);

  const onRefresh = () => {
    if (!isAuthenticated) return;
    haptic.light();
    refetchContracts();
  };

  const handleAction = async (contractId: string, action: string) => {
    if (!isAuthenticated) return;
    haptic.light();
    try {
      await api.post(`/api/contracts/${contractId}/action`, { action });
      haptic.success();
      refetchContracts();
    } catch (err: any) {
      haptic.error();
      Alert.alert('Error', err.response?.data?.message || 'Action failed.');
    }
  };

  const handleStartChat = async (contract: Contract) => {
    const otherUserId = userRole === 'farmer' ? contract.consumer_id : contract.farmer_id;
    if (!otherUserId) {
      Alert.alert('Error', 'Could not find the other user.');
      return;
    }
    try {
      const res = await api.post<{ id: string }>('/api/chat/conversations', {
        participant_id: otherUserId,
        contract_id: contract.id,
      });
      const conversationId = res.data.id;
      router.push(`/chat/${conversationId}`);
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to start conversation.');
    }
  };

  const filteredContracts = filter === 'ALL' ? contracts : (contracts as Contract[]).filter((c: Contract) => c.status === filter);

  const getCount = (status: string) =>
    status === 'ALL' ? contracts.length : (contracts as Contract[]).filter((c: Contract) => c.status === status).length;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <StatusBar barStyle="dark-content" />
        <Header variant="back-title" title="Contracts" />
        <View style={styles.loadingContent}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.loadingCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
              <View style={styles.loadingCardHeader}>
                <View>
                  <Skeleton width={160} height={18} />
                  <Skeleton width={100} height={14} style={{ marginTop: spacing.sm }} />
                </View>
                <Skeleton width={70} height={24} borderRadius={radii.full} />
              </View>
              <Skeleton width={200} height={16} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const activeCount = getCount('ACTIVE');
  const pendingCount = getCount('PENDING');
  const completedCount = getCount('COMPLETED');

  const emptyStateMessages = {
    ALL: userRole === 'consumer'
      ? 'Browse the marketplace to find farms to invest in.'
      : 'Your contracts will appear here once investors sign up.',
    PENDING: "You don't have any pending contracts right now.",
    ACTIVE: "You don't have any active contracts right now.",
    COMPLETED: "You don't have any completed contracts right now.",
    CANCELLED: "You don't have any cancelled contracts right now.",
    DISPUTED: "You don't have any disputed contracts right now.",
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle="dark-content" />
      <Header variant="back-title" title="Contracts" />

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatTile label="Active" value={activeCount} color={currentTheme.success} onPress={() => setFilter('ACTIVE')} active={filter === 'ACTIVE'} />
          <StatTile label="Pending" value={pendingCount} color={currentTheme.warning} onPress={() => setFilter('PENDING')} active={filter === 'PENDING'} />
          <StatTile label="Done" value={completedCount} color={currentTheme.info} onPress={() => setFilter('COMPLETED')} active={filter === 'COMPLETED'} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.primary} />
        }
      >
        <View style={styles.content}>
          {filteredContracts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={`No ${filter === 'ALL' ? '' : filter.toLowerCase()} Contracts`}
              description={emptyStateMessages[filter as keyof typeof emptyStateMessages] || emptyStateMessages.ALL}
              actionLabel={
                userRole === 'consumer' && filter === 'ALL'
                  ? 'Browse Marketplace'
                  : userRole === 'farmer' && filter === 'ALL'
                    ? 'Create Listing'
                    : undefined
              }
              onAction={
                userRole === 'consumer' && filter === 'ALL'
                  ? () => router.push('/marketplace')
                  : userRole === 'farmer' && filter === 'ALL'
                    ? () => router.push('/listings/create')
                    : undefined
              }
            />
          ) : (
            <>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterText, { color: currentTheme.textTertiary }]}>
                  {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''}
                </Text>
                {filter !== 'ALL' && (
                  <TouchableOpacity onPress={() => setFilter('ALL')} style={styles.showAllButton} activeOpacity={0.7}>
                    <Text style={[styles.showAllText, { color: currentTheme.primary }]}>Show All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {(filteredContracts as Contract[]).map((contract: Contract) => {
                const config = statusConfig[contract.status] || statusConfig.PENDING;
                const statusColor = isDark ? config.colorDark : config.colorLight;
                const totalAmount = contract.total_amount || 0;

                return (
                  <TouchableOpacity
                    key={contract.id}
                    onPress={() => router.push(`/contracts/${contract.id}`)}
                    activeOpacity={0.7}
                    style={[
                      styles.contractCard,
                      {
                        backgroundColor: currentTheme.surface,
                        borderColor: currentTheme.border,
                      },
                    ]}
                  >
                    {/* Left accent bar */}
                    <View style={styles.contractCardInner}>
                      <View style={[styles.accentBar, { backgroundColor: statusColor }]} />

                      <View style={styles.contractCardContent}>
                        {/* Header row */}
                        <View style={styles.contractHeader}>
                          <View style={styles.contractTitleContainer}>
                            <Text style={[styles.contractTitle, { color: currentTheme.text }]} numberOfLines={1}>
                              {contract.listing?.name || 'Farm Contract'}
                            </Text>
                            {contract.listing && (
                              <View style={styles.locationRow}>
                                <MapPin size={12} color={currentTheme.textTertiary} />
                                <Text style={[styles.locationText, { color: currentTheme.textTertiary }]} numberOfLines={1}>
                                  {contract.listing.location_name}
                                </Text>
                              </View>
                            )}
                          </View>
                          <StatusBadge status={contract.status} />
                        </View>

                        {/* Financial row */}
                        <View style={[styles.financialRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : colors.primary[50] }]}>
                          <View style={styles.financialItem}>
                            <View style={styles.financialIconRow}>
                              <Wallet size={14} color={currentTheme.primary} />
                              <View>
                                <Text style={[styles.financialLabel, { color: currentTheme.textTertiary }]}>$/Acre</Text>
                                <Text style={[styles.financialValue, { color: currentTheme.primary }]}>
                                  ${(contract.price_per_acre || 0).toLocaleString('en-IN')}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View style={[styles.divider, { backgroundColor: isDark ? colors.neutral[700] : colors.neutral[200] }]} />
                          <View style={styles.financialItem}>
                            <Text style={[styles.financialLabel, { color: currentTheme.textTertiary }]}>Acreage</Text>
                            <Text style={[styles.financialValue, { color: currentTheme.text }]}>{contract.acreage || 0}</Text>
                          </View>
                          <View style={[styles.divider, { backgroundColor: isDark ? colors.neutral[700] : colors.neutral[200] }]} />
                          <View style={[styles.financialItem, styles.financialItemEnd]}>
                            <Text style={[styles.financialLabel, { color: currentTheme.textTertiary }]}>Total</Text>
                            <Text style={[styles.financialValue, { color: currentTheme.text }]}>
                              ${totalAmount.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.actionRow}>
                          {contract.status === 'PENDING' && userRole === 'farmer' && (
                            <>
                              <TouchableOpacity
                                onPress={() => handleAction(contract.id, 'accept')}
                                style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
                                activeOpacity={0.8}
                              >
                                <CheckCircle size={14} color={currentTheme.onPrimary} />
                                <Text style={[styles.actionButtonText, { color: currentTheme.onPrimary }]}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleAction(contract.id, 'reject')}
                                style={[styles.actionButton, { backgroundColor: currentTheme.error }]}
                                activeOpacity={0.8}
                              >
                                <XCircle size={14} color={currentTheme.onPrimary} />
                                <Text style={[styles.actionButtonText, { color: currentTheme.onPrimary }]}>Reject</Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {contract.status === 'ACTIVE' && (
                            <>
                              <TouchableOpacity
                                onPress={() => router.push(`/contracts/${contract.id}`)}
                                style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
                                activeOpacity={0.8}
                              >
                                <FileText size={14} color={currentTheme.onPrimary} />
                                <Text style={[styles.actionButtonText, { color: currentTheme.onPrimary }]}>View Details</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleStartChat(contract)}
                                style={[styles.chatButton, { backgroundColor: isDark ? colors.primary[900] : colors.primary[100] }]}
                                activeOpacity={0.8}
                              >
                                <MessageSquare size={16} color={currentTheme.primary} />
                              </TouchableOpacity>
                            </>
                          )}
                          {(contract.status === 'COMPLETED' || contract.status === 'CANCELLED') && (
                            <TouchableOpacity
                              onPress={() => router.push(`/contracts/${contract.id}`)}
                              style={[styles.passiveRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : colors.primary[50] }]}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.passiveText, { color: currentTheme.textTertiary }]}>
                                {new Date(contract.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </Text>
                              <ChevronRight size={16} color={currentTheme.textTertiary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
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
  loadingContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  loadingCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  loadingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 44,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 44,
  },
  filterText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  showAllButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  showAllText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  contractCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  contractCardInner: {
    flexDirection: 'row',
  },
  accentBar: {
    width: 6,
    alignSelf: 'stretch',
  },
  contractCardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  contractTitleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  contractTitle: {
    ...typography.title,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
  },
  statusTextMd: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusTextSm: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  financialItem: {
    flex: 1,
  },
  financialItemEnd: {
    alignItems: 'flex-end',
  },
  financialIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  financialLabel: {
    ...typography.captionXs,
    textTransform: 'uppercase',
  },
  financialValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 32,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  actionButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  chatButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  passiveRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  passiveText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 80,
  },
});

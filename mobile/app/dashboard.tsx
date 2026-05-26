import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import {
  MapPin,
  Bell,
  Wallet,
  History,
  Sprout,
  Package,
  ChevronRight,
  ChevronDown,
  Sun,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Skeleton } from '../src/components/ui/Skeleton';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { StatTile } from '../src/components/ui/StatTile';
import { WeatherCard } from '../src/components/ui/WeatherCard';
import { QuickActionCard } from '../src/components/ui/QuickActionCard';
import api, { Contract, FarmUpdate } from '../src/config/api';
import { useAuthStore, useSocketStore } from '../src/stores';
import { useUnreadCounts } from '../src/config/unread-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ContractsResponseSchema, FarmUpdatesResponseSchema, WalletBalanceResponseSchema } from '../src/config/schemas';
import { haptic } from '../src/utils/haptics';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const { socket } = useSocketStore();
  const { isAuthenticated, authUser, userRole } = useAuthStore();
  const { unreadCounts } = useUnreadCounts();
  const userImage = authUser?.avatar_url ? { uri: authUser.avatar_url } : undefined;

  const { data: contracts = [], isLoading: loadingContracts, refetch: refetchContracts, isRefetching: isRefetchingContracts } = useQuery({
    queryKey: ['farmerContracts'],
    queryFn: async () => {
      const res = await api.get('/api/contracts/farmer', undefined, ContractsResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: walletBalance = 0, refetch: refetchWallet, isRefetching: isRefetchingWallet } = useQuery({
    queryKey: ['walletBalance', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/wallet/balance', undefined, WalletBalanceResponseSchema).catch(() => ({ data: { success: true, data: { balance: 0, currency: 'INR', pending: 0 } } }));
      return res.data.data?.balance || 0;
    },
    enabled: isAuthenticated,
  });

  const { data: updates = [], refetch: refetchUpdates, isRefetching: isRefetchingUpdates } = useQuery({
    queryKey: ['farmerUpdates', selectedContract?.id],
    queryFn: async () => {
      if (!selectedContract?.id) return [];
      const res = await api.get(`/api/updates/${selectedContract.id}`, undefined, FarmUpdatesResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
    enabled: isAuthenticated && !!selectedContract?.id,
  });

  const { data: weather } = useQuery({
    queryKey: ['weather', selectedContract?.listing_id],
    queryFn: async () => {
      if (!selectedContract?.listing_id) return null;
      try {
        const res = await api.get(`/api/weather/${selectedContract.listing_id}`);
        return (res as any)?.data?.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated && !!selectedContract?.listing_id,
    refetchInterval: 10 * 60 * 1000,
  });

  const isRefetching = isRefetchingContracts || isRefetchingWallet || isRefetchingUpdates;

  const refetchContractsRef = useRef(refetchContracts);
  const refetchWalletRef = useRef(refetchWallet);
  const refetchUpdatesRef = useRef(refetchUpdates);
  useEffect(() => { refetchContractsRef.current = refetchContracts; }, [refetchContracts]);
  useEffect(() => { refetchWalletRef.current = refetchWallet; }, [refetchWallet]);
  useEffect(() => { refetchUpdatesRef.current = refetchUpdates; }, [refetchUpdates]);

  useEffect(() => {
    if (contracts.length > 0 && !selectedContract) {
      setSelectedContract(contracts[0] as Contract | null);
    }
  }, [contracts]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      refetchContractsRef.current();
      refetchWalletRef.current();
      refetchUpdatesRef.current();
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
    if (!isAuthenticated) return;
    haptic.light();
    setRefreshing(true);
    Promise.all([refetchContracts(), refetchWallet(), refetchUpdates()]).finally(() => setRefreshing(false));
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Header
        variant="menu"
        userImage={userImage}
        onAvatarPress={() => router.push('/(tabs)/profile')}
        notificationCount={unreadCounts.notifications}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[700]}
            colors={[colors.primary[700]]}
          />
        }
      >
        {/* Title Section */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ ...typography.display, color: currentTheme.text, fontSize: 28, marginBottom: spacing.xs }}>
                {userRole === 'consumer' ? t('dashboard.portfolio') : t('dashboard.myFarm')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={14} color={colors.primary[600]} />
                <Text style={{ ...typography.bodySm, color: colors.primary[600], marginLeft: spacing.xs }}>
                  {selectedContract?.listing?.location_name || 'Farm Dashboard'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={{ padding: spacing.sm }}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Bell size={22} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Quick View */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              router.push('/wallet');
            }}
            activeOpacity={0.8}
            style={{
              backgroundColor: isDark ? `${colors.primary[700]}15` : `${colors.primary[700]}10`,
              borderRadius: radii.xl,
              padding: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: radii.full,
                backgroundColor: colors.primary[700],
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Wallet size={20} color="white" />
              </View>
              <View>
                <Text style={{ ...typography.caption, color: colors.primary[600], textTransform: 'uppercase', fontWeight: '600' }}>
                  {t('dashboard.earnings')}
                </Text>
                <Text style={{ ...typography.title, color: currentTheme.text, fontWeight: '700' }}>
                  ₹{(walletBalance || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={{ ...typography.bodySm, color: colors.primary[700], fontWeight: '600' }}>
                {t('dashboard.withdraw')}
              </Text>
              <ChevronRight size={16} color={colors.primary[700]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Contract Selector */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              router.push('/contracts');
            }}
            activeOpacity={0.8}
            style={{
              backgroundColor: currentTheme.surface,
              borderWidth: 1,
              borderColor: currentTheme.border,
              borderRadius: radii.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ ...typography.captionXs, color: colors.primary[600], textTransform: 'uppercase', fontWeight: '600' }}>
                Selected Property
              </Text>
              <Text style={{ ...typography.bodySm, color: currentTheme.text, fontWeight: '500' }} numberOfLines={1}>
                {selectedContract?.listing?.name || 'Select Property'}
              </Text>
            </View>
            <ChevronDown size={14} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Contract Summary Card */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          {loadingContracts ? (
            <Card padding="xl">
              <Skeleton height={80} borderRadius={12} />
            </Card>
          ) : selectedContract ? (
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                router.push(`/contracts/${selectedContract.id}`);
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: currentTheme.surface,
                borderRadius: radii.xl,
                padding: spacing.xl,
                borderWidth: 2,
                borderColor: colors.primary[700],
                ...getShadow('lg', isDark),
              }}
            >
              <View style={{ position: 'absolute', top: 0, right: 0, padding: spacing.lg, opacity: 0.1 }}>
                <Text style={{ fontSize: 80, fontWeight: '900', color: colors.primary[700] }}>₹</Text>
              </View>

              <View>
                <Text style={{ ...typography.caption, color: colors.primary[600], textTransform: 'uppercase', fontWeight: '600', marginBottom: spacing.xs }}>
                  Property Value
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 32, fontWeight: '700', color: currentTheme.text }}>
                    ₹{selectedContract.total_amount?.toLocaleString('en-IN')}
                  </Text>
                  <Text style={{ ...typography.bodySm, color: currentTheme.textTertiary }}>
                    {selectedContract.acreage} Acres
                  </Text>
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  padding: spacing.md,
                  backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : colors.primary[50],
                  borderRadius: radii.lg,
                  marginBottom: spacing.md,
                }}>
                  <Text style={{ ...typography.bodySm, color: currentTheme.textSecondary, fontWeight: '500' }}>Lease Status</Text>
                  <Text style={{ ...typography.bodySm, color: currentTheme.text, fontWeight: '600' }}>{selectedContract.status}</Text>
                </View>

                <Text style={{ ...typography.bodySm, color: colors.primary[700], fontWeight: '600', textAlign: 'center' }}>
                  Tap to view details →
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Card padding="xl" style={{ alignItems: 'center' }}>
              <Text style={{ ...typography.body, color: currentTheme.textTertiary, marginBottom: spacing.md }}>
                No active leases
              </Text>
              <Button
                label="View Leases"
                onPress={() => {
                  haptic.light();
                  router.push('/contracts');
                }}
                size="md"
              />
            </Card>
          )}
        </View>

        {/* Weather or Farm Overview */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          {weather ? (
            <WeatherCard weather={weather} />
          ) : (
            <Card>
              <Text style={{ ...typography.titleSm, color: currentTheme.text, marginBottom: spacing.lg, fontWeight: '700' }}>
                Farm Overview
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                <StatTile
                  icon={Sun}
                  iconColor={colors.accent[600]}
                  label="Season"
                  value={new Date().getMonth() >= 6 && new Date().getMonth() <= 9 ? 'Kharif' : 'Rabi'}
                />
                <StatTile
                  icon={Sprout}
                  iconColor={colors.primary[700]}
                  label="Contracts"
                  value={contracts.length}
                />
                <StatTile
                  icon={History}
                  iconColor={colors.primary[600]}
                  label="Updates"
                  value={updates.length}
                />
                <StatTile
                  icon={Package}
                  iconColor={colors.primary[700]}
                  label="Status"
                  value={selectedContract?.status || 'N/A'}
                />
              </View>
            </Card>
          )}
        </View>

        {/* Recent Updates */}
        {updates.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                <Text style={{ ...typography.titleSm, color: currentTheme.text, fontWeight: '700' }}>Recent Updates</Text>
                <TouchableOpacity onPress={() => selectedContract && router.push(`/updates/${selectedContract.id}`)}>
                  <Text style={{ ...typography.bodySm, color: colors.primary[700], fontWeight: '600' }}>View All</Text>
                </TouchableOpacity>
              </View>
              {(updates as FarmUpdate[]).slice(0, 2).map((update: FarmUpdate, index: number) => (
                <View
                  key={update.id}
                  style={{
                    marginBottom: index === 0 ? spacing.md : 0,
                    paddingBottom: index === 0 ? spacing.md : 0,
                    borderBottomWidth: index === 0 ? 1 : 0,
                    borderBottomColor: currentTheme.border,
                  }}
                >
                  <Text style={{ ...typography.bodySm, color: currentTheme.text, fontWeight: '600', marginBottom: spacing.xs }} numberOfLines={2}>
                    {update.caption || 'Farm Update'}
                  </Text>
                  <Text style={{ ...typography.caption, color: currentTheme.textTertiary }}>
                    {new Date(update.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <Text style={{ ...typography.bodySm, color: currentTheme.text, fontWeight: '700', marginBottom: spacing.md }}>
            {t('dashboard.quickActions')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <QuickActionCard
              icon={Sprout}
              label="Manage Listings"
              onPress={() => {
                haptic.light();
                router.push('/listings');
              }}
              iconColor={colors.primary[700]}
              iconBgColor={isDark ? `${colors.primary[500]}20` : `${colors.primary[700]}10`}
            />
            <QuickActionCard
              icon={History}
              label="View Leases"
              onPress={() => {
                haptic.light();
                router.push('/contracts');
              }}
              iconColor={colors.accent[600]}
              iconBgColor={isDark ? `${colors.accent[500]}20` : `${colors.accent[600]}10`}
            />
            <QuickActionCard
              icon={Package}
              label="Deliveries"
              onPress={() => {
                haptic.light();
                router.push('/deliveries');
              }}
              iconColor={colors.info.light}
              iconBgColor={isDark ? `${colors.info.dark}20` : `${colors.info.light}10`}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={{ marginTop: spacing['3xl'], marginBottom: spacing.lg, paddingHorizontal: spacing.lg }}>
          <Text style={{ ...typography.captionXs, color: currentTheme.textTertiary, textAlign: 'center' }}>
            © {new Date().getFullYear()} FarmConnect. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

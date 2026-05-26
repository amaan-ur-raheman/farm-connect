import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput as RNTextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import { Wallet, ArrowUpRight, ArrowDownLeft, ChevronLeft, CreditCard } from 'lucide-react-native';
import { router } from 'expo-router';
import api, { WalletTransaction, WalletBalance } from '../src/config/api';
import { useAuthStore } from '../src/stores/authStore';
import { Input } from '../src/components/ui/Input';
import { useQuery } from '@tanstack/react-query';
import { WalletBalanceResponseSchema, WalletTransactionsResponseSchema } from '../src/config/schemas';
import { haptic } from '../src/utils/haptics';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';
import { Card } from '../src/components/ui/Card';
import { Skeleton } from '../src/components/ui/Skeleton';
import { EmptyState } from '../src/components/ui/EmptyState';
import { Button } from '../src/components/ui/Button';

export default function WalletScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { userRole } = useAuthStore();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const withdrawRef = useRef<RNTextInput>(null);

  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance, isRefetching: isRefetchingBalance } = useQuery({
    queryKey: ['walletBalance', 'wallet'],
    queryFn: async () => {
      const res = await api.get('/api/wallet/balance', undefined, WalletBalanceResponseSchema);
      return res.data.data;
    },
  });

  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx, isRefetching: isRefetchingTx } = useQuery({
    queryKey: ['walletTransactions'],
    queryFn: async () => {
      const res = await api.get('/api/wallet/transactions', undefined, WalletTransactionsResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
  });

  const loading = balanceLoading || txLoading;
  const isRefetching = isRefetchingBalance || isRefetchingTx;
  const balance = {
    balance: balanceData?.balance ?? 0,
    currency: balanceData?.currency ?? 'INR',
  };

  const onRefresh = () => {
    haptic.light();
    refetchBalance();
    refetchTx();
  };

  const handleWithdraw = async () => {
    Keyboard.dismiss();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      haptic.error();
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (amount > balance.balance) {
      haptic.error();
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance.');
      return;
    }
    setWithdrawing(true);
    haptic.light();
    try {
      await api.post('/api/wallet/withdraw', { amount });
      haptic.success();
      Alert.alert('Success', `₹${amount.toLocaleString('en-IN')} withdrawal initiated.`);
      setWithdrawAmount('');
      refetchBalance();
      refetchTx();
    } catch (err: any) {
      haptic.error();
      Alert.alert('Error', err.response?.data?.message || 'Withdrawal failed.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading && !isRefetching) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={currentTheme.primary} />
          </TouchableOpacity>
          <Text style={[typography.heading, { color: currentTheme.text, textTransform: 'uppercase' }]}>My Wallet</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={currentTheme.primary}
            />
          }
        >
          {/* Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: currentTheme.primary, ...getShadow('xl', isDark) }]}>
            <View style={styles.balanceHeader}>
              <View style={[styles.balanceBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Wallet size={16} color={currentTheme.onPrimary} />
                <Text style={[typography.captionXs, { color: currentTheme.onPrimary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }]}>
                  Available Balance
                </Text>
              </View>
              <CreditCard size={24} color={currentTheme.onPrimary} opacity={0.5} />
            </View>
            <View style={styles.balanceAmountRow}>
              <Text style={[typography.title, { color: currentTheme.onPrimary, marginRight: spacing.xs }]}>₹</Text>
              <Text style={[
                { fontSize: 48, lineHeight: 56, fontWeight: '900', color: currentTheme.onPrimary, letterSpacing: -2 }
              ]}>
                {balance.balance.toLocaleString('en-IN')}
              </Text>
            </View>
            <Text style={[typography.captionXs, { color: 'rgba(255, 255, 255, 0.6)', fontWeight: '700', marginTop: spacing.sm, textTransform: 'uppercase', letterSpacing: 2 }]}>
              {balance.currency} • SECURE WALLET
            </Text>
          </View>

          {/* Withdraw (Farmers only) */}
          {userRole === 'farmer' && (
            <Card variant="outlined" padding="xl" style={styles.withdrawCard}>
              <Text style={[typography.titleSm, { color: currentTheme.text, textTransform: 'uppercase', marginBottom: spacing.xl }]}>
                Withdraw Funds
              </Text>
              <View style={styles.withdrawRow}>
                <View style={styles.withdrawInputWrapper}>
                  <Input
                    ref={withdrawRef}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    style={styles.withdrawInput}
                    icon={<Text style={[typography.label, { color: colors.neutral[400], marginLeft: spacing.sm }]}>INR</Text>}
                    returnKeyType="done"
                    onSubmitEditing={handleWithdraw}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                  style={[
                    styles.withdrawButton,
                    { backgroundColor: currentTheme.primary, opacity: !withdrawAmount ? 0.5 : 1, ...getShadow('md', isDark) }
                  ]}
                  activeOpacity={0.8}
                >
                  {withdrawing ? (
                    <ActivityIndicator color={currentTheme.onPrimary} size="small" />
                  ) : (
                    <Text style={[typography.labelSm, { color: currentTheme.onPrimary, textTransform: 'uppercase', letterSpacing: 1 }]}>
                      Withdraw
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={[typography.captionXs, { color: currentTheme.textTertiary, marginTop: spacing.lg, textAlign: 'center' }]}>
                Funds will be transferred to your linked bank account within 24-48 hours.
              </Text>
            </Card>
          )}

          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsHeader}>
              <Text style={[typography.titleSm, { color: currentTheme.text, textTransform: 'uppercase' }]}>
                Activity Log
              </Text>
              <View style={[styles.txCountBadge, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100] }]}>
                <Text style={[typography.captionXs, { color: currentTheme.textTertiary, fontWeight: '700' }]}>
                  {transactions.length} entries
                </Text>
              </View>
            </View>

            {txLoading ? (
              <View style={styles.skeletonList}>
                {[1, 2, 3].map((i) => (
                  <Card key={i} variant="default" padding="md" style={styles.skeletonTxCard}>
                    <View style={styles.skeletonTxRow}>
                      <Skeleton width={48} height={48} borderRadius={radii.md} />
                      <View style={styles.skeletonTxContent}>
                        <Skeleton width="60%" height={16} />
                        <Skeleton width="40%" height={10} style={{ marginTop: spacing.sm }} />
                      </View>
                      <Skeleton width={80} height={20} />
                    </View>
                  </Card>
                ))}
              </View>
            ) : transactions.length === 0 ? (
              <Card variant="default" padding="3xl" style={styles.emptyCard}>
                <EmptyState
                  icon={CreditCard}
                  title="No activity yet"
                  description="Your transaction and withdrawal history will appear here."
                />
              </Card>
            ) : (
              transactions.map((tx) => (
                <Card key={tx.id} variant="default" padding="md" style={styles.txCard}>
                  <View style={styles.txRow}>
                    <View style={[
                      styles.txIconContainer,
                      {
                        backgroundColor: tx.type === 'CREDIT'
                          ? (isDark ? 'rgba(22, 163, 74, 0.2)' : colors.primary[50])
                          : (isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2')
                      }
                    ]}>
                      {tx.type === 'CREDIT' ? (
                        <ArrowDownLeft size={22} color={currentTheme.success} strokeWidth={2.5} />
                      ) : (
                        <ArrowUpRight size={22} color={currentTheme.error} strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={styles.txContent}>
                      <View style={styles.txDescriptionRow}>
                        <Text
                          style={[typography.bodySm, { color: currentTheme.text, fontWeight: '700' }]}
                          numberOfLines={1}
                        >
                          {tx.description}
                        </Text>
                      </View>
                      <View style={styles.txMetaRow}>
                        <Text style={[typography.captionXs, { color: currentTheme.textTertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: -0.5 }]}>
                          {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                        {tx.status !== 'SUCCESS' && (
                          <View style={[
                            styles.statusBadge,
                            {
                              backgroundColor: tx.status === 'PENDING'
                                ? (isDark ? 'rgba(234, 88, 12, 0.3)' : '#FFF7ED')
                                : (isDark ? 'rgba(220, 38, 38, 0.3)' : '#FEF2F2')
                            }
                          ]}>
                            <Text style={[
                              typography.captionXs,
                              {
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: -0.5,
                                color: tx.status === 'PENDING' ? '#EA580C' : currentTheme.error
                              }
                            ]}>
                              {tx.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.txAmountContainer}>
                      <Text style={[
                        typography.title,
                        {
                          fontWeight: '900',
                          color: tx.type === 'CREDIT' ? currentTheme.success : currentTheme.error
                        }
                      ]}>
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
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
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radii['2xl'],
    padding: spacing['3xl'],
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  withdrawCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
  },
  withdrawRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  withdrawInputWrapper: {
    flex: 1,
  },
  withdrawInput: {
    ...typography.title,
  },
  withdrawButton: {
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  transactionsSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
    marginBottom: spacing['2xl'],
  },
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  txCountBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  txCard: {
    marginBottom: spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    minWidth: 48,
    minHeight: 48,
  },
  txContent: {
    flex: 1,
  },
  txDescriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  txAmountContainer: {
    alignItems: 'flex-end',
  },
  skeletonList: {
    gap: spacing.md,
  },
  skeletonTxCard: {
    marginBottom: spacing.md,
  },
  skeletonTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  skeletonTxContent: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

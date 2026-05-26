import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import {
  MapPin,
  MessageSquare,
  Package,
  Star,
  Clock,
  Wallet,
  CreditCard,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  ChevronRight,
  Sprout,
  Users,
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, spacing, radii, typography, theme, getShadow } from '../../src/config/theme';
import { Card } from '../../src/components/ui/Card';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Header } from '../../src/components/ui/Header';
import api, { Contract, FarmUpdate, Delivery, EscrowLedgerEntry, Listing } from '../../src/config/api';
import { useAuthStore } from '../../src/stores/authStore';
import { startRazorpayPayment } from '../../src/utils/razorpay';

const statusConfig: Record<string, { color: (t: typeof theme.light) => string; bg: (t: typeof theme.light) => string; icon: React.ElementType; label: string }> = {
  PENDING: {
    color: () => colors.warning.light,
    bg: (t) => t.success,
    icon: Clock,
    label: 'Pending',
  },
  ACTIVE: {
    color: () => colors.success.light,
    bg: (t) => t.success,
    icon: CheckCircle,
    label: 'Active',
  },
  COMPLETED: {
    color: () => colors.info.light,
    bg: (t) => t.info,
    icon: FileText,
    label: 'Completed',
  },
  CANCELLED: {
    color: () => colors.error.light,
    bg: (t) => t.error,
    icon: XCircle,
    label: 'Cancelled',
  },
  DISPUTED: {
    color: () => '#a855f7',
    bg: (t) => '#f3e8ff',
    icon: AlertCircle,
    label: 'Disputed',
  },
};

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userRole } = useAuthStore();
  const [contract, setContract] = useState<Contract | null>(null);
  const [updates, setUpdates] = useState<FarmUpdate[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [escrow, setEscrow] = useState<EscrowLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [wageAmount, setWageAmount] = useState('');

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? theme.dark : theme.light;
  const touchHitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

  const fetchData = async () => {
    try {
      const [contractRes, updatesRes, deliveriesRes, escrowRes] = await Promise.all([
        api.get<{ data: Contract }>(`/api/contracts/${id}`).catch(() => null),
        api.get<{ data: FarmUpdate[] }>(`/api/updates/${id}`).catch(() => ({ data: { data: [] } })),
        api.get<{ data: Delivery[] }>(`/api/deliveries/contract/${id}`).catch(() => ({ data: { data: [] } })),
        api.get<{ data: EscrowLedgerEntry[] }>(`/api/escrow/contracts/${id}/ledger`).catch(() => ({ data: { data: [] } })),
      ]);
      if (contractRes) setContract(contractRes.data.data || null);
      setUpdates(updatesRes.data.data || []);
      setDeliveries(deliveriesRes.data.data || []);
      setEscrow(escrowRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch contract details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAction = async (action: string, payload: any = {}) => {
    setActionLoading(true);
    try {
      await api.post(`/api/contracts/${id}/action`, { action, ...payload });
      await fetchData();
      if (action === 'release_wage') setWageAmount('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!contract) return;
    const remaining = (contract.total_amount || 0) - (contract.escrow_held || 0);

    if (remaining <= 0) {
      Alert.alert('Escrow Full', 'Total contract amount is already in escrow.');
      return;
    }

    try {
      await startRazorpayPayment({
        amount: remaining,
        contract_id: contract.id,
        description: `Payment for ${contract.listing?.name || 'contract'}`,
        prefill: {
          name: contract.listing?.farmer?.name || '',
          contact: contract.listing?.farmer?.phone || '',
        },
      });
      Alert.alert('Success', 'Escrow deposit successful!');
      fetchData();
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'Deposit failed.');
    }
  };

  const handleStartChat = async () => {
    if (!contract) return;
    const otherUserId = userRole === 'farmer' ? contract.consumer_id : contract.listing?.farmer_id;
    if (!otherUserId) {
      Alert.alert('Error', 'Could not find the other user.');
      return;
    }
    try {
      const res = await api.post<{ id: string }>('/api/chat/conversations', {
        participant_id: otherUserId,
        contract_id: contract.id,
      });
      router.push(`/chat/${res.data.id}`);
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to start conversation.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Header variant="back-title" title="Contract" />
        <View style={styles.loadingContainer}>
          <Card padding="xl" style={styles.loadingCard}>
            <Skeleton height={24} width="70%" />
            <View style={{ height: spacing.md }} />
            <Skeleton height={16} width="50%" />
            <View style={{ height: spacing.xl }} />
            <Skeleton height={8} width="100%" />
            <View style={{ height: spacing.sm }} />
            <View style={styles.loadingRow}>
              <Skeleton height={40} width="45%" />
              <Skeleton height={40} width="45%" />
            </View>
          </Card>
        </View>
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Header variant="back-title" title="Contract" />
        <EmptyState
          icon={AlertCircle}
          title="Contract Not Found"
          actionLabel="Retry"
          onAction={fetchData}
          style={{ flex: undefined }}
        />
        <View style={styles.emptyActions}>
          <TouchableOpacity
            onPress={() => router.push('/contracts')}
            style={[styles.secondaryButton, { backgroundColor: t.border }]}
            hitSlop={touchHitSlop}
          >
            <Text style={[styles.secondaryButtonText, { color: t.text }]}>Back to Contracts</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalContractAmount = contract.total_amount || 0;
  const escrowHeld = contract.escrow_held || 0;
  const escrowProgress = totalContractAmount > 0 ? Math.min(escrowHeld / totalContractAmount, 1) : 0;
  const config = statusConfig[contract.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const statusColor = config.color(t);
  const statusBg = config.bg(t);


  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header variant="back-title" title="Contract" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Status Card */}
        <Card padding="xl" style={styles.heroCard}>
          <View style={[styles.heroAccentBar, { backgroundColor: statusColor }]} />
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleRow}>
              <View style={[styles.statusIconContainer, { backgroundColor: statusBg }]}>
                <StatusIcon size={20} color={statusColor} />
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={[typography.title, { color: t.text }]} numberOfLines={1}>
                  {contract.listing?.name || 'Farm Contract'}
                </Text>
                {contract.listing && (
                  <View style={styles.locationRow}>
                    <MapPin size={12} color={t.textTertiary} />
                    <Text style={[typography.caption, { color: t.textTertiary }]} numberOfLines={1}>
                      {contract.listing.location_name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[typography.caption, { color: statusColor, fontWeight: '700' }]}>{config.label}</Text>
            </View>
          </View>

          {/* Escrow Progress */}
          <View style={[styles.progressSection, { borderTopColor: t.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[typography.caption, { color: t.textTertiary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }]}>
                Escrow Progress
              </Text>
              <Text style={[typography.caption, { color: statusColor, fontWeight: '700' }]}>
                {Math.round(escrowProgress * 100)}%
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100] }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${escrowProgress * 100}%`,
                    backgroundColor: statusColor,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[typography.captionXs, { color: t.textTertiary }]}>
                {'₹'}{escrowHeld.toLocaleString('en-IN')} held
              </Text>
              <Text style={[typography.captionXs, { color: t.textTertiary }]}>
                {'₹'}{totalContractAmount.toLocaleString('en-IN')} total
              </Text>
            </View>
          </View>
        </Card>

        {/* Financial Details */}
        <View style={styles.section}>
          <Text style={[typography.bodySm, { color: t.textTertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginLeft: spacing.xs }]}>
            Financial Details
          </Text>
          <View style={[styles.financialCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.financialRow, { borderBottomColor: t.border }]}>
              <View style={[styles.financialCell, { borderRightColor: t.border }]}>
                <View style={[styles.financialIconContainer, { backgroundColor: `${colors.success.light}1A` }]}>
                  <Wallet size={18} color={colors.success.light} />
                </View>
                <Text style={[typography.captionXs, { color: t.textTertiary, textTransform: 'uppercase', marginBottom: 2 }]}>Price/Acre</Text>
                <Text style={[typography.titleSm, { color: colors.success.light, fontWeight: '700' }]}>
                  {'₹'}{(contract.price_per_acre || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.financialCell}>
                <View style={[styles.financialIconContainer, { backgroundColor: `${colors.info.light}1A` }]}>
                  <Sprout size={18} color={colors.info.light} />
                </View>
                <Text style={[typography.captionXs, { color: t.textTertiary, textTransform: 'uppercase', marginBottom: 2 }]}>Acreage</Text>
                <Text style={[typography.titleSm, { color: t.text, fontWeight: '700' }]}>{contract.acreage || 0}</Text>
              </View>
            </View>
            <View style={styles.financialRow}>
              <View style={[styles.financialCell, { borderRightColor: t.border }]}>
                <View style={[styles.financialIconContainer, { backgroundColor: `${colors.accent[400]}1A` }]}>
                  <CreditCard size={18} color={colors.accent[400]} />
                </View>
                <Text style={[typography.captionXs, { color: t.textTertiary, textTransform: 'uppercase', marginBottom: 2 }]}>Escrow Held</Text>
                <Text style={[typography.titleSm, { color: colors.accent[400], fontWeight: '700' }]}>
                  {'₹'}{escrowHeld.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.financialCell}>
                <View style={[styles.financialIconContainer, { backgroundColor: '#a855f71A' }]}>
                  <Users size={18} color="#a855f7" />
                </View>
                <Text style={[typography.captionXs, { color: t.textTertiary, textTransform: 'uppercase', marginBottom: 2 }]}>Paid to Farmer</Text>
                <Text style={[typography.titleSm, { color: colors.info.light, fontWeight: '700' }]}>
                  {'₹'}{(contract.farmer_paid || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          {contract.status === 'PENDING' && userRole === 'farmer' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => handleAction('accept')}
                disabled={actionLoading}
                style={[styles.primaryButton, { backgroundColor: t.primary, minHeight: 48 }]}
                hitSlop={touchHitSlop}
              >
                <CheckCircle size={18} color={t.onPrimary} />
                <Text style={[typography.label, { color: t.onPrimary, marginLeft: spacing.sm }]}>
                  {actionLoading ? 'Processing...' : 'Accept Contract'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAction('reject')}
                disabled={actionLoading}
                style={[styles.primaryButton, { backgroundColor: t.error, minHeight: 48 }]}
                hitSlop={touchHitSlop}
              >
                <XCircle size={18} color={t.onPrimary} />
                <Text style={[typography.label, { color: t.onPrimary, marginLeft: spacing.sm }]}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {contract.status === 'ACTIVE' && (
            <View style={styles.actionsStack}>
              {userRole === 'consumer' && contract.escrow_held < totalContractAmount && (
                <TouchableOpacity
                  onPress={handleDeposit}
                  style={[styles.primaryButton, { backgroundColor: t.primary, minHeight: 48 }]}
                  hitSlop={touchHitSlop}
                >
                  <CreditCard size={20} color={t.onPrimary} />
                  <Text style={[typography.label, { color: t.onPrimary, marginLeft: spacing.sm }]}>Deposit Funds to Escrow</Text>
                </TouchableOpacity>
              )}

              {userRole === 'farmer' && (
                <Card padding="lg" style={styles.wageCard}>
                  <View style={styles.wageHeader}>
                    <Wallet size={16} color={t.primary} />
                    <Text style={[typography.bodySm, { color: t.text, fontWeight: '700', marginLeft: spacing.sm }]}>Wage Release Request</Text>
                  </View>
                  <View style={styles.wageInputRow}>
                    <TextInput
                      placeholder="Enter amount"
                      placeholderTextColor={t.inputPlaceholder}
                      keyboardType="numeric"
                      value={wageAmount}
                      onChangeText={setWageAmount}
                      style={[styles.textInput, {
                        backgroundColor: t.inputBackground,
                        borderColor: t.inputBorder,
                        color: t.inputText,
                      }]}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const amount = parseFloat(wageAmount);
                        if (!isNaN(amount) && amount > 0) {
                          handleAction('release_wage', { amount });
                        }
                      }}
                      disabled={actionLoading || !wageAmount}
                      style={[styles.wageButton, {
                        backgroundColor: t.primary,
                        opacity: actionLoading || !wageAmount ? 0.5 : 1,
                      }]}
                      hitSlop={touchHitSlop}
                    >
                      <Text style={[typography.labelSm, { color: t.onPrimary }]}>Release</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}

              <View style={styles.actionRow}>
                {userRole === 'farmer' && (
                  <TouchableOpacity
                    onPress={() => handleAction('settlement')}
                    disabled={actionLoading}
                    style={[styles.primaryButton, { backgroundColor: t.info, minHeight: 48 }]}
                    hitSlop={touchHitSlop}
                  >
                    <CheckCircle size={18} color={t.onPrimary} />
                    <Text style={[typography.label, { color: t.onPrimary, marginLeft: spacing.sm }]}>Final Settlement</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleAction('cancel')}
                  disabled={actionLoading}
                  style={[styles.outlineButton, {
                    backgroundColor: isDark ? `${colors.error.light}1A` : `${colors.error.light}0D`,
                    borderColor: isDark ? `${colors.error.light}33` : `${colors.error.light}33`,
                    minHeight: 48,
                  }]}
                  hitSlop={touchHitSlop}
                >
                  <XCircle size={18} color={t.error} />
                  <Text style={[typography.label, { color: t.error, marginLeft: spacing.sm }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleStartChat}
            style={[styles.chatButton, {
              backgroundColor: t.surface,
              borderColor: t.border,
              minHeight: 48,
            }]}
            hitSlop={touchHitSlop}
          >
            <MessageSquare size={18} color={t.primary} />
            <Text style={[typography.label, { color: t.text, marginLeft: spacing.sm }]}>
              Chat with {userRole === 'farmer' ? 'Consumer' : 'Farmer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View style={[styles.section, { marginTop: spacing['2xl'] }]}>
          <Text style={[typography.bodySm, { color: t.textTertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginLeft: spacing.xs }]}>
            Quick Links
          </Text>
          <View style={styles.quickLinksRow}>
            <TouchableOpacity
              onPress={() => router.push(`/updates/${contract.id}`)}
              style={[styles.quickLinkCard, { backgroundColor: t.surface, borderColor: t.border }]}
              hitSlop={touchHitSlop}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: `${colors.success.light}1A` }]}>
                <Clock size={20} color={colors.success.light} />
              </View>
              <Text style={[typography.bodySm, { color: t.text, fontWeight: '700' }]}>Updates</Text>
              {updates.length > 0 && (
                <Text style={[typography.captionXs, { color: t.textTertiary }]}>{updates.length}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/deliveries?contractId=${contract.id}`)}
              style={[styles.quickLinkCard, { backgroundColor: t.surface, borderColor: t.border }]}
              hitSlop={touchHitSlop}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: `${colors.accent[400]}1A` }]}>
                <Package size={20} color={colors.accent[400]} />
              </View>
              <Text style={[typography.bodySm, { color: t.text, fontWeight: '700' }]}>Deliveries</Text>
              {deliveries.length > 0 && (
                <Text style={[typography.captionXs, { color: t.textTertiary }]}>{deliveries.length}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/reviews?contractId=${contract.id}`)}
              style={[styles.quickLinkCard, { backgroundColor: t.surface, borderColor: t.border }]}
              hitSlop={touchHitSlop}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: `${colors.accent[300]}1A` }]}>
                <Star size={20} color={colors.accent[300]} />
              </View>
              <Text style={[typography.bodySm, { color: t.text, fontWeight: '700' }]}>Reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Escrow Ledger Timeline */}
        <View style={[styles.section, { marginTop: spacing['2xl'], marginBottom: spacing.lg }]}>
          <Text style={[typography.bodySm, { color: t.textTertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md, marginLeft: spacing.xs }]}>
            Escrow Ledger
          </Text>
          {escrow.length === 0 ? (
            <View style={[styles.emptyLedger, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={[styles.emptyLedgerIcon, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100] }]}>
                <Wallet size={24} color={t.textTertiary} />
              </View>
              <Text style={[typography.bodySm, { color: t.text, fontWeight: '700', marginBottom: spacing.xs }]}>No Transactions Yet</Text>
              <Text style={[typography.bodySm, { color: t.textTertiary, textAlign: 'center' }]}>
                Escrow activity will appear here once funds are deposited.
              </Text>
            </View>
          ) : (
            <Card padding="lg" style={styles.ledgerCard}>
              {escrow.map((entry, index) => (
                <View key={entry.id} style={styles.ledgerEntry}>
                  <View style={styles.ledgerTimeline}>
                    <View style={[styles.ledgerDot, { backgroundColor: `${t.primary}1A` }]}>
                      <Wallet size={16} color={t.primary} />
                    </View>
                    {index < escrow.length - 1 && (
                      <View style={[styles.ledgerLine, { backgroundColor: isDark ? colors.neutral[700] : colors.neutral[200] }]} />
                    )}
                  </View>
                  <View style={styles.ledgerContent}>
                    <View style={styles.ledgerHeader}>
                      <Text style={[typography.bodySm, { color: t.text, fontWeight: '700' }]}>{entry.event}</Text>
                      <Text style={[typography.bodySm, { color: t.primary, fontWeight: '700' }]}>
                        {'₹'}{entry.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    {entry.description && (
                      <Text style={[typography.caption, { color: t.textTertiary, marginTop: spacing.xs }]}>{entry.description}</Text>
                    )}
                    <Text style={[typography.captionXs, { color: t.textTertiary, marginTop: spacing.xs }]}>
                      {new Date(entry.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>

        {/* Farm Updates Preview */}
        {updates.length > 0 && (
          <View style={[styles.section, { marginBottom: spacing['3xl'] }]}>
            <View style={styles.updatesHeader}>
              <Text style={[typography.bodySm, { color: t.textTertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }]}>
                Recent Updates
              </Text>
              <TouchableOpacity onPress={() => router.push(`/updates/${contract.id}`)} hitSlop={touchHitSlop}>
                <Text style={[typography.caption, { color: t.primary, fontWeight: '700' }]}>View All</Text>
              </TouchableOpacity>
            </View>
            {updates.slice(0, 3).map((update) => (
              <TouchableOpacity
                key={update.id}
                onPress={() => router.push(`/updates/${contract.id}`)}
                style={[styles.updateCard, { backgroundColor: t.surface, borderColor: t.border }]}
                hitSlop={touchHitSlop}
              >
                <View style={[styles.updateIcon, { backgroundColor: `${t.primary}1A` }]}>
                  <Sprout size={18} color={t.primary} />
                </View>
                <View style={styles.updateContent}>
                  <Text style={[typography.bodySm, { color: t.text, fontWeight: '700', marginBottom: spacing.xs }]}>{update.caption || 'Farm Update'}</Text>
                  <Text style={[typography.captionXs, { color: t.textTertiary }]}>
                    {new Date(update.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <ChevronRight size={16} color={t.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingCard: {
    width: '100%',
  },
  loadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  emptyActions: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    overflow: 'hidden',
    padding: 0,
  },
  heroAccentBar: {
    height: 6,
  },
  heroHeader: {
    padding: spacing.lg,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  progressSection: {
    marginTop: 0,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressBarBg: {
    width: '100%',
    height: 10,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  financialCard: {
    overflow: 'hidden',
    padding: 0,
  },
  financialRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  financialCell: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  financialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionsStack: {
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondaryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    minHeight: 48,
  },
  secondaryButtonText: {
    ...typography.label,
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  wageCard: {
    marginBottom: spacing.sm,
  },
  wageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  wageInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  wageButton: {
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  chatButton: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickLinkCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.lg,
    minHeight: 48,
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyLedger: {
    alignItems: 'center',
    padding: spacing['2xl'],
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  emptyLedgerIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ledgerCard: {
    padding: spacing.lg,
  },
  ledgerEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ledgerTimeline: {
    alignItems: 'center',
    marginRight: spacing.md,
    paddingTop: 4,
  },
  ledgerDot: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerLine: {
    width: 2,
    height: 40,
    marginTop: spacing.xs,
  },
  ledgerContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  updateCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    minHeight: 48,
  },
  updateIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  updateContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
});

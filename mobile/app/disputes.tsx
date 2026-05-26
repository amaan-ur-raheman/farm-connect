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
} from 'react-native';
import { ChevronLeft, AlertTriangle, Plus, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';
import { Card, Skeleton, EmptyState, Button } from '../src/components/ui';
import api, { Dispute } from '../src/config/api';
import { validateDisputeReason } from '../src/utils/validation';

const disputeStatusConfig: Record<string, { colorLight: string; colorDark: string }> = {
  OPEN: { colorLight: colors.warning.light, colorDark: colors.warning.dark },
  UNDER_REVIEW: { colorLight: colors.info.light, colorDark: colors.info.dark },
  RESOLVED: { colorLight: colors.success.light, colorDark: colors.success.dark },
  ESCALATED: { colorLight: colors.error.light, colorDark: colors.error.dark },
};

export default function DisputesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [contractId, setContractId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = useCallback(async () => {
    try {
      const res = await api.get<{ data: Dispute[] }>('/api/disputes');
      setDisputes(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDisputes().finally(() => setRefreshing(false));
  };

  const handleSubmit = async () => {
    if (!contractId || !reason || !description) {
      Alert.alert('Missing Fields', 'All fields are required.');
      return;
    }
    const validation = validateDisputeReason(reason);
    if (!validation.isValid) {
      Alert.alert('Invalid', validation.error || 'Invalid reason');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/disputes', { contract_id: contractId, reason, description, evidence_urls: [] });
      setContractId('');
      setReason('');
      setDescription('');
      setShowForm(false);
      fetchDisputes();
      Alert.alert('Success', 'Dispute filed successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to file dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingCenter}>
          <Skeleton width={40} height={40} borderRadius={radii.full} />
        </View>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    const config = disputeStatusConfig[status];
    return config ? (isDark ? config.colorDark : config.colorLight) : currentTheme.textTertiary;
  };

  const getStatusBgColor = (status: string) => {
    const baseColor = getStatusColor(status);
    return `${baseColor}20`;
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={spacing.md}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={currentTheme.primary} />
          </TouchableOpacity>
          <Text style={[typography.heading, { color: currentTheme.text }]}>Disputes</Text>
        </View>
        {!showForm && (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={[styles.fileButton, { backgroundColor: currentTheme.error }]}
            activeOpacity={0.8}
          >
            <Plus size={16} color={colors.neutral[50]} />
            <Text style={[typography.labelSm, { color: colors.neutral[50] }]}>File</Text>
          </TouchableOpacity>
        )}
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
        <View style={styles.content}>
          {showForm && (
            <Card variant="elevated" padding="lg" style={styles.formCard}>
              <Text style={[typography.title, { color: currentTheme.text, marginBottom: spacing.lg }]}>
                File a Dispute
              </Text>

              <TextInput
                value={contractId}
                onChangeText={setContractId}
                placeholder="Contract ID"
                placeholderTextColor={currentTheme.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.inputBackground,
                    borderColor: currentTheme.inputBorder,
                    color: currentTheme.inputText,
                    marginBottom: spacing.md,
                  },
                ]}
              />

              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Reason for dispute"
                placeholderTextColor={currentTheme.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.inputBackground,
                    borderColor: currentTheme.inputBorder,
                    color: currentTheme.inputText,
                    marginBottom: spacing.md,
                  },
                ]}
              />

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue in detail..."
                placeholderTextColor={currentTheme.inputPlaceholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: currentTheme.inputBackground,
                    borderColor: currentTheme.inputBorder,
                    color: currentTheme.inputText,
                    marginBottom: spacing.md,
                  },
                ]}
              />

              <View style={styles.formActions}>
                <Button
                  label="Cancel"
                  onPress={() => setShowForm(false)}
                  variant="secondary"
                  size="md"
                  style={styles.cancelButton}
                />
                <Button
                  label="File Dispute"
                  onPress={handleSubmit}
                  variant="primary"
                  size="md"
                  loading={submitting}
                  disabled={submitting}
                  style={styles.submitButton}
                  labelStyle={{ color: colors.neutral[50] }}
                />
              </View>
            </Card>
          )}

          {disputes.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No disputes"
              description="Your filed disputes will appear here."
            />
          ) : (
            disputes.map((dispute) => {
              const statusColor = getStatusColor(dispute.status);
              const statusBg = getStatusBgColor(dispute.status);

              return (
                <Card key={dispute.id} variant="elevated" padding="lg" style={styles.disputeCard}>
                  <View style={styles.disputeHeader}>
                    <View style={styles.disputeTitleRow}>
                      <AlertTriangle size={20} color={statusColor} />
                      <Text
                        style={[typography.labelSm, { color: currentTheme.text, marginLeft: spacing.sm }]}
                        numberOfLines={1}
                      >
                        {dispute.reason}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[typography.captionXs, { color: statusColor, fontWeight: '700' }]}>
                        {dispute.status}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[typography.bodySm, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}
                    numberOfLines={3}
                  >
                    {dispute.description}
                  </Text>

                  <Text style={[typography.captionXs, { color: currentTheme.textTertiary }]}>
                    Filed: {new Date(dispute.created_at).toLocaleDateString()}
                  </Text>
                </Card>
              );
            })
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
  loadingCenter: {
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
  fileButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
    minHeight: 44,
  },
  textArea: {
    minHeight: 120,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  disputeCard: {
    marginBottom: spacing.lg,
  },
  disputeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  disputeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  bottomSpacer: {
    height: 80,
  },
});

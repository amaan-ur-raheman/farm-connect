import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { MapPin, ChevronRight, Calendar, Sprout } from 'lucide-react-native';
import { colors, spacing, radii, typography, theme, getShadow } from '../../config/theme';
import { Contract } from '../../config/api';

interface ContractCardProps {
  contract: Contract;
  onPress: () => void;
  compact?: boolean;
}

/**
 * ContractCard Component - Displays contract information
 * 
 * Usage:
 * <ContractCard
 *   contract={contract}
 *   onPress={() => router.push(`/contracts/${contract.id}`)}
 * />
 */
export function ContractCard({ contract, onPress, compact = false }: ContractCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const getStatusColor = () => {
    switch (contract.status) {
      case 'ACTIVE':
        return isDark ? colors.success.dark : colors.success.light;
      case 'PENDING':
        return isDark ? colors.warning.dark : colors.warning.light;
      case 'COMPLETED':
        return isDark ? colors.info.dark : colors.info.light;
      case 'DISPUTED':
        return isDark ? colors.error.dark : colors.error.light;
      default:
        return currentTheme.textTertiary;
    }
  };

  const getStatusBg = () => {
    switch (contract.status) {
      case 'ACTIVE':
        return isDark ? `${colors.success.dark}20` : `${colors.success.light}15`;
      case 'PENDING':
        return isDark ? `${colors.warning.dark}20` : `${colors.warning.light}15`;
      case 'COMPLETED':
        return isDark ? `${colors.info.dark}20` : `${colors.info.light}15`;
      case 'DISPUTED':
        return isDark ? `${colors.error.dark}20` : `${colors.error.light}15`;
      default:
        return isDark ? `${colors.neutral[400]}20` : `${colors.neutral[400]}15`;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
          ...getShadow('md', isDark),
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: currentTheme.text }]} numberOfLines={1}>
            {contract.listing?.name || 'Contract'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBg() }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {contract.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MapPin size={14} color={currentTheme.textTertiary} />
          <Text style={[styles.detailText, { color: currentTheme.textSecondary }]} numberOfLines={1}>
            {contract.listing?.location_name || 'Location N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Sprout size={14} color={currentTheme.textTertiary} />
          <Text style={[styles.detailText, { color: currentTheme.textSecondary }]}>
            {contract.acreage} Acres • {contract.crop}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color={currentTheme.textTertiary} />
          <Text style={[styles.detailText, { color: currentTheme.textSecondary }]}>
            {new Date(contract.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={[styles.label, { color: currentTheme.textTertiary }]}>Total Value</Text>
          <Text style={[styles.value, { color: currentTheme.text }]}>
            ₹{contract.total_amount?.toLocaleString('en-IN')}
          </Text>
        </View>
        <ChevronRight size={20} color={currentTheme.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.titleSm,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  details: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.bodySm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.primary[100],
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.title,
    fontWeight: '700',
  },
});

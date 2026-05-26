import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radii, typography, theme } from '../../config/theme';

interface StatTileProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string | number;
  subtitle?: string;
  iconBgColor?: string;
}

/**
 * StatTile Component - Compact metric display for dashboards
 * 
 * Usage:
 * <StatTile
 *   icon={ThermometerSun}
 *   iconColor={colors.accent[600]}
 *   label="Temperature"
 *   value="28°C"
 *   subtitle="Feels like 30°C"
 * />
 */
export function StatTile({
  icon: Icon,
  iconColor,
  label,
  value,
  subtitle,
  iconBgColor,
}: StatTileProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const bgColor = iconBgColor || (isDark ? `${iconColor}15` : `${iconColor}10`);

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <Icon size={14} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={[styles.label, { color: currentTheme.textTertiary }]}>{label}</Text>
      <Text style={[styles.value, { color: currentTheme.text }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: currentTheme.textTertiary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primary[50],
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.titleSm,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radii, typography, theme, getShadow } from '../../config/theme';

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  iconColor: string;
  iconBgColor?: string;
}

/**
 * QuickActionCard Component - Circular icon with label for dashboard actions
 * 
 * Usage:
 * <QuickActionCard
 *   icon={Sprout}
 *   label="Manage Listings"
 *   onPress={() => router.push('/listings')}
 *   iconColor={colors.primary[700]}
 *   iconBgColor={colors.primary[50]}
 * />
 */
export function QuickActionCard({
  icon: Icon,
  label,
  onPress,
  iconColor,
  iconBgColor,
}: QuickActionCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const bgColor = iconBgColor || (isDark ? `${iconColor}15` : `${iconColor}10`);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <Icon size={24} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={[styles.label, { color: currentTheme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
    padding: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodySm,
    fontWeight: '600',
    textAlign: 'center',
  },
});

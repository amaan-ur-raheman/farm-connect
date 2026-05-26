import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { colors, radii, spacing, theme, getShadow } from '../../config/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding?: keyof typeof spacing;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Card Component - Foundation container for Farm Connect
 * 
 * Variants:
 * - default: Flat card with subtle border
 * - elevated: Card with shadow (use sparingly)
 * - outlined: Card with stronger border
 * - interactive: Card that responds to press with scale animation
 * 
 * Usage:
 * <Card variant="elevated" padding="lg">
 *   <Text>Content here</Text>
 * </Card>
 */
export function Card({
  children,
  variant = 'default',
  padding = 'lg',
  onPress,
  style,
}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const getCardStyles = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: radii.xl,
      padding: spacing[padding],
      backgroundColor: currentTheme.surface,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          ...getShadow('md', isDark),
        };
      case 'outlined':
        return {
          ...base,
          borderWidth: 2,
          borderColor: currentTheme.borderStrong,
        };
      case 'interactive':
        return {
          ...base,
          borderWidth: 1,
          borderColor: currentTheme.border,
          ...getShadow('sm', isDark),
        };
      default:
        return {
          ...base,
          borderWidth: 1,
          borderColor: currentTheme.border,
        };
    }
  };

  // Interactive variant with press feedback
  if (variant === 'interactive' && onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[getCardStyles(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyles(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // No additional styles needed - all handled inline
});

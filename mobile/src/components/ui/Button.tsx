import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  StyleSheet,
} from 'react-native';
import { colors, radii, typography, animation, getShadow } from '../../config/theme';
import { useColorScheme } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  labelStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: animation.touch.scale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getButtonStyles = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.lg,
      gap: 8,
    };

    // Size variants
    const sizeVariants = {
      sm: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
      md: { paddingVertical: 12, paddingHorizontal: 24, minHeight: 44 },
      lg: { paddingVertical: 16, paddingHorizontal: 32, minHeight: 56 },
    };

    // Variant styles
    if (variant === 'primary') {
      return {
        ...base,
        ...sizeVariants[size],
        backgroundColor: isDark ? colors.primary[500] : colors.primary[700],
        ...getShadow('md', isDark),
      };
    }

    if (variant === 'secondary') {
      return {
        ...base,
        ...sizeVariants[size],
        backgroundColor: isDark ? colors.primary[900] : colors.primary[100],
        borderWidth: 1,
        borderColor: isDark ? colors.primary[700] : colors.primary[200],
      };
    }

    if (variant === 'outline') {
      return {
        ...base,
        ...sizeVariants[size],
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: isDark ? colors.primary[500] : colors.primary[700],
      };
    }

    // Ghost
    return {
      ...base,
      ...sizeVariants[size],
      backgroundColor: 'transparent',
    };
  };

  const getLabelStyles = (): TextStyle => {
    const base: TextStyle = {
      ...typography.label,
    };

    if (size === 'sm') {
      Object.assign(base, typography.labelSm);
    } else if (size === 'lg') {
      Object.assign(base, typography.labelLg);
    }

    if (variant === 'primary') {
      base.color = isDark ? colors.primary[900] : '#FFFFFF';
    } else if (variant === 'secondary') {
      base.color = isDark ? colors.primary[300] : colors.primary[700];
    } else {
      base.color = isDark ? colors.primary[400] : colors.primary[700];
    }

    return base;
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : 'auto' }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => {
          handlePressIn();
        }}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[getButtonStyles(), style, isDisabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? (isDark ? colors.primary[900] : '#FFFFFF') : isDark ? colors.primary[400] : colors.primary[700]}
          />
        ) : (
          <>
            {leftIcon}
            <Text style={[getLabelStyles(), labelStyle]}>{label}</Text>
            {rightIcon}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { colors, radii } from '../../config/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = radii.sm, style }: SkeletonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const widthStyle = typeof width === 'string' ? { width } : { width: width || '100%' };
  const heightStyle = typeof height === 'string' ? { height } : { height: height || 20 };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          backgroundColor: isDark ? '#2A382A' : colors.primary[100],
          borderRadius,
          ...widthStyle,
          ...heightStyle,
          opacity,
        },
        style,
      ] as Animated.WithAnimatedArray<ViewStyle>}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Sun, CloudRain, Droplets, Wind, ThermometerSun, Cloud } from 'lucide-react-native';
import { colors, spacing, radii, typography, theme } from '../../config/theme';
import { StatTile } from './StatTile';

interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon?: string;
}

interface WeatherCardProps {
  weather: WeatherData;
  season?: string;
}

/**
 * WeatherCard Component - Displays current weather conditions
 * 
 * Usage:
 * <WeatherCard weather={{
 *   temperature: 28,
 *   feels_like: 30,
 *   humidity: 65,
 *   wind_speed: 12,
 *   description: 'Partly Cloudy'
 * }} />
 */
export function WeatherCard({ weather, season }: WeatherCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  // Get weather icon based on description
  const getWeatherIcon = () => {
    const desc = weather.description.toLowerCase();
    if (desc.includes('rain')) return CloudRain;
    if (desc.includes('cloud')) return Cloud;
    return Sun;
  };

  const WeatherIcon = getWeatherIcon();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          {weather.description}
        </Text>
        <View style={[styles.badge, { backgroundColor: isDark ? colors.primary[900] : colors.primary[100] }]}>
          <Text style={[styles.badgeText, { color: isDark ? colors.primary[300] : colors.primary[700] }]}>
            Live Weather
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <StatTile
          icon={ThermometerSun}
          iconColor={colors.accent[600]}
          label="Temp"
          value={`${weather.temperature}°C`}
          subtitle={`Feels like ${weather.feels_like}°C`}
        />
        <StatTile
          icon={Droplets}
          iconColor={colors.info.light}
          label="Humidity"
          value={`${weather.humidity}%`}
        />
        <StatTile
          icon={Wind}
          iconColor={colors.primary[700]}
          label="Wind"
          value={`${weather.wind_speed} km/h`}
        />
        <StatTile
          icon={Sun}
          iconColor={colors.accent[600]}
          label="Season"
          value={season || 'Rabi'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});

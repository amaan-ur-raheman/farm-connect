import { prisma } from '@/config/database';
import { redisClient } from '@/config/redis';
import { env } from '@/config/env';
import { NotFoundError, BadRequestError } from '@/shared/errors';

const WEATHER_CACHE_TTL = 1800; // 30 minutes
const WEATHER_CACHE_PREFIX = 'weather:';

export interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  listing_id: string;
  location_name: string;
}

export const getWeatherForListing = async (listingId: string): Promise<WeatherData> => {
  // Look up the listing with its coordinates
  const listing = await prisma.farmListing.findUnique({
    where: { id: listingId },
    select: { latitude: true, longitude: true, name: true },
  });

  if (!listing) {
    throw new NotFoundError('Listing not found');
  }

  const cacheKey = `${WEATHER_CACHE_PREFIX}${listing.latitude.toFixed(2)}:${listing.longitude.toFixed(2)}`;

  // Try cache first
  const cached = await redisClient.get<WeatherData>(cacheKey);
  if (cached) {
    return cached;
  }

  // If no API key configured, return mock data for development
  if (!env.weather.openweatherApiKey) {
    const mockData: WeatherData = {
      temperature: 28,
      feels_like: 31,
      humidity: 72,
      wind_speed: 12,
      description: 'Partly cloudy',
      icon: '02d',
      listing_id: listingId,
      location_name: listing.name,
    };
    // Cache mock data for 5 min (shorter since it's fake)
    await redisClient.set(cacheKey, mockData, { ex: 300 });
    return mockData;
  }

  // Fetch from OpenWeather
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${listing.latitude}&lon=${listing.longitude}&units=metric&appid=${env.weather.openweatherApiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new BadRequestError(`Weather API returned ${response.status}`);
  }

  const data = (await response.json()) as {
    main: { temp: number; feels_like: number; humidity: number };
    wind: { speed: number };
    weather: Array<{ description: string; icon: string }>;
  };

  const weatherData: WeatherData = {
    temperature: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    wind_speed: Math.round(data.wind.speed * 3.6), // m/s → km/h
    description: capitalizeFirst(data.weather[0]?.description || 'Unknown'),
    icon: data.weather[0]?.icon || '01d',
    listing_id: listingId,
    location_name: listing.name,
  };

  // Cache the result
  await redisClient.set(cacheKey, weatherData, { ex: WEATHER_CACHE_TTL });

  return weatherData;
};

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

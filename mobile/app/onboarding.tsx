import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sprout, TrendingUp, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: Sprout,
    title: 'Welcome to FarmConnect',
    description: 'Connect directly with farmers and invest in sustainable agriculture. Earn returns while supporting local farming.',
    color: '#4cae4f',
    bgColor: '#f0fdf4',
  },
  {
    icon: TrendingUp,
    title: 'Invest & Earn',
    description: 'Browse verified farm listings, invest in crops you believe in, and track your returns in real-time.',
    color: '#3b82f6',
    bgColor: '#eff6ff',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Transparent',
    description: 'Your investment is protected by escrow. Track farm progress, chat with farmers, and receive updates.',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<ScrollView>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  const skip = () => {
    completeOnboarding();
  };

  const goBack = () => {
    if (currentIndex > 0) {
      slidesRef.current?.scrollTo({
        x: width * (currentIndex - 1),
        animated: true,
      });
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/login');
  };

  const slide = slides[currentIndex];
  const Icon = slide.icon;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Skip Button */}
      <View className="absolute top-4 right-4 z-10">
        <TouchableOpacity onPress={skip} className="px-4 py-2">
          <Text className="text-gray-500 font-semibold">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      {currentIndex > 0 && (
        <View className="absolute top-4 left-4 z-10">
          <TouchableOpacity onPress={goBack} className="p-2">
            <ArrowLeft size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Icon */}
        <View
          className="w-32 h-32 rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: slide.bgColor }}
        >
          <Icon size={64} color={slide.color} strokeWidth={1.5} />
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          {slide.title}
        </Text>

        {/* Description */}
        <Text className="text-base text-gray-600 text-center leading-relaxed">
          {slide.description}
        </Text>
      </View>

      {/* Pagination Dots */}
      <View className="flex-row justify-center items-center mb-8">
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={{
                width: dotWidth,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === currentIndex ? '#4cae4f' : '#e5e7eb',
                opacity,
                marginHorizontal: 4,
              }}
            />
          );
        })}
      </View>

      {/* Next/Get Started Button */}
      <View className="px-8 pb-8">
        <TouchableOpacity
          onPress={scrollTo}
          className="bg-[#4cae4f] py-4 rounded-2xl flex-row items-center justify-center gap-2"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ChevronRight size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

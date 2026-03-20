import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Tractor,
  ShieldCheck,
  TrendingUp,
  Sprout,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react-native';

type UserRole = 'investor' | 'farmer' | null;

export default function RegisterStep1() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    if (!selectedRole) {
      Alert.alert('Select Role', 'Please select Investor or Farmer');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Store form data and proceed to verification
      router.push({
        pathname: '/register/verification',
        params: {
          role: selectedRole!,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
      });
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Bar */}
          <View className="mb-8">
            <View className="h-1.5 bg-[#eaf0ea] dark:bg-[#2a382a] rounded-full overflow-hidden">
              <View className="h-full w-[33%] bg-primary rounded-full" />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Step 1 of 3 • Account Setup
            </Text>
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-text-main dark:text-white mb-2">
            Create Your Account
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Join FarmConnect to start investing in sustainable agriculture
          </Text>

          {/* Role Selection */}
          <Text className="text-sm font-semibold text-text-main dark:text-white mb-3">
            I want to join as
          </Text>
          <View className="flex-row gap-3 mb-6">
            {/* Investor Option */}
            <TouchableOpacity
              onPress={() => {
                setSelectedRole('investor');
                if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
              }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                selectedRole === 'investor'
                  ? 'border-primary bg-primary/5'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <View className={`size-10 rounded-full items-center justify-center mb-3 ${
                selectedRole === 'investor' ? 'bg-primary' : 'bg-[#4cae4f]/20'
              }`}>
                <TrendingUp size={20} color={selectedRole === 'investor' ? 'white' : '#4cae4f'} />
              </View>
              <Text className="text-sm font-semibold text-text-main dark:text-white mb-1">
                Investor
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Fund farms and earn returns
              </Text>
              {selectedRole === 'investor' && (
                <View className="absolute top-3 right-3">
                  <ShieldCheck size={18} color="#2be619" />
                </View>
              )}
            </TouchableOpacity>

            {/* Farmer Option */}
            <TouchableOpacity
              onPress={() => {
                setSelectedRole('farmer');
                if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
              }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                selectedRole === 'farmer'
                  ? 'border-primary bg-primary/5'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <View className={`size-10 rounded-full items-center justify-center mb-3 ${
                selectedRole === 'farmer' ? 'bg-primary' : 'bg-[#4cae4f]/20'
              }`}>
                <Sprout size={20} color={selectedRole === 'farmer' ? 'white' : '#4cae4f'} />
              </View>
              <Text className="text-sm font-semibold text-text-main dark:text-white mb-1">
                Farmer
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                List your farm and get funded
              </Text>
              {selectedRole === 'farmer' && (
                <View className="absolute top-3 right-3">
                  <ShieldCheck size={18} color="#2be619" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          {errors.role && (
            <Text className="text-xs text-red-500 mb-4 -mt-2">{errors.role}</Text>
          )}

          {/* Form Fields */}
          <View className="gap-4">
            {/* Name Row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  First Name
                </Text>
                <TextInput
                  value={formData.firstName}
                  onChangeText={(v) => updateForm('firstName', v)}
                  placeholder="John"
                  placeholderTextColor="#9ca3af"
                  className={`px-4 py-3 rounded-xl border text-sm text-text-main dark:text-white bg-white dark:bg-[#1e291e] ${
                    errors.firstName ? 'border-red-500' : 'border-[#eaf0ea] dark:border-[#2a382a]'
                  }`}
                />
                {errors.firstName && (
                  <Text className="text-xs text-red-500 mt-1">{errors.firstName}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Last Name
                </Text>
                <TextInput
                  value={formData.lastName}
                  onChangeText={(v) => updateForm('lastName', v)}
                  placeholder="Doe"
                  placeholderTextColor="#9ca3af"
                  className={`px-4 py-3 rounded-xl border text-sm text-text-main dark:text-white bg-white dark:bg-[#1e291e] ${
                    errors.lastName ? 'border-red-500' : 'border-[#eaf0ea] dark:border-[#2a382a]'
                  }`}
                />
                {errors.lastName && (
                  <Text className="text-xs text-red-500 mt-1">{errors.lastName}</Text>
                )}
              </View>
            </View>

            {/* Email */}
            <View>
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Email Address
              </Text>
              <TextInput
                value={formData.email}
                onChangeText={(v) => updateForm('email', v)}
                placeholder="john.doe@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                className={`px-4 py-3 rounded-xl border text-sm text-text-main dark:text-white bg-white dark:bg-[#1e291e] ${
                  errors.email ? 'border-red-500' : 'border-[#eaf0ea] dark:border-[#2a382a]'
                }`}
              />
              {errors.email && (
                <Text className="text-xs text-red-500 mt-1">{errors.email}</Text>
              )}
            </View>

            {/* Phone */}
            <View>
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Phone Number
              </Text>
              <TextInput
                value={formData.phone}
                onChangeText={(v) => updateForm('phone', v)}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                className={`px-4 py-3 rounded-xl border text-sm text-text-main dark:text-white bg-white dark:bg-[#1e291e] ${
                  errors.phone ? 'border-red-500' : 'border-[#eaf0ea] dark:border-[#2a382a]'
                }`}
              />
              {errors.phone && (
                <Text className="text-xs text-red-500 mt-1">{errors.phone}</Text>
              )}
            </View>

            {/* Password */}
            <View>
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  value={formData.password}
                  onChangeText={(v) => updateForm('password', v)}
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  className={`px-4 py-3 pr-12 rounded-xl border text-sm text-text-main dark:text-white bg-white dark:bg-[#1e291e] ${
                    errors.password ? 'border-red-500' : 'border-[#eaf0ea] dark:border-[#2a382a]'
                  }`}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#9ca3af" />
                  ) : (
                    <Eye size={18} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-xs text-red-500 mt-1">{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View>
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Confirm Password
              </Text>
              <TextInput
                value={formData.confirmPassword}
                onChangeText={(v) => updateForm('confirmPassword', v)}
                placeholder="Re-enter password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                className={`px-4 py-3 rounded-xl border text-sm text-text-main dark:text-white bg-white dark:bg-[#1e291e] ${
                  errors.confirmPassword ? 'border-red-500' : 'border-[#eaf0ea] dark:border-[#2a382a]'
                }`}
              />
              {errors.confirmPassword && (
                <Text className="text-xs text-red-500 mt-1">{errors.confirmPassword}</Text>
              )}
            </View>
          </View>

          {/* Terms */}
          <View className="flex-row items-start mt-6 gap-2">
            <View className="size-5 mt-0.5 rounded border border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]" />
            <Text className="flex-1 text-xs text-gray-500 dark:text-gray-400">
              I agree to the{' '}
              <Text className="text-primary font-medium">Terms of Service</Text>
              {' '}and{' '}
              <Text className="text-primary font-medium">Privacy Policy</Text>
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="mt-6 py-4 rounded-xl bg-primary flex-row items-center justify-center gap-2"
          >
            <Text className="text-white font-semibold text-sm">Continue</Text>
            <ChevronRight size={18} color="white" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

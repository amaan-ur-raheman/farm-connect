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
  ShieldCheck,
  TrendingUp,
  Sprout,
  ChevronRight,
} from 'lucide-react-native';
import { useRegistrationStore, useAuthStore } from '../../src/stores';
import {
  validatePhone,
  validateEmail,
  validateName,
} from '../../src/utils/validation';

export default function RegisterStep1() {
  const {
    userRole,
    setUserRole,
    formData,
    updateFormData,
    errors,
    setError,
    clearError,
  } = useRegistrationStore();

  const { sendOtp, isLoading } = useAuthStore();
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string) => {
    let result;
    switch (field) {
      case 'firstName':
        result = validateName(value, 'First name');
        break;
      case 'lastName':
        result = validateName(value, 'Last name');
        break;
      case 'email':
        result = validateEmail(value);
        break;
      case 'phone':
        result = validatePhone(value);
        break;
      default:
        return true;
    }

    if (!result.isValid) {
      setError(field, result.error || '');
      return false;
    } else {
      clearError(field);
      return true;
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const validateForm = () => {
    clearError('role');
    clearError('firstName');
    clearError('lastName');
    clearError('email');
    clearError('phone');
    let valid = true;

    if (!userRole) {
      setError('role', 'Please select Investor or Farmer');
      valid = false;
    }

    const firstNameValid = validateField('firstName', formData.firstName);
    const lastNameValid = validateField('lastName', formData.lastName);
    const emailValid = validateField('email', formData.email);
    const phoneValid = validateField('phone', formData.phone);

    if (!firstNameValid || !lastNameValid || !emailValid || !phoneValid) {
      valid = false;
    }

    return valid;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before continuing.');
      return;
    }

    const success = await sendOtp(formData.phone);
    if (success) {
      router.push('/register/verification');
    } else {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
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
            <TouchableOpacity
              onPress={() => { setUserRole('investor'); clearError('role'); }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                userRole === 'investor'
                  ? 'border-primary bg-primary/5'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <View className={`size-10 rounded-full items-center justify-center mb-3 ${
                userRole === 'investor' ? 'bg-primary' : 'bg-[#4cae4f]/20'
              }`}>
                <TrendingUp size={20} color={userRole === 'investor' ? 'white' : '#4cae4f'} />
              </View>
              <Text className="text-sm font-semibold text-text-main dark:text-white mb-1">
                Investor
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Fund farms and earn returns
              </Text>
              {userRole === 'investor' && (
                <View className="absolute top-3 right-3">
                  <ShieldCheck size={18} color="#2be619" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setUserRole('farmer'); clearError('role'); }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                userRole === 'farmer'
                  ? 'border-primary bg-primary/5'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <View className={`size-10 rounded-full items-center justify-center mb-3 ${
                userRole === 'farmer' ? 'bg-primary' : 'bg-[#4cae4f]/20'
              }`}>
                <Sprout size={20} color={userRole === 'farmer' ? 'white' : '#4cae4f'} />
              </View>
              <Text className="text-sm font-semibold text-text-main dark:text-white mb-1">
                Farmer
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                List your farm and get funded
              </Text>
              {userRole === 'farmer' && (
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
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  First Name
                </Text>
                <TextInput
                  value={formData.firstName}
                  onChangeText={(v: string) => {
                    updateFormData('firstName', v);
                    if (touchedFields.firstName) validateField('firstName', v);
                  }}
                  onBlur={() => handleFieldBlur('firstName', formData.firstName)}
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
                  onChangeText={(v: string) => {
                    updateFormData('lastName', v);
                    if (touchedFields.lastName) validateField('lastName', v);
                  }}
                  onBlur={() => handleFieldBlur('lastName', formData.lastName)}
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

            <View>
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Email Address
              </Text>
              <TextInput
                value={formData.email}
                onChangeText={(v: string) => {
                  updateFormData('email', v);
                  if (touchedFields.email) validateField('email', v);
                }}
                onBlur={() => handleFieldBlur('email', formData.email)}
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

            <View>
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Phone Number
              </Text>
              <TextInput
                value={formData.phone}
                onChangeText={(v: string) => {
                  updateFormData('phone', v);
                  if (touchedFields.phone) validateField('phone', v);
                }}
                onBlur={() => handleFieldBlur('phone', formData.phone)}
                placeholder="+919876543210"
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
            onPress={handleContinue}
            className="mt-6 py-4 rounded-xl bg-primary flex-row items-center justify-center gap-2"
            disabled={isLoading}
          >
            <Text className="text-white font-semibold text-sm">
              {isLoading ? 'Sending OTP...' : 'Continue'}
            </Text>
            {!isLoading && <ChevronRight size={18} color="white" />}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

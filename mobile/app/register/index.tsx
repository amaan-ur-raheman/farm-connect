import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TextInput as RNTextInput,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  ShieldCheck,
  TrendingUp,
  Sprout,
  ChevronRight,
  Mail,
  Phone,
} from 'lucide-react-native';
import { useRegistrationStore, useAuthStore } from '../../src/stores';
import { Input } from '../../src/components/ui/Input';
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

  const { sendOtp, isLoading, error } = useAuthStore();
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const lastNameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const phoneRef = useRef<RNTextInput>(null);

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
    Keyboard.dismiss();
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before continuing.');
      return;
    }

    const result = await sendOtp(formData.phone);
    if (result.success) {
      // Show OTP if in dev mode
      if (result.devOtp) {
        Alert.alert(
          'OTP Sent',
          `Your OTP is: ${result.devOtp}\n\n(In production, this would be sent via SMS)`,
          [{ text: 'OK', onPress: () => router.push('/register/verification') }]
        );
      } else {
        router.push('/register/verification');
      }
    } else {
      Alert.alert('Error', error || 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={false}
        >
          {/* Progress Bar */}
          <View className="mb-8">
            <View className="h-1.5 bg-[#eaf0ea] dark:bg-[#2a382a] rounded-full overflow-hidden">
              <View className="h-full w-[33%] bg-primary rounded-full" />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Step 1 of 3 • Account Setup
            </Text>
          </View>

            {/* Title */}
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Create Account
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Join FarmConnect to start your agricultural journey
            </Text>

            {/* Role Selection */}
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
              Select your role
            </Text>
            <View className="flex-row gap-3 mb-8">
              <TouchableOpacity
                onPress={() => { setUserRole('investor'); clearError('role'); }}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                  userRole === 'investor'
                    ? 'border-primary bg-primary/5'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <View className={`size-10 rounded-xl items-center justify-center mb-3 ${
                  userRole === 'investor' ? 'bg-primary' : 'bg-[#4cae4f]/10'
                }`}>
                  <TrendingUp size={20} color={userRole === 'investor' ? 'white' : '#4cae4f'} />
                </View>
                <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Investor
                </Text>
                <Text className="text-[10px] leading-3 text-gray-500 dark:text-gray-400 font-medium">
                  Fund farms & earn returns
                </Text>
                {userRole === 'investor' && (
                  <View className="absolute top-3 right-3">
                    <ShieldCheck size={18} color="#4cae4f" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setUserRole('farmer'); clearError('role'); }}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                  userRole === 'farmer'
                    ? 'border-primary bg-primary/5'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <View className={`size-10 rounded-xl items-center justify-center mb-3 ${
                  userRole === 'farmer' ? 'bg-primary' : 'bg-[#4cae4f]/10'
                }`}>
                  <Sprout size={20} color={userRole === 'farmer' ? 'white' : '#4cae4f'} />
                </View>
                <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Farmer
                </Text>
                <Text className="text-[10px] leading-3 text-gray-500 dark:text-gray-400 font-medium">
                  List farm & get funding
                </Text>
                {userRole === 'farmer' && (
                  <View className="absolute top-3 right-3">
                    <ShieldCheck size={18} color="#4cae4f" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {errors.role && (
              <Text className="text-xs text-red-500 mb-4 -mt-4 ml-1">{errors.role}</Text>
            )}

            {/* Form Fields */}
            <View className="gap-1">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChangeText={(v: string) => {
                      updateFormData('firstName', v);
                      if (touchedFields.firstName) validateField('firstName', v);
                    }}
                    onBlur={() => handleFieldBlur('firstName', formData.firstName)}
                    placeholder="John"
                    error={errors.firstName}
                    autoComplete="name-given"
                    textContentType="givenName"
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    ref={lastNameRef}
                    label="Last Name"
                    value={formData.lastName}
                    onChangeText={(v: string) => {
                      updateFormData('lastName', v);
                      if (touchedFields.lastName) validateField('lastName', v);
                    }}
                    onBlur={() => handleFieldBlur('lastName', formData.lastName)}
                    placeholder="Doe"
                    error={errors.lastName}
                    autoComplete="name-family"
                    textContentType="familyName"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
              </View>

              <Input
                ref={emailRef}
                label="Email Address"
                value={formData.email}
                onChangeText={(v: string) => {
                  updateFormData('email', v);
                  if (touchedFields.email) validateField('email', v);
                }}
                onBlur={() => handleFieldBlur('email', formData.email)}
                placeholder="john.doe@email.com"
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                icon={<Mail size={18} color="#9ca3af" />}
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />

              <Input
                ref={phoneRef}
                label="Phone Number"
                value={formData.phone}
                onChangeText={(v: string) => {
                  updateFormData('phone', v);
                  if (touchedFields.phone) validateField('phone', v);
                }}
                onBlur={() => handleFieldBlur('phone', formData.phone)}
                placeholder="+91 98765 43210"
                error={errors.phone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                icon={<Phone size={18} color="#9ca3af" />}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>

            {/* Terms */}
            <TouchableOpacity
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              className="flex-row items-start mt-4 gap-3 p-1"
            >
              <View className={`size-5 mt-0.5 rounded-lg border-2 transition-all flex items-center justify-center ${
                agreedToTerms 
                  ? 'bg-primary border-primary' 
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}>
                {agreedToTerms && <View className="size-2 bg-white rounded-full" />}
              </View>
              <Text className="flex-1 text-xs text-gray-500 dark:text-gray-400 font-medium leading-4">
                I agree to the{' '}
                <Text className="text-primary font-bold">Terms of Service</Text>
                {' '}and{' '}
                <Text className="text-primary font-bold">Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={isLoading || !agreedToTerms}
              className={`mt-8 py-4 rounded-2xl flex-row items-center justify-center gap-2 transition-all ${
                isLoading || !agreedToTerms
                  ? 'bg-gray-300 dark:bg-gray-700 shadow-none'
                  : 'bg-primary shadow-xl shadow-primary/25 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <View className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  <Text className="text-white font-bold text-base">
                    Sending OTP...
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-white font-bold text-base">
                    Continue
                  </Text>
                  <ChevronRight size={20} color="white" strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>

            <View className="mt-8 flex-row items-center justify-center gap-1">
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="text-sm font-bold text-[#4cae4f]"> Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
  );
}

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Sprout, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { useAuthStore } from '../src/stores';
import { validatePhone, validateOtp } from '../src/utils/validation';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedOtp, setTouchedOtp] = useState(false);

  const {
    userRole,
    setUserRole,
    loginWithOtp,
    sendOtp,
    isLoading,
    error,
    clearError,
    setPhone: setStorePhone,
  } = useAuthStore();

  const handlePhoneBlur = () => {
    setTouchedPhone(true);
    const result = validatePhone(phone);
    if (!result.isValid) {
      clearError();
    }
  };

  const handleOtpBlur = () => {
    setTouchedOtp(true);
    const result = validateOtp(otp);
    if (!result.isValid) {
      clearError();
    }
  };

  const isPhoneValid = validatePhone(phone).isValid;
  const isOtpValid = validateOtp(otp).isValid;

  const handleSendOtp = async () => {
    if (!userRole) {
      Alert.alert('Select Role', 'Please select Investor or Farmer to continue.');
      return;
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      Alert.alert('Invalid Phone', phoneValidation.error);
      return;
    }

    const success = await sendOtp(phone);
    if (success) {
      setOtpSent(true);
      setDevOtpHint(null);
      Alert.alert(
        'OTP Sent',
        `A 6-digit OTP was sent to ${phone}. Check server console in development mode.`
      );
    } else {
      Alert.alert('Error', error || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    const otpValidation = validateOtp(otp);
    if (!otpValidation.isValid) {
      Alert.alert('Invalid OTP', otpValidation.error);
      return;
    }

    const success = await loginWithOtp(phone, otp);
    if (success) {
      if (userRole === 'farmer') {
        router.replace('/dashboard');
      } else {
        router.replace('/marketplace');
      }
    } else {
      Alert.alert('Error', error || 'Invalid OTP. Please try again.');
    }
  };

  const handleRoleSelect = (role: 'farmer' | 'investor') => {
    setUserRole(role);
    clearError();
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800' }}
      className="flex-1"
    >
      <View className="flex-1 bg-[#f6f8f6]/80 dark:bg-[#152111]/80 items-center justify-center p-4">
        <StatusBar barStyle="dark-content" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full max-w-[480px] bg-white dark:bg-[#1a2c15] rounded-xl p-8 shadow-2xl overflow-hidden"
        >
          <ScrollView showsVerticalScrollIndicator={false} className="w-full">
            <View className="items-center w-full">
              <View className="size-12 bg-primary/20 rounded-full items-center justify-center mb-4">
                <Sprout size={30} color="#3db814" strokeWidth={1.5} />
              </View>

              <Text className="text-3xl font-bold text-[#111b0e] dark:text-white tracking-tight text-center">
                Welcome Back
              </Text>
              <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400 mb-8 text-center">
                Log in to manage your farm or portfolio.
              </Text>

              {/* Role Selector */}
              <View className="flex-row bg-[#eaf3e7] dark:bg-[#2a3e24] p-1 rounded-lg mb-8 w-full">
                <TouchableOpacity
                  onPress={() => handleRoleSelect('investor')}
                  className={`flex-1 py-2.5 rounded-md items-center justify-center ${userRole === 'investor' ? 'bg-white dark:bg-primary shadow-sm' : ''}`}
                >
                  <Text className={`text-sm font-medium ${userRole === 'investor' ? 'text-[#111b0e] dark:text-black' : 'text-slate-600 dark:text-slate-300'}`}>
                    Investor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRoleSelect('farmer')}
                  className={`flex-1 py-2.5 rounded-md items-center justify-center ${userRole === 'farmer' ? 'bg-white dark:bg-primary shadow-sm' : ''}`}
                >
                  <Text className={`text-sm font-medium ${userRole === 'farmer' ? 'text-[#111b0e] dark:text-black' : 'text-slate-600 dark:text-slate-300'}`}>
                    Farmer
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="w-full gap-5">
                {/* Phone Input */}
                <View className="gap-2">
                  <Text className="text-sm font-medium text-[#111b0e] dark:text-slate-200">
                    Phone Number
                  </Text>
                  <View className={`h-12 bg-[#f9fcf8] dark:bg-[#152111] rounded-lg px-4 flex-row items-center border ${
                    touchedPhone && !isPhoneValid ? 'border-red-500' : 'border-[#d6e7d0] dark:border-[#3a5033]'
                  }`}>
                    <Phone size={20} color="#60974e" style={{ marginRight: 8 }} />
                    <TextInput
                      placeholder="+919876543210"
                      placeholderTextColor="rgba(96, 151, 78, 0.6)"
                      value={phone}
                      onChangeText={(text: string) => {
                        setPhone(text);
                        clearError();
                      }}
                      onBlur={handlePhoneBlur}
                      className="flex-1 text-base text-[#111b0e] dark:text-white"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      maxLength={13}
                    />
                  </View>
                  {touchedPhone && !isPhoneValid && (
                    <Text className="text-xs text-red-500">{validatePhone(phone).error}</Text>
                  )}
                </View>

                {/* OTP Input - shown after OTP sent */}
                {otpSent && (
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-[#111b0e] dark:text-slate-200">
                      Enter OTP
                    </Text>
                    <View className={`h-12 bg-[#f9fcf8] dark:bg-[#152111] rounded-lg px-4 flex-row items-center border ${
                      touchedOtp && !isOtpValid ? 'border-red-500' : 'border-[#d6e7d0] dark:border-[#3a5033]'
                    }`}>
                      <TextInput
                        placeholder="6-digit OTP"
                        placeholderTextColor="rgba(96, 151, 78, 0.6)"
                        value={otp}
                        onChangeText={(text: string) => {
                          setOtp(text.replace(/\D/g, '').slice(0, 6));
                          clearError();
                        }}
                        onBlur={handleOtpBlur}
                        className="flex-1 text-base text-[#111b0e] dark:text-white"
                        keyboardType="number-pad"
                        maxLength={6}
                        secureTextEntry={false}
                      />
                    </View>
                    {touchedOtp && !isOtpValid && (
                      <Text className="text-xs text-red-500">{validateOtp(otp).error}</Text>
                    )}

                    {/* Dev OTP hint */}
                    {devOtpHint && (
                      <View className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg px-3 py-2">
                        <Text className="text-xs text-yellow-700 dark:text-yellow-400 font-mono">
                          Dev OTP: {devOtpHint}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(''); }}>
                      <Text className="text-sm font-medium text-[#60974e] dark:text-primary">
                        Didn't receive OTP? Resend
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Error display */}
                {error && (
                  <View className="bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">
                    <Text className="text-xs text-red-600 dark:text-red-400">{error}</Text>
                  </View>
                )}

                {/* Primary action button */}
                {!otpSent ? (
                  <Button
                    title="Send OTP"
                    onPress={handleSendOtp}
                    className="w-full py-3.5 rounded-lg bg-primary mt-3 shadow-md active:scale-95"
                    textClassName="text-white font-bold text-base"
                    loading={isLoading}
                    disabled={!userRole || !isPhoneValid}
                  />
                ) : (
                  <Button
                    title="Verify & Login"
                    onPress={handleVerifyOtp}
                    className="w-full py-3.5 rounded-lg bg-primary mt-3 shadow-md active:scale-95"
                    textClassName="text-white font-bold text-base"
                    loading={isLoading}
                    disabled={!isOtpValid}
                  />
                )}
              </View>

              <View className="mt-8 flex-row items-center justify-center gap-1">
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text className="text-sm font-bold text-[#4cae4f]"> Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

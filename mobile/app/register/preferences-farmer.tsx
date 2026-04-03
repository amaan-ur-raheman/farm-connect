import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput as RNTextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { validateIfsc, validateBankAccount, validateName, validateLocation } from '../../src/utils/validation';
import {
  ChevronRight,
  ChevronLeft,
  Sprout,
  MapPin,
  Wallet,
  Building2,
  CheckCircle,
  FileText,
} from 'lucide-react-native';
import { useRegistrationStore } from '../../src/stores';
import { Input } from '../../src/components/ui/Input';
import api from '../../src/config/api';

const FARM_SIZE_RANGES = [
  { label: '< 1 acre', value: '<1' },
  { label: '1 - 10 acres', value: '1-10' },
  { label: '10 - 50 acres', value: '10-50' },
  { label: '50 - 100 acres', value: '50-100' },
  { label: '100+ acres', value: '100+' },
];

const FARMING_TYPES = [
  'Crop Farming',
  'Livestock',
  'Mixed Farming',
  'Organic Farming',
  'Dairy',
  'Poultry',
  'Horticulture',
  'Agri-Tech',
];

const FARMING_EXPERIENCE = [
  { label: 'Beginner', years: '0-2 years' },
  { label: 'Intermediate', years: '2-5 years' },
  { label: 'Experienced', years: '5-10 years' },
  { label: 'Expert', years: '10+ years' },
];

const EXPERIENCE_MAP: Record<string, number> = {
  'Beginner': 1,
  'Intermediate': 3,
  'Experienced': 7,
  'Expert': 12,
};

const FARM_SIZE_MAP: Record<string, number> = {
  '<1': 0.5,
  '1-10': 5,
  '10-50': 25,
  '50-100': 75,
  '100+': 150,
};

export default function FarmerPreferences() {
  const { farmerDetails, setFarmerDetails, bankDetails, setBankDetails, formData, reset } = useRegistrationStore();
  
  const [localFarmDetails, setLocalFarmDetails] = useState({
    farmName: farmerDetails?.farmName || '',
    farmSize: farmerDetails?.farmSize || '',
    farmingType: farmerDetails?.farmType || '',
    experience: farmerDetails?.yearsOfExperience?.toString() || '',
    location: farmerDetails?.farmLocation || '',
  });
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for Step 1
  const farmLocationRef = useRef<RNTextInput>(null);
  
  // Refs for Step 2
  const accountNumberRef = useRef<RNTextInput>(null);
  const ifscRef = useRef<RNTextInput>(null);

  const updateFarm = (field: string, value: string) => {
    setLocalFarmDetails(prev => ({ ...prev, [field]: value }));
  };

  const updateBank = (field: string, value: string) => {
    setBankDetails({ [field]: value });
  };

  const toggleFarmingType = (type: string) => {
    setLocalFarmDetails(prev => ({
      ...prev,
      farmingType: prev.farmingType === type ? '' : type,
    }));
  };

  const validateFarmDetails = () => {
    const nameCheck = validateName(localFarmDetails.farmName, 'Farm name');
    if (!nameCheck.isValid) {
      Alert.alert('Invalid Farm Name', nameCheck.error);
      return false;
    }
    const locationCheck = validateLocation(localFarmDetails.location);
    if (!locationCheck.isValid) {
      Alert.alert('Invalid Location', locationCheck.error);
      return false;
    }
    if (!localFarmDetails.farmSize) {
      Alert.alert('Missing Farm Size', 'Please select your farm size.');
      return false;
    }
    if (!localFarmDetails.farmingType) {
      Alert.alert('Missing Farming Type', 'Please select your farming type.');
      return false;
    }
    return true;
  };

  const validateBank = () => {
    const ifscCheck = validateIfsc(bankDetails.ifscCode);
    if (!ifscCheck.isValid) {
      Alert.alert('Invalid IFSC', ifscCheck.error);
      return false;
    }
    const accountCheck = validateBankAccount(bankDetails.accountNumber);
    if (!accountCheck.isValid) {
      Alert.alert('Invalid Account', accountCheck.error);
      return false;
    }
    if (!bankDetails.bankName || !bankDetails.bankName.trim()) {
      Alert.alert('Invalid Bank Name', 'Bank name is required.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    Keyboard.dismiss();
    if (step === 1) {
      if (!validateFarmDetails()) return;
      setFarmerDetails({
        farmName: localFarmDetails.farmName,
        farmSize: localFarmDetails.farmSize,
        farmLocation: localFarmDetails.location,
        farmType: localFarmDetails.farmingType,
        cropsGrown: [],
        irrigationType: '',
        yearsOfExperience: EXPERIENCE_MAP[localFarmDetails.experience] || 0,
      });
      setStep(2);
    }
  };

  const handleComplete = async () => {
    Keyboard.dismiss();
    if (!validateBank()) return;
    setIsSubmitting(true);
    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await api.patch('/api/users/me', {
        name,
        email: formData.email,
        address: localFarmDetails.location,
        bank_name: bankDetails.bankName,
        bank_account_number: bankDetails.accountNumber,
        bank_ifsc: bankDetails.ifscCode,
        farm_name: localFarmDetails.farmName,
        farm_size_acres: FARM_SIZE_MAP[localFarmDetails.farmSize] || 0,
        farm_type: localFarmDetails.farmingType,
        years_of_experience: EXPERIENCE_MAP[localFarmDetails.experience] || 0,
      });
      reset();
      router.replace('/dashboard');
    } catch (err: any) {
      Alert.alert(
        'Registration Failed',
        err.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <>
      {/* Progress */}
      <View className="mb-8">
        <View className="h-1.5 bg-[#eaf0ea] dark:bg-[#2a382a] rounded-full overflow-hidden">
          <View className="h-full w-full bg-primary rounded-full" />
        </View>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Step 3 of 3 • Farm Details
        </Text>
      </View>

      {/* Title */}
      <View className="flex-row items-center gap-3 mb-6">
        <View className="size-12 rounded-2xl bg-primary/10 items-center justify-center">
          <Sprout size={24} color="#4cae4f" strokeWidth={2.5} />
        </View>
        <View>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            Farm Details
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Tell us about your agricultural setup
          </Text>
        </View>
      </View>

      {/* Farm Form */}
      <View className="gap-1">
        <Input
          label="Farm Name"
          value={localFarmDetails.farmName}
          onChangeText={(v) => updateFarm('farmName', v)}
          placeholder="e.g. Sahyadri Organic Farm"
          icon={<FileText size={18} color="#9ca3af" />}
          returnKeyType="next"
          onSubmitEditing={() => farmLocationRef.current?.focus()}
        />

        <Input
          ref={farmLocationRef}
          label="Farm Location"
          value={localFarmDetails.location}
          onChangeText={(v) => updateFarm('location', v)}
          placeholder="District, State"
          icon={<MapPin size={18} color="#9ca3af" />}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        {/* Farm Size */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
            Total Land Area
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FARM_SIZE_RANGES.map((range) => (
              <TouchableOpacity
                key={range.value}
                onPress={() => updateFarm('farmSize', range.value)}
                className={`px-4 py-2.5 rounded-full border-2 transition-all ${
                  localFarmDetails.farmSize === range.value
                    ? 'border-primary bg-primary'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <Text className={`text-xs font-bold ${
                  localFarmDetails.farmSize === range.value
                    ? 'text-white'
                    : 'text-slate-600 dark:text-gray-400'
                }`}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Farming Type */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
            Primary Farming Focus
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FARMING_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => toggleFarmingType(type)}
                className={`px-4 py-2.5 rounded-full border-2 transition-all ${
                  localFarmDetails.farmingType === type
                    ? 'border-primary bg-primary'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <Text className={`text-xs font-bold ${
                  localFarmDetails.farmingType === type
                    ? 'text-white'
                    : 'text-slate-600 dark:text-gray-400'
                }`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
            Industry Experience
          </Text>
          <View className="flex-row gap-2">
            {FARMING_EXPERIENCE.map((exp) => (
              <TouchableOpacity
                key={exp.label}
                onPress={() => updateFarm('experience', exp.label)}
                className={`flex-1 p-3 rounded-2xl border-2 text-center transition-all ${
                  localFarmDetails.experience === exp.label
                    ? 'border-primary bg-primary/5'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <Text className={`text-xs font-bold ${
                  localFarmDetails.experience === exp.label
                    ? 'text-primary'
                    : 'text-slate-600 dark:text-gray-400'
                }`}>
                  {exp.label}
                </Text>
                <Text className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5 font-medium">
                  {exp.years}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleNext}
        className="py-4.5 rounded-2xl bg-primary flex-row items-center justify-center gap-2 mt-6 shadow-lg shadow-primary/20"
      >
        <Text className="text-white font-bold text-base uppercase tracking-widest">Next Step</Text>
        <ChevronRight size={20} color="white" strokeWidth={2.5} />
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Progress */}
      <View className="mb-8">
        <View className="h-1.5 bg-[#eaf0ea] dark:bg-[#2a382a] rounded-full overflow-hidden">
          <View className="h-full w-full bg-primary rounded-full" />
        </View>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Step 3 of 3 • Payout Methods
        </Text>
      </View>

      {/* Title */}
      <View className="flex-row items-center gap-3 mb-6">
        <View className="size-12 rounded-2xl bg-primary/10 items-center justify-center">
          <Wallet size={24} color="#4cae4f" strokeWidth={2.5} />
        </View>
        <View>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            Bank Setup
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Where you'll receive your farm funding
          </Text>
        </View>
      </View>

      {/* Bank Form */}
      <View className="gap-1">
        <Input
          label="Bank Name"
          value={bankDetails.bankName}
          onChangeText={(v) => updateBank('bankName', v)}
          placeholder="e.g. State Bank of India"
          icon={<Building2 size={18} color="#9ca3af" />}
          returnKeyType="next"
          onSubmitEditing={() => accountNumberRef.current?.focus()}
        />

        <Input
          ref={accountNumberRef}
          label="Account Number"
          value={bankDetails.accountNumber}
          onChangeText={(v) => updateBank('accountNumber', v)}
          placeholder="0000 0000 0000 0000"
          keyboardType="numeric"
          icon={<Wallet size={18} color="#9ca3af" />}
          returnKeyType="next"
          onSubmitEditing={() => ifscRef.current?.focus()}
        />

        <Input
          ref={ifscRef}
          label="IFSC Code"
          value={bankDetails.ifscCode}
          onChangeText={(v) => updateBank('ifscCode', v)}
          placeholder="SBIN0001234"
          autoCapitalize="characters"
          icon={<CheckCircle size={18} color="#9ca3af" />}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
            Account Type
          </Text>
          <View className="flex-row gap-3">
            {(['checking', 'savings'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setAccountType(type)}
                className={`flex-1 py-4 rounded-2xl border-2 text-center capitalize transition-all ${
                  accountType === type
                    ? 'border-primary bg-primary/5'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <Text className={`text-sm font-bold uppercase tracking-widest ${
                  accountType === type
                    ? 'text-primary'
                    : 'text-slate-600 dark:text-gray-400'
                }`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View className="flex-row gap-3 mt-6 mb-10">
        <TouchableOpacity
          onPress={() => setStep(1)}
          className="flex-1 h-14 rounded-2xl bg-gray-100 dark:bg-[#2a382a] flex-row items-center justify-center gap-2"
        >
          <ChevronLeft size={18} color="#4cae4f" strokeWidth={2.5} />
          <Text className="text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest text-xs">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleComplete}
          disabled={isSubmitting}
          className={`flex-[2] h-14 rounded-2xl bg-primary flex-row items-center justify-center gap-2 shadow-lg shadow-primary/20 ${isSubmitting ? 'opacity-60' : ''}`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text className="text-white font-bold uppercase tracking-widest text-xs">Finalize</Text>
              <CheckCircle size={18} color="white" strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

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
          {step === 1 ? renderStep1() : renderStep2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

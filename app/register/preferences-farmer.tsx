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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ChevronRight,
  ChevronLeft,
  Sprout,
  MapPin,
  Calendar,
  Wallet,
  Building2,
  CheckCircle,
} from 'lucide-react-native';

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

const SOIL_TYPES = [
  'Sandy',
  'Clay',
  'Loamy',
  'Silty',
  'Peaty',
  'Chalky',
];

export default function FarmerPreferences() {
  const params = useLocalSearchParams();
  
  const [farmDetails, setFarmDetails] = useState({
    farmName: '',
    farmSize: '',
    farmingType: '',
    experience: '',
    soilType: '',
    location: '',
    description: '',
  });
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
  });
  const [step, setStep] = useState(1);

  const updateFarm = (field: string, value: string) => {
    setFarmDetails(prev => ({ ...prev, [field]: value }));
  };

  const updateBank = (field: string, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const toggleFarmingType = (type: string) => {
    setFarmDetails(prev => ({
      ...prev,
      farmingType: prev.farmingType === type ? '' : type,
    }));
  };

  const toggleSoilType = (type: string, currentTypes: string[]) => {
    if (currentTypes.includes(type)) {
      setFarmDetails(prev => ({
        ...prev,
        soilType: prev.soilType.split(',').filter(s => s !== type).join(','),
      }));
    } else {
      setFarmDetails(prev => ({
        ...prev,
        soilType: prev.soilType ? `${prev.soilType},${type}` : type,
      }));
    }
  };

  const validateFarmDetails = () => {
    return true;
  };

  const validateBank = () => {
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateFarmDetails()) {
      setStep(2);
    } else if (step === 2 && validateBank()) {
      router.replace('/marketplace');
    }
  };

  const renderStep1 = () => (
    <>
      {/* Progress */}
      <View className="mb-8">
        <View className="h-1.5 bg-[#eaf0ea] dark:bg-[#2a382a] rounded-full overflow-hidden">
          <View className="h-full w-full bg-primary rounded-full" />
        </View>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Step 3 of 3 • Farm Details
        </Text>
      </View>

      {/* Title */}
      <View className="flex-row items-center gap-3 mb-6">
        <View className="size-12 rounded-full bg-primary/10 items-center justify-center">
          <Sprout size={24} color="#2be619" />
        </View>
        <View>
          <Text className="text-xl font-bold text-text-main dark:text-white">
            Farm Details
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Tell us about your farm
          </Text>
        </View>
      </View>

      {/* Farm Form */}
      <View className="gap-4">
        <View>
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Farm Name
          </Text>
          <TextInput
            value={farmDetails.farmName}
            onChangeText={(v) => updateFarm('farmName', v)}
            placeholder="Enter your farm name"
            placeholderTextColor="#9ca3af"
            className="px-4 py-3.5 rounded-xl border border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e] text-sm text-text-main dark:text-white"
          />
        </View>

        {/* Farm Size */}
        <View>
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Farm Size
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FARM_SIZE_RANGES.map((range) => (
              <TouchableOpacity
                key={range.value}
                onPress={() => updateFarm('farmSize', range.value)}
                className={`px-3 py-2 rounded-full border-2 transition-all ${
                  farmDetails.farmSize === range.value
                    ? 'border-primary bg-primary'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <Text className={`text-xs font-medium ${
                  farmDetails.farmSize === range.value
                    ? 'text-white'
                    : 'text-text-main dark:text-white'
                }`}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Farming Type */}
        <View>
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Primary Farming Type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FARMING_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => toggleFarmingType(type)}
                className={`px-3 py-2 rounded-full border-2 transition-all ${
                  farmDetails.farmingType === type
                    ? 'border-primary bg-primary'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <Text className={`text-xs font-medium ${
                  farmDetails.farmingType === type
                    ? 'text-white'
                    : 'text-text-main dark:text-white'
                }`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience */}
        <View>
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Farming Experience
          </Text>
          <View className="flex-row gap-2">
            {FARMING_EXPERIENCE.map((exp) => (
              <TouchableOpacity
                key={exp.label}
                onPress={() => updateFarm('experience', exp.label)}
                className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                  farmDetails.experience === exp.label
                    ? 'border-primary bg-primary/5'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <Text className={`text-xs font-medium ${
                  farmDetails.experience === exp.label
                    ? 'text-primary'
                    : 'text-text-main dark:text-white'
                }`}>
                  {exp.label}
                </Text>
                <Text className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {exp.years}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View>
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Farm Location
          </Text>
          <View className="flex-row items-center bg-white dark:bg-[#1e291e] border border-[#eaf0ea] dark:border-[#2a382a] rounded-xl px-4">
            <MapPin size={18} color="#9ca3af" />
            <TextInput
              value={farmDetails.location}
              onChangeText={(v) => updateFarm('location', v)}
              placeholder="Enter farm location"
              placeholderTextColor="#9ca3af"
              className="flex-1 py-3.5 ml-3 text-sm text-text-main dark:text-white"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleNext}
        className="py-4 rounded-xl bg-primary flex-row items-center justify-center gap-2 mt-6"
      >
        <Text className="text-white font-semibold text-sm">Next: Bank Details</Text>
        <ChevronRight size={18} color="white" />
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
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Step 3 of 3 • Bank Details
        </Text>
      </View>

      {/* Title */}
      <View className="flex-row items-center gap-3 mb-6">
        <View className="size-12 rounded-full bg-primary/10 items-center justify-center">
          <Wallet size={24} color="#2be619" />
        </View>
        <View>
          <Text className="text-xl font-bold text-text-main dark:text-white">
            Bank Details
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            For receiving payments from investors
          </Text>
        </View>
      </View>

      {/* Bank Form */}
      <View className="gap-4">
        <View>
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Bank Name
          </Text>
          <View className="flex-row items-center bg-white dark:bg-[#1e291e] border border-[#eaf0ea] dark:border-[#2a382a] rounded-xl px-4">
            <Building2 size={18} color="#9ca3af" />
            <TextInput
              value={bankDetails.bankName}
              onChangeText={(v) => updateBank('bankName', v)}
              placeholder="Enter bank name"
              placeholderTextColor="#9ca3af"
              className="flex-1 py-3.5 ml-3 text-sm text-text-main dark:text-white"
            />
          </View>
        </View>

        <View>
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Account Number
          </Text>
          <TextInput
            value={bankDetails.accountNumber}
            onChangeText={(v) => updateBank('accountNumber', v)}
            placeholder="Enter account number"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            className="px-4 py-3.5 rounded-xl border border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e] text-sm text-text-main dark:text-white"
          />
        </View>

        <View>
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Routing Number
          </Text>
          <TextInput
            value={bankDetails.routingNumber}
            onChangeText={(v) => updateBank('routingNumber', v)}
            placeholder="Enter routing number"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            className="px-4 py-3.5 rounded-xl border border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e] text-sm text-text-main dark:text-white"
          />
        </View>

        <View>
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Account Type
          </Text>
          <View className="flex-row gap-3">
            {['checking', 'savings'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => updateBank('accountType', type)}
                className={`flex-1 py-3 rounded-xl border-2 text-center capitalize transition-all ${
                  bankDetails.accountType === type
                    ? 'border-primary bg-primary/5'
                    : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  bankDetails.accountType === type
                    ? 'text-primary'
                    : 'text-text-main dark:text-white'
                }`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View className="flex-row gap-3 mt-6">
        <TouchableOpacity
          onPress={() => setStep(1)}
          className="flex-1 py-4 rounded-xl bg-[#eaf0ea] dark:bg-[#2a382a] flex-row items-center justify-center gap-2"
        >
          <ChevronLeft size={18} color="#4cae4f" />
          <Text className="text-primary font-semibold text-sm">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          className="flex-[2] py-4 rounded-xl bg-primary flex-row items-center justify-center gap-2"
        >
          <Text className="text-white font-semibold text-sm">Complete Registration</Text>
          <CheckCircle size={18} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );

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
          {step === 1 ? renderStep1() : renderStep2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

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
  TrendingUp,
  Wallet,
  Building2,
  CheckCircle,
} from 'lucide-react-native';

const INVESTMENT_RANGES = [
  { label: '$500 - $2,500', value: '500-2500' },
  { label: '$2,500 - $10,000', value: '2500-10000' },
  { label: '$10,000 - $50,000', value: '10000-50000' },
  { label: '$50,000+', value: '50000+' },
];

const INVESTMENT_GOALS = [
  'Passive Income',
  'Portfolio Diversification',
  'Retirement Planning',
  'Short-term Returns',
  'Long-term Growth',
];

const FARM_TYPES = [
  'Crop Farming',
  'Livestock',
  'Mixed Farming',
  'Organic Farming',
  'Agri-Tech',
];

export default function InvestorPreferences() {
  const params = useLocalSearchParams();
  
  const [investmentRange, setInvestmentRange] = useState('');
  const [investmentGoals, setInvestmentGoals] = useState<string[]>([]);
  const [preferredFarmTypes, setPreferredFarmTypes] = useState<string[]>([]);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
  });
  const [step, setStep] = useState(1);

  const toggleSelection = (
    item: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(s => s !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const updateBank = (field: string, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const validatePreferences = () => {
    return true;
  };

  const validateBank = () => {
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validatePreferences()) {
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
          Step 3 of 3 • Investment Preferences
        </Text>
      </View>

      {/* Title */}
      <View className="flex-row items-center gap-3 mb-6">
        <View className="size-12 rounded-full bg-primary/10 items-center justify-center">
          <TrendingUp size={24} color="#2be619" />
        </View>
        <View>
          <Text className="text-xl font-bold text-text-main dark:text-white">
            Investment Preferences
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Help us personalize your experience
          </Text>
        </View>
      </View>

      {/* Investment Range */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-text-main dark:text-white mb-3">
          Preferred Investment Range
        </Text>
        <View className="grid grid-cols-2 gap-2">
          {INVESTMENT_RANGES.map((range) => (
            <TouchableOpacity
              key={range.value}
              onPress={() => setInvestmentRange(range.value)}
              className={`p-3 rounded-xl border-2 transition-all ${
                investmentRange === range.value
                  ? 'border-primary bg-primary/5'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <Text className={`text-sm font-medium text-center ${
                investmentRange === range.value
                  ? 'text-primary'
                  : 'text-text-main dark:text-white'
              }`}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Investment Goals */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-text-main dark:text-white mb-3">
          Investment Goals
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {INVESTMENT_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal}
              onPress={() => toggleSelection(goal, investmentGoals, setInvestmentGoals)}
              className={`px-4 py-2 rounded-full border-2 transition-all ${
                investmentGoals.includes(goal)
                  ? 'border-primary bg-primary'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <Text className={`text-xs font-medium ${
                investmentGoals.includes(goal)
                  ? 'text-white'
                  : 'text-text-main dark:text-white'
              }`}>
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Farm Types */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-text-main dark:text-white mb-3">
          Preferred Farm Types
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {FARM_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => toggleSelection(type, preferredFarmTypes, setPreferredFarmTypes)}
              className={`px-4 py-2 rounded-full border-2 transition-all ${
                preferredFarmTypes.includes(type)
                  ? 'border-primary bg-primary'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <Text className={`text-xs font-medium ${
                preferredFarmTypes.includes(type)
                  ? 'text-white'
                  : 'text-text-main dark:text-white'
              }`}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleNext}
        className="py-4 rounded-xl bg-primary flex-row items-center justify-center gap-2"
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
            For receiving investment returns
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

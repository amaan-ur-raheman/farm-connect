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
import { validateIfsc, validateBankAccount, validateName } from '../../src/utils/validation';
import {
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Wallet,
  Building2,
  CheckCircle,
  User,
} from 'lucide-react-native';
import { useRegistrationStore, useAuthStore } from '../../src/stores';
import { Input } from '../../src/components/ui/Input';
import api from '../../src/config/api';

const INVESTMENT_RANGES = [
  { label: '₹10,000 - ₹50,000', value: '10000-50000' },
  { label: '₹50,000 - ₹2,00,000', value: '50000-200000' },
  { label: '₹2,00,000 - ₹10,00,000', value: '200000-1000000' },
  { label: '₹10,00,000+', value: '1000000+' },
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
  const { investorDetails, setInvestorDetails, bankDetails, setBankDetails, formData, reset } = useRegistrationStore();
  
  const [investmentRange, setInvestmentRange] = useState(investorDetails?.investmentRange || '');
  const [investmentGoals, setInvestmentGoals] = useState<string[]>(investorDetails?.investmentGoals || []);
  const [preferredFarmTypes, setPreferredFarmTypes] = useState<string[]>(investorDetails?.preferredFarmTypes || []);
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for Step 2
  const bankNameRef = useRef<RNTextInput>(null);
  const accountNumberRef = useRef<RNTextInput>(null);
  const ifscRef = useRef<RNTextInput>(null);

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
    setBankDetails({ [field]: value });
  };

  const validatePreferences = () => {
    if (!investmentRange) {
      Alert.alert('Missing Investment Range', 'Please select your investment range.');
      return false;
    }
    if (investmentGoals.length === 0) {
      Alert.alert('Missing Investment Goals', 'Please select at least one investment goal.');
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
    if (!bankDetails.accountHolderName || !bankDetails.accountHolderName.trim()) {
      Alert.alert('Invalid Account Holder', 'Account holder name is required.');
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
    if (step === 1 && validatePreferences()) {
      setInvestorDetails({
        investmentRange,
        investmentGoals,
        preferredFarmTypes,
        expectedROI: 0,
      });
      setStep(2);
    }
  };

  const handleComplete = async () => {
    Keyboard.dismiss();
    if (isSubmitting) return; // Prevent double-submit
    if (!validateBank()) return;
    setIsSubmitting(true);
    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await api.patch('/api/users/me', {
        name,
        email: formData.email,
        bank_name: bankDetails.bankName,
        bank_account_number: bankDetails.accountNumber,
        bank_ifsc: bankDetails.ifscCode,
        account_type: accountType,
        investment_range: investmentRange,
        investment_goals: investmentGoals,
        preferred_farm_types: preferredFarmTypes,
      });
      useAuthStore.getState().setRegistrationComplete(true);
      reset();
      router.replace('/(tabs)/dashboard');
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
          <View className="h-full w-[75%] bg-primary rounded-full" />
        </View>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Step 3 of 4 • Investor Profile
        </Text>
      </View>

      {/* Title */}
      <View className="flex-row items-center gap-3 mb-6">
        <View className="size-12 rounded-2xl bg-primary/10 items-center justify-center">
          <TrendingUp size={24} color="#4cae4f" strokeWidth={2.5} />
        </View>
        <View>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            Investment Goals
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Personalize your agricultural portfolio
          </Text>
        </View>
      </View>

      {/* Investment Range */}
      <View className="mb-6">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
          Capital Allocation
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {INVESTMENT_RANGES.map((range) => (
            <TouchableOpacity
              key={range.value}
              onPress={() => setInvestmentRange(range.value)}
              className={`flex-1 min-w-[150px] p-4 rounded-2xl border-2 transition-all ${
                investmentRange === range.value
                  ? 'border-primary bg-primary/5'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <Text className={`text-xs font-bold text-center ${
                investmentRange === range.value
                  ? 'text-primary'
                  : 'text-slate-600 dark:text-gray-400'
              }`}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Investment Goals */}
      <View className="mb-6">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
          Primary Objectives
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {INVESTMENT_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal}
              onPress={() => toggleSelection(goal, investmentGoals, setInvestmentGoals)}
              className={`px-4 py-2.5 rounded-full border-2 transition-all ${
                investmentGoals.includes(goal)
                  ? 'border-primary bg-primary'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <Text className={`text-xs font-bold ${
                investmentGoals.includes(goal)
                  ? 'text-white'
                  : 'text-slate-600 dark:text-gray-400'
              }`}>
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Farm Types */}
      <View className="mb-6">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
          Preferred Farm Sectors
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {FARM_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => toggleSelection(type, preferredFarmTypes, setPreferredFarmTypes)}
              className={`px-4 py-2.5 rounded-full border-2 transition-all ${
                preferredFarmTypes.includes(type)
                  ? 'border-primary bg-primary'
                  : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'
              }`}
            >
              <Text className={`text-xs font-bold ${
                preferredFarmTypes.includes(type)
                  ? 'text-white'
                  : 'text-slate-600 dark:text-gray-400'
              }`}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleNext}
        className="py-4.5 rounded-2xl bg-primary flex-row items-center justify-center gap-2 shadow-lg shadow-primary/20 mb-10"
      >
        <Text className="text-white font-bold text-base uppercase tracking-widest">Continue</Text>
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
          Step 4 of 4 • Settlement Details
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
            Where you'll receive your farm returns
          </Text>
        </View>
      </View>

      {/* Bank Form */}
      <View className="gap-1">
        <Input
          label="Account Holder Name"
          value={bankDetails.accountHolderName}
          onChangeText={(v) => updateBank('accountHolderName', v)}
          placeholder="e.g. John Doe"
          icon={<User size={18} color="#9ca3af" />}
          returnKeyType="next"
          onSubmitEditing={() => bankNameRef.current?.focus()}
        />

        <Input
          ref={bankNameRef}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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

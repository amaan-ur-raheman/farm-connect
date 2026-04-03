import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  ShieldCheck,
  FileText,
  CheckCircle,
  Smartphone,
  Loader,
} from 'lucide-react-native';
import { useRegistrationStore, useAuthStore } from '../../src/stores';
import api from '../../src/config/api';

type LocalDocType = 'idFront' | 'idBack' | 'proofOfAddress';

type BackendDocType = 'aadhaar_front' | 'aadhaar_back' | 'pan_card' | 'bank_statement';

const LOCAL_TYPE_MAP: Record<LocalDocType, 'aadhaar' | 'pan' | 'bank_statement'> = {
  idFront: 'aadhaar',
  idBack: 'pan',
  proofOfAddress: 'bank_statement',
};

const API_TYPE_MAP: Record<LocalDocType, BackendDocType> = {
  idFront: 'aadhaar_front',
  idBack: 'aadhaar_back',
  proofOfAddress: 'bank_statement',
};

const getMimeType = (uri: string): string => {
  const ext = uri.split('.').pop()?.toLowerCase() || '';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'pdf') return 'application/pdf';
  return 'image/jpeg';
};

const uploadKycDocument = async (
  documentType: 'aadhaar' | 'pan' | 'bank_statement',
  assetUri: string,
  fileName: string
): Promise<void> => {
  const mimeType = getMimeType(assetUri);
  const formData = new FormData();
  
  // Use the correct field names for /api/kyc/upload endpoint
  const fieldName = documentType === 'aadhaar' ? 'aadhaar' : 'land_record';
  
  // @ts-ignore - FormData type issue with React Native
  formData.append(fieldName, {
    uri: assetUri,
    name: fileName,
    type: mimeType,
  } as any);

  console.log('Uploading KYC document to /api/kyc/upload...', { fieldName, mimeType, fileName });

  try {
    const response = await api.post('/api/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('KYC upload successful:', response.data);
  } catch (error: any) {
    console.error('KYC upload failed:', error.response?.data || error.message);
    throw error;
  }
};

export default function RegisterStep2() {
  const { formData, userRole, addDocument, removeDocument: storeRemoveDoc, documents } =
    useRegistrationStore();
  const { phone: authPhone, sendOtp, loginWithOtp, isLoading, error, clearError } =
    useAuthStore();

  const role = userRole || 'farmer';
  const phone = authPhone || formData.phone;

  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({
    idFront: documents.some((d) => d.type === 'aadhaar'),
    idBack: documents.some(d => d.type === 'pan'),
    proofOfAddress: documents.some(d => d.type === 'bank_statement'),
  });

  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (phone && !otpSent) {
      handleResendOtp();
    }
  }, []);

  useEffect(() => {
    if (otpSent && !otpVerified) {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [otpSent, otpVerified]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (otpInput.length === 6 && !otpVerified) {
      handleVerifyOtp();
    }
  }, [otpInput]);

  const handleResendOtp = async () => {
    if (!phone) return;
    clearError();
    setOtpError(null);
    const success = await sendOtp(phone);
    if (success) {
      setOtpSent(true);
      setResendCooldown(30);
      setOtpInput('');
    } else {
      setOtpError(error || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    if (otpInput.length !== 6) {
      setOtpError('Please enter the 6-digit OTP');
      return;
    }
    if (!phone) return;

    clearError();
    setOtpError(null);
    const success = await loginWithOtp(phone, otpInput);
    if (success) {
      setOtpVerified(true);
      setOtpError(null);
    } else {
      setOtpError(error || 'Invalid OTP. Please try again.');
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to upload documents.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async (type: LocalDocType) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const apiDocType = API_TYPE_MAP[type];
      try {
        Alert.alert('Uploading', 'Please wait while we upload your document...');
        await uploadKycDocument(apiDocType, asset.uri, `${type}.jpg`);
        Keyboard.dismiss();
        
        addDocument({
          type: LOCAL_TYPE_MAP[type],
          uri: asset.uri,
          fileName: `${type}.jpg`,
          uploadedAt: new Date().toISOString(),
        });
        setUploadedDocs((prev) => ({
          ...prev,
          [type]: true,
        }));
        
        Alert.alert('Success', 'Document uploaded successfully!');
      } catch (err: any) {
        console.error('Upload error:', err);
        Alert.alert(
          'Upload Failed',
          err.message || 'Could not upload document. Please check your connection and try again.',
        );
      }
    }
  };

  const takePhoto = async (type: LocalDocType) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const apiDocType = API_TYPE_MAP[type];
      try {
        await uploadKycDocument(apiDocType, asset.uri, `${type}.jpg`);
      } catch {
        Alert.alert('Upload Failed', 'Could not upload document. Please try again.');
        return;
      }
      addDocument({
        type: LOCAL_TYPE_MAP[type],
        uri: asset.uri,
        fileName: `${type}.jpg`,
        uploadedAt: new Date().toISOString(),
      });
      setUploadedDocs((prev) => ({
        ...prev,
        [type]: true,
      }));
    }
  };

  const removeDoc = (type: LocalDocType) => {
    storeRemoveDoc(LOCAL_TYPE_MAP[type]);
    setUploadedDocs((prev) => ({
      ...prev,
      [type]: false,
    }));
  };

  const allDocumentsUploaded = () => {
    return (
      uploadedDocs.idFront && uploadedDocs.idBack && uploadedDocs.proofOfAddress
    );
  };

  const handleNext = () => {
    if (!otpVerified) {
      setOtpError('Please verify your phone number first');
      return;
    }
    if (!allDocumentsUploaded()) {
      Alert.alert(
        'Documents Required',
        'Please upload all required documents before continuing.'
      );
      return;
    }
    router.push(
      role === 'investor'
        ? '/register/preferences-investor'
        : '/register/preferences-farmer'
    );
  };

  const DocumentUpload = ({
    title,
    subtitle,
    type,
  }: {
    title: string;
    subtitle: string;
    type: LocalDocType;
  }) => {
    const storeType = LOCAL_TYPE_MAP[type];
    const doc = documents.find((d) => d.type === storeType);
    const hasDocument = !!doc;

    return (
      <View className="mb-4">
        <Text className="text-sm font-semibold text-text-main dark:text-white mb-1">
          {title}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {subtitle}
        </Text>

        {hasDocument && doc ? (
          <View className="rounded-xl overflow-hidden border-2 border-primary">
            <Image
              source={{ uri: doc.uri }}
              className="w-full h-40"
              resizeMode="cover"
            />
            <View className="flex-row items-center justify-between bg-primary px-4 py-2">
              <View className="flex-row items-center gap-2">
                <CheckCircle size={16} color="white" />
                <Text className="text-xs font-medium text-white">Uploaded</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeDoc(type)}
                className="flex-row items-center gap-1"
              >
                <X size={14} color="white" />
                <Text className="text-xs font-medium text-white">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="border-2 border-dashed border-[#eaf0ea] dark:border-[#2a382a] rounded-xl p-4">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => takePhoto(type)}
                className="flex-1 py-3 rounded-lg bg-[#eaf0ea] dark:bg-[#2a382a] items-center"
              >
                <Upload size={20} color="#4cae4f" />
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                  Take Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage(type)}
                className="flex-1 py-3 rounded-lg bg-[#eaf0ea] dark:bg-[#2a382a] items-center"
              >
                <FileText size={20} color="#4cae4f" />
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                  Choose File
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const formatPhone = (p: string) => {
    if (p.length >= 10) return `+91 ${p.slice(-10, -5)} ${p.slice(-5)}`;
    return p;
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
            <View className="mb-6">
              <View className="h-1.5 bg-[#eaf0ea] dark:bg-[#2a382a] rounded-full overflow-hidden">
                <View className="h-full w-[66%] bg-primary rounded-full" />
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                Step 2 of 3 • Verification
              </Text>
            </View>

            {/* Title */}
            <View className="flex-row items-center gap-3 mb-6">
              <View className="size-12 rounded-2xl bg-primary/10 items-center justify-center">
                <ShieldCheck size={24} color="#4cae4f" strokeWidth={2.5} />
              </View>
              <View>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  Verify Identity
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {role === 'investor'
                    ? 'Required for investment compliance'
                    : 'Required for farm listing verification'}
                </Text>
              </View>
            </View>

            {/* OTP Verification Card */}
            <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 mb-6 border border-[#eaf0ea] dark:border-[#2a382a] shadow-sm">
              <View className="flex-row items-center gap-2 mb-4">
                <View className="size-8 bg-[#4cae4f]/10 rounded-lg items-center justify-center">
                  <Smartphone size={16} color="#4cae4f" />
                </View>
                <Text className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Phone Verification
                </Text>
              </View>

              {phone ? (
                <Text className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">
                  We've sent an OTP to <Text className="text-slate-900 dark:text-white font-bold">{formatPhone(phone)}</Text>
                </Text>
              ) : null}

              <TextInput
                ref={otpInputRef}
                className={`bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[10px] text-slate-900 dark:text-white mb-2 border-2 transition-all ${
                  isOtpFocused ? 'border-primary bg-white dark:bg-[#1e291e]' : 'border-[#eaf0ea] dark:border-[#3a3a3a]'
                } ${otpError ? 'border-red-500' : ''}`}
                placeholder="000000"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={6}
                value={otpInput}
                onFocus={() => setIsOtpFocused(true)}
                onBlur={() => setIsOtpFocused(false)}
                onChangeText={(text: string) => {
                  setOtpInput(text.replace(/[^0-9]/g, ''));
                  setOtpError(null);
                }}
                editable={!otpVerified && !isLoading}
                onSubmitEditing={handleVerifyOtp}
                returnKeyType="done"
              />

              {otpError ? (
                <Text className="text-xs text-red-500 text-center mb-2 font-medium">
                  {otpError}
                </Text>
              ) : null}

              {otpVerified ? (
                <View className="flex-row items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                  <CheckCircle size={18} color="#4cae4f" strokeWidth={2.5} />
                  <Text className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                    Phone verified
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-between mt-2 gap-3">
                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    disabled={otpInput.length !== 6 || isLoading}
                    className={`flex-1 h-14 rounded-2xl bg-primary items-center justify-center shadow-lg shadow-primary/20 ${
                      otpInput.length !== 6 || isLoading ? 'opacity-50' : ''
                    }`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-white font-bold text-sm uppercase tracking-widest">
                        Verify OTP
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className="px-6 h-14 rounded-2xl bg-gray-100 dark:bg-[#2a382a] items-center justify-center"
                  >
                    <Text
                      className={`text-xs font-bold uppercase tracking-wider ${
                        resendCooldown > 0
                          ? 'text-gray-400'
                          : 'text-primary'
                      }`}
                    >
                      {resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* KYC Documents Card */}
            <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-6 mb-6 border border-[#eaf0ea] dark:border-[#2a382a] shadow-sm">
              <View className="flex-row items-center gap-2 mb-6">
                <View className="size-8 bg-[#4cae4f]/10 rounded-lg items-center justify-center">
                  <FileText size={16} color="#4cae4f" />
                </View>
                <Text className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  KYC Documents
                </Text>
              </View>

              <DocumentUpload
                title="Government ID (Front)"
                subtitle="Clear photo of the front of your ID"
                type="idFront"
              />

              <DocumentUpload
                title="Government ID (Back)"
                subtitle="Clear photo of the back of your ID"
                type="idBack"
              />

              <DocumentUpload
                title="Proof of Address"
                subtitle="Bank statement or Utility bill"
                type="proofOfAddress"
              />
            </View>

            {/* Navigation Buttons */}
            <View className="flex-row gap-3 mb-10">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 h-14 rounded-2xl bg-gray-100 dark:bg-[#2a382a] flex-row items-center justify-center gap-2"
              >
                <ChevronLeft size={18} color="#4cae4f" strokeWidth={2.5} />
                <Text className="text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest text-xs">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                className="flex-[2] h-14 rounded-2xl bg-primary flex-row items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Text className="text-white font-bold uppercase tracking-widest text-xs">Continue</Text>
                <ChevronRight size={18} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
  );
}

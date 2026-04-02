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
  documentType: BackendDocType,
  assetUri: string,
  fileName: string
): Promise<void> => {
  const mimeType = getMimeType(assetUri);
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('file', {
    uri: assetUri,
    name: fileName,
    type: mimeType,
  } as any);

  await api.post('/api/users/upload-kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
          <View className="mb-6">
            <View className="h-1.5 bg-[#eaf0ea] dark:bg-[#2a382a] rounded-full overflow-hidden">
              <View className="h-full w-[66%] bg-primary rounded-full" />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Step 2 of 3 • Verification
            </Text>
          </View>

          {/* Title */}
          <View className="flex-row items-center gap-3 mb-4">
            <View className="size-12 rounded-full bg-primary/10 items-center justify-center">
              <ShieldCheck size={24} color="#2be619" />
            </View>
            <View>
              <Text className="text-xl font-bold text-text-main dark:text-white">
                Verify Identity
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {role === 'investor'
                  ? 'Required for investment compliance'
                  : 'Required for farm listing verification'}
              </Text>
            </View>
          </View>

          {/* Role Badge */}
          <View className="flex-row items-center justify-center gap-2 mb-4">
            <View className="px-3 py-1.5 rounded-full bg-[#4cae4f]/10">
              <Text className="text-xs font-semibold text-primary capitalize">
                {role}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              Account Type
            </Text>
          </View>

          {/* OTP Verification Card */}
          <View className="bg-white dark:bg-[#1e291e] rounded-xl p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Smartphone size={18} color="#4cae4f" />
              <Text className="text-sm font-semibold text-text-main dark:text-white">
                Phone Verification
              </Text>
            </View>

            {phone ? (
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                OTP sent to {formatPhone(phone)}
              </Text>
            ) : null}

            <TextInput
              ref={otpInputRef}
              className="bg-[#f5f5f5] dark:bg-[#2a2a2a] rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest text-text-main dark:text-white mb-2 border border-[#e0e0e0] dark:border-[#3a3a3a]"
              placeholder="_ _ _ _ _ _"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              maxLength={6}
              value={otpInput}
              onChangeText={(text: string) => {
                setOtpInput(text.replace(/[^0-9]/g, ''));
                setOtpError(null);
              }}
              editable={!otpVerified}
            />

            {otpError ? (
              <Text className="text-xs text-red-500 text-center mb-2">
                {otpError}
              </Text>
            ) : null}

            {otpVerified ? (
              <View className="flex-row items-center justify-center gap-2 py-2">
                <CheckCircle size={16} color="#4cae4f" />
                <Text className="text-sm font-medium text-primary">
                  Phone verified
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-between mt-1">
                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={otpInput.length !== 6 || isLoading}
                  className="flex-1 py-3 rounded-xl bg-primary items-center"
                >
                  {isLoading ? (
                    <Loader size={16} color="white" className="animate-spin" />
                  ) : (
                    <Text className="text-white font-semibold text-sm">
                      Verify OTP
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="ml-2 px-3 py-3 rounded-xl bg-[#eaf0ea] dark:bg-[#2a382a]"
                >
                  <Text
                    className={`text-xs font-medium ${
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

            <Text className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
              {otpVerified
                ? 'Your phone number has been verified'
                : 'Enter the 6-digit code sent to your phone'}
            </Text>
          </View>

          {/* KYC Documents Card */}
          <View className="bg-white dark:bg-[#1e291e] rounded-xl p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <ShieldCheck size={18} color="#4cae4f" />
              <Text className="text-sm font-semibold text-text-main dark:text-white">
                Upload KYC Documents
              </Text>
            </View>

            <DocumentUpload
              title="Government ID (Front)"
              subtitle="Passport, Driver's License, or National ID"
              type="idFront"
            />

            <DocumentUpload
              title="Government ID (Back)"
              subtitle="The back of your ID document"
              type="idBack"
            />

            <DocumentUpload
              title="Proof of Address"
              subtitle="Utility bill, bank statement, or official document (within 3 months)"
              type="proofOfAddress"
            />
          </View>

          {/* Security Note */}
          <View className="flex-row items-start gap-3 p-4 bg-[#4cae4f]/5 rounded-xl mb-6">
            <ShieldCheck size={18} color="#4cae4f" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-text-main dark:text-white">
                Your documents are secure
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All documents are encrypted and stored securely. We use
                industry-standard security measures to protect your information.
              </Text>
            </View>
          </View>

          {/* Navigation Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 py-4 rounded-xl bg-[#eaf0ea] dark:bg-[#2a382a] flex-row items-center justify-center gap-2"
            >
              <ChevronLeft size={18} color="#4cae4f" />
              <Text className="text-primary font-semibold text-sm">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              className="flex-[2] py-4 rounded-xl bg-primary flex-row items-center justify-center gap-2"
            >
              <Text className="text-white font-semibold text-sm">Continue</Text>
              <ChevronRight size={18} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

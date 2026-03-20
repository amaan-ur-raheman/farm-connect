import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
} from 'lucide-react-native';
import { useRegistrationStore } from '../../src/stores';

type LocalDocType = 'idFront' | 'idBack' | 'proofOfAddress';

const TYPE_MAP: Record<LocalDocType, 'aadhaar' | 'pan' | 'bank_statement'> = {
  idFront: 'aadhaar',
  idBack: 'pan',
  proofOfAddress: 'bank_statement',
};

export default function RegisterStep2() {
  const { userRole, addDocument, removeDocument: storeRemoveDoc, documents } = useRegistrationStore();
  const role = userRole || 'farmer';
  
  const [uploadedDocs, setUploadedDocs] = useState({
    idFront: documents.some(d => d.type === 'aadhaar'),
    idBack: documents.some(d => d.type === 'pan'),
    proofOfAddress: documents.some(d => d.type === 'bank_statement'),
  });

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
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
      addDocument({
        type: TYPE_MAP[type],
        uri: asset.uri,
        fileName: `${type}.jpg`,
        uploadedAt: new Date().toISOString(),
      });
      setUploadedDocs(prev => ({
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
      addDocument({
        type: TYPE_MAP[type],
        uri: asset.uri,
        fileName: `${type}.jpg`,
        uploadedAt: new Date().toISOString(),
      });
      setUploadedDocs(prev => ({
        ...prev,
        [type]: true,
      }));
    }
  };

  const removeDoc = (type: LocalDocType) => {
    storeRemoveDoc(TYPE_MAP[type]);
    setUploadedDocs(prev => ({
      ...prev,
      [type]: false,
    }));
  };

  const allDocumentsUploaded = () => {
    return uploadedDocs.idFront && uploadedDocs.idBack && uploadedDocs.proofOfAddress;
  };

  const handleNext = () => {
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
    const storeType = TYPE_MAP[type];
    const doc = documents.find(d => d.type === storeType);
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
              <View className="h-full w-[66%] bg-primary rounded-full" />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Step 2 of 3 • Verification
            </Text>
          </View>

          {/* Title */}
          <View className="flex-row items-center gap-3 mb-2">
            <View className="size-12 rounded-full bg-primary/10 items-center justify-center">
              <ShieldCheck size={24} color="#2be619" />
            </View>
            <View>
              <Text className="text-xl font-bold text-text-main dark:text-white">
                Verify Your Identity
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {role === 'investor' 
                  ? 'Required for investment compliance'
                  : 'Required for farm listing verification'}
              </Text>
            </View>
          </View>

          {/* Role Badge */}
          <View className="flex-row items-center justify-center gap-2 mb-6 mt-4">
            <View className="px-3 py-1.5 rounded-full bg-[#4cae4f]/10">
              <Text className="text-xs font-semibold text-primary capitalize">
                {role}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              Account Type
            </Text>
          </View>

          {/* Document Uploads */}
          <View className="bg-white dark:bg-[#1e291e] rounded-xl p-4 mb-6">
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
                All documents are encrypted and stored securely. We use industry-standard security measures to protect your information.
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

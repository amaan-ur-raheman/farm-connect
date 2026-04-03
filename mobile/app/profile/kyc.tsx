// mobile/app/profile/kyc.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Header } from '../../src/components/ui/Header';
import api from '../../src/config/api';

export default function KycUploadScreen() {
  const [aadhaar, setAadhaar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your gallery to upload documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setAadhaar(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!aadhaar) {
      Alert.alert('Error', 'Please upload your Aadhaar card');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('aadhaar', {
        uri: aadhaar,
        type: 'image/jpeg',
        name: 'aadhaar.jpg',
      });

      await api.post('/api/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      Alert.alert('Success', 'KYC Documents submitted successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#151d15]">
      <Header variant="back" title="KYC Verification" onBack={() => router.back()} />
      <View className="p-6">
        <Text className="text-lg font-bold mb-4 dark:text-white">Upload Aadhaar Card</Text>
        <Text className="text-sm text-gray-500 mb-6 dark:text-gray-400">
          Please upload a clear image of your Aadhaar card for verification.
        </Text>
        
        <TouchableOpacity 
          onPress={pickImage}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 rounded-2xl items-center mb-8 bg-gray-50 dark:bg-gray-900"
        >
          {aadhaar ? (
            <Image source={{ uri: aadhaar }} className="w-full h-48 rounded-xl" resizeMode="contain" />
          ) : (
            <View className="items-center">
              <Text className="text-4xl mb-2">📄</Text>
              <Text className="text-gray-500 font-medium">Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleUpload}
          disabled={loading}
          className={`py-4 rounded-xl items-center bg-[#4cae4f] ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base uppercase tracking-wider">Submit KYC</Text>
          )}
        </TouchableOpacity>
        
        <Text className="text-[10px] text-gray-400 mt-4 text-center">
          By submitting, you agree to our data processing terms.
        </Text>
      </View>
    </View>
  );
}

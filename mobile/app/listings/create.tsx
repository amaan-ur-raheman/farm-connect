import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert, ActivityIndicator, Switch, Image } from 'react-native';
import { ChevronLeft, ChevronRight, Camera, MapPin, X } from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/config/api';

const IRRIGATION_TYPES = ['Drip', 'Sprinkler', 'Flood', 'Rainfed', 'Manual'];
const SOIL_TYPES = ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Clay'];

export default function CreateListingScreen() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    area_acres: '',
    price_per_acre: '',
    crops: '',
    location_name: '',
    soil_type: '',
    irrigation_type: '',
    is_organic: false,
    expected_harvest_month: '',
  });
  const [images, setImages] = useState<string[]>([]);

  const updateForm = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library permission.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newImages = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...newImages].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.area_acres || !form.price_per_acre || !form.location_name) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ data: { id: string } }>('/api/listings', {
        name: form.name,
        description: form.description || null,
        area_acres: parseFloat(form.area_acres),
        price_per_acre: parseFloat(form.price_per_acre),
        crops: form.crops.split(',').map((c: string) => c.trim()).filter(Boolean),
        location_name: form.location_name,
        soil_type: form.soil_type || null,
        irrigation_type: form.irrigation_type || null,
        is_organic: form.is_organic,
        expected_harvest_month: form.expected_harvest_month || null,
      });

      const listingId = res.data.data?.id;

      // Upload images
      for (const uri of images) {
        const formData = new FormData();
        formData.append('image', { uri, name: 'listing.jpg', type: 'image/jpeg' } as any);
        try {
          await api.post(`/api/listings/${listingId}/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch {}
      }

      Alert.alert('Success', 'Listing created successfully!', [
        { text: 'OK', onPress: () => router.replace('/listings') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <View className="gap-4">
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2">Basic Information</Text>
      <View>
        <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Listing Name *</Text>
        <TextInput value={form.name} onChangeText={(v: string) => updateForm('name', v)} placeholder="e.g., Sahyadri Farms - Plot #14" placeholderTextColor="#9ca3af" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e291e] text-sm text-slate-900 dark:text-white" />
      </View>
      <View>
        <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</Text>
        <TextInput value={form.description} onChangeText={(v: string) => updateForm('description', v)} placeholder="Describe your farm..." placeholderTextColor="#9ca3af" multiline numberOfLines={4} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e291e] text-sm text-slate-900 dark:text-white" style={{ textAlignVertical: 'top' }} />
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Area (Acres) *</Text>
          <TextInput value={form.area_acres} onChangeText={(v: string) => updateForm('area_acres', v)} placeholder="45.8" placeholderTextColor="#9ca3af" keyboardType="numeric" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e291e] text-sm text-slate-900 dark:text-white" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Price/Acre (₹) *</Text>
          <TextInput value={form.price_per_acre} onChangeText={(v: string) => updateForm('price_per_acre', v)} placeholder="25000" placeholderTextColor="#9ca3af" keyboardType="numeric" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e291e] text-sm text-slate-900 dark:text-white" />
        </View>
      </View>
      <View>
        <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Location *</Text>
        <View className="flex-row items-center px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e291e]">
          <MapPin size={18} color="#9ca3af" />
          <TextInput value={form.location_name} onChangeText={(v: string) => updateForm('location_name', v)} placeholder="Nashik District, Maharashtra" placeholderTextColor="#9ca3af" className="flex-1 py-3 ml-2 text-sm text-slate-900 dark:text-white" />
        </View>
      </View>
      <View>
        <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Crops (comma-separated)</Text>
        <TextInput value={form.crops} onChangeText={(v: string) => updateForm('crops', v)} placeholder="Cotton, Sugarcane, Wheat" placeholderTextColor="#9ca3af" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e291e] text-sm text-slate-900 dark:text-white" />
      </View>
      <TouchableOpacity onPress={() => setStep(2)} className="bg-[#4cae4f] py-4 rounded-xl items-center flex-row justify-center gap-2">
        <Text className="text-white font-bold">Next</Text>
        <ChevronRight size={18} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View className="gap-4">
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2">Land Details</Text>
      <View>
        <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Soil Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {SOIL_TYPES.map(type => (
            <TouchableOpacity key={type} onPress={() => updateForm('soil_type', form.soil_type === type ? '' : type)}
              className={`px-3 py-2 rounded-full border ${form.soil_type === type ? 'bg-[#4cae4f] border-[#4cae4f]' : 'border-gray-200 dark:border-gray-700'}`}>
              <Text className={`text-xs font-medium ${form.soil_type === type ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View>
        <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Irrigation Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {IRRIGATION_TYPES.map(type => (
            <TouchableOpacity key={type} onPress={() => updateForm('irrigation_type', form.irrigation_type === type ? '' : type)}
              className={`px-3 py-2 rounded-full border ${form.irrigation_type === type ? 'bg-[#4cae4f] border-[#4cae4f]' : 'border-gray-200 dark:border-gray-700'}`}>
              <Text className={`text-xs font-medium ${form.irrigation_type === type ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View>
        <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Expected Harvest Month</Text>
        <TextInput value={form.expected_harvest_month} onChangeText={(v: string) => updateForm('expected_harvest_month', v)} placeholder="e.g., October" placeholderTextColor="#9ca3af" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e291e] text-sm text-slate-900 dark:text-white" />
      </View>
      <View className="flex-row items-center justify-between py-3">
        <Text className="text-sm font-medium text-slate-900 dark:text-white">Organic Farming</Text>
        <Switch value={form.is_organic} onValueChange={(v: boolean) => updateForm('is_organic', v)} trackColor={{ false: '#d1d5db', true: '#4cae4f' }} />
      </View>
      <TouchableOpacity onPress={() => setStep(3)} className="bg-[#4cae4f] py-4 rounded-xl items-center flex-row justify-center gap-2">
        <Text className="text-white font-bold">Next</Text>
        <ChevronRight size={18} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setStep(1)} className="py-3 items-center">
        <Text className="text-[#4cae4f] font-semibold">Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View className="gap-4">
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2">Photos</Text>
      <Text className="text-xs text-gray-500 mb-2">Add up to 5 photos of your farm.</Text>
      <View className="flex-row flex-wrap gap-3">
        {images.map((uri, i) => (
          <View key={i} className="relative">
            <Image source={{ uri }} className="w-24 h-24 rounded-xl" resizeMode="cover" />
            <TouchableOpacity onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 size-6 bg-red-500 rounded-full items-center justify-center">
              <X size={12} color="white" />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 5 && (
          <TouchableOpacity onPress={pickImages} className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center">
            <Camera size={24} color="#94a3b8" />
            <Text className="text-[10px] text-gray-400 mt-1">Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={handleSubmit} disabled={submitting} className={`bg-[#4cae4f] py-4 rounded-xl items-center ${submitting ? 'opacity-60' : ''}`}>
        {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Create Listing</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setStep(2)} className="py-3 items-center">
        <Text className="text-[#4cae4f] font-semibold">Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center gap-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} className="p-2">
          <ChevronLeft size={24} color="#4cae4f" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Create Listing</Text>
        <Text className="text-xs text-gray-400 ml-auto">Step {step}/3</Text>
      </View>
      <View className="px-4 pt-4">
        <View className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <View className="h-full bg-[#4cae4f] rounded-full" style={{ width: `${(step / 3) * 100}%` }} />
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

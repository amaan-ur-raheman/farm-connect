import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert, ActivityIndicator, Switch, Image } from 'react-native';
import { ChevronLeft, ChevronRight, Camera, MapPin, X, Loader2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api, { Listing } from '../../../src/config/api';

const IRRIGATION_TYPES = ['Drip', 'Sprinkler', 'Flood', 'Rainfed', 'Manual'];
const SOIL_TYPES = ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Clay'];

export default function EditListingScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
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
  const [newImages, setNewImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await api.get<{ data: Listing }>(`/api/listings/${id}`);
        const data = res.data.data;
        if (!data) {
          Alert.alert('Error', 'Listing not found.');
          router.back();
          return;
        }
        setListing(data);
        setForm({
          name: data.name || '',
          description: data.description || '',
          area_acres: String(data.area_acres || ''),
          price_per_acre: String(data.price_per_acre || ''),
          crops: data.crops?.join(', ') || '',
          location_name: data.location_name || '',
          soil_type: data.soil_type || '',
          irrigation_type: data.irrigation_type || '',
          is_organic: data.is_organic || false,
          expected_harvest_month: data.expected_harvest_month || '',
        });
        setImages(data.images || []);
      } catch (err) {
        console.error('Failed to fetch listing:', err);
        Alert.alert('Error', 'Failed to load listing.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

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
      const newUris = result.assets.map(a => a.uri);
      setNewImages(prev => [...prev, ...newUris].slice(0, 5 - images.length));
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    // Note: Backend doesn't have a delete image endpoint, so we just remove from local state
    // In a real app, you'd want to call DELETE /api/listings/:id/images/:imageId
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.area_acres || !form.price_per_acre || !form.location_name) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/api/listings/${id}`, {
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

      // Upload new images
      for (const uri of newImages) {
        const formData = new FormData();
        formData.append('image', { uri, name: 'listing.jpg', type: 'image/jpeg' } as any);
        try {
          await api.post(`/api/listings/${id}/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (err) {
          console.error('Failed to upload image:', err);
        }
      }

      Alert.alert('Success', 'Listing updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] items-center justify-center">
        <ActivityIndicator size="large" color="#4cae4f" />
      </View>
    );
  }

  const allImages = [...images, ...newImages];
  const isNewImage = (index: number) => index >= images.length;

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center gap-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} color="#4cae4f" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white flex-1">Edit Listing</Text>
        <Text className="text-xs text-gray-400">{listing?.name || ''}</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Basic Information */}
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Basic Information</Text>
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

          {/* Land Details */}
          <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4">Land Details</Text>
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

          {/* Photos */}
          <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4">Photos</Text>
          <Text className="text-xs text-gray-500 mb-2">Add up to 5 photos of your farm.</Text>
          <View className="flex-row flex-wrap gap-3">
            {allImages.map((uri, i) => (
              <View key={i} className="relative">
                <Image source={{ uri }} className="w-24 h-24 rounded-xl" resizeMode="cover" />
                <View className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60">
                  <Text className="text-[8px] text-white">{isNewImage(i) ? 'NEW' : 'EXISTING'}</Text>
                </View>
                <TouchableOpacity onPress={() => isNewImage(i) ? handleRemoveNewImage(i - images.length) : handleRemoveExistingImage(i)} className="absolute -top-2 -right-2 size-6 bg-red-500 rounded-full items-center justify-center">
                  <X size={12} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {allImages.length < 5 && (
              <TouchableOpacity onPress={pickImages} className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center">
                <Camera size={24} color="#94a3b8" />
                <Text className="text-[10px] text-gray-400 mt-1">Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity onPress={handleSubmit} disabled={submitting} className={`bg-[#4cae4f] py-4 rounded-xl items-center mt-6 ${submitting ? 'opacity-60' : ''}`}>
            {submitting ? (
              <View className="flex-row items-center gap-2">
                <Loader2 size={20} color="white" />
                <Text className="text-white font-bold">Updating...</Text>
              </View>
            ) : (
              <Text className="text-white font-bold">Save Changes</Text>
            )}
          </TouchableOpacity>

          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  );
}

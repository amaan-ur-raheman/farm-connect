import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput as RNTextInput, 
  StatusBar, 
  Alert, 
  ActivityIndicator, 
  Switch, 
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { ChevronLeft, ChevronRight, Camera, MapPin, X, FileText, Info, IndianRupee, Layers, Sprout } from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/config/api';
import { Input } from '../../src/components/ui/Input';

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

  // Refs for navigation
  const descriptionRef = useRef<RNTextInput>(null);
  const areaRef = useRef<RNTextInput>(null);
  const priceRef = useRef<RNTextInput>(null);
  const locationRef = useRef<RNTextInput>(null);
  const cropsRef = useRef<RNTextInput>(null);
  const harvestRef = useRef<RNTextInput>(null);

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
    Keyboard.dismiss();
    if (!form.name || !form.area_acres || !form.price_per_acre || !form.location_name) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    const acres = parseFloat(form.area_acres);
    const price = parseFloat(form.price_per_acre);
    if (isNaN(acres) || acres <= 0 || isNaN(price) || price <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for area and price.');
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
        // @ts-ignore
        formData.append('image', { uri, name: 'listing.jpg', type: 'image/jpeg' });
        try {
          await api.post(`/api/listings/${listingId}/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (err) {
          console.error('Failed to upload image:', err);
        }
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
    <View className="gap-1">
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Basic Information</Text>
      
      <Input
        label="Listing Name *"
        value={form.name}
        onChangeText={(v) => updateForm('name', v)}
        placeholder="e.g., Sahyadri Farms - Plot #14"
        icon={<FileText size={18} color="#9ca3af" />}
        returnKeyType="next"
        onSubmitEditing={() => descriptionRef.current?.focus()}
      />

      <Input
        ref={descriptionRef}
        label="Description"
        value={form.description}
        onChangeText={(v) => updateForm('description', v)}
        placeholder="Describe soil quality, history, etc..."
        multiline
        numberOfLines={3}
        className="min-h-[100px]"
        style={{ textAlignVertical: 'top' }}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Input
            ref={areaRef}
            label="Area (Acres) *"
            value={form.area_acres}
            onChangeText={(v) => updateForm('area_acres', v)}
            placeholder="0.0"
            keyboardType="numeric"
            icon={<Layers size={18} color="#9ca3af" />}
            returnKeyType="next"
            onSubmitEditing={() => priceRef.current?.focus()}
          />
        </View>
        <View className="flex-1">
          <Input
            ref={priceRef}
            label="Price/Acre *"
            value={form.price_per_acre}
            onChangeText={(v) => updateForm('price_per_acre', v)}
            placeholder="0"
            keyboardType="numeric"
            icon={<IndianRupee size={18} color="#9ca3af" />}
            returnKeyType="next"
            onSubmitEditing={() => locationRef.current?.focus()}
          />
        </View>
      </View>

      <Input
        ref={locationRef}
        label="Location *"
        value={form.location_name}
        onChangeText={(v) => updateForm('location_name', v)}
        placeholder="City, State"
        icon={<MapPin size={18} color="#9ca3af" />}
        returnKeyType="next"
        onSubmitEditing={() => cropsRef.current?.focus()}
      />

      <Input
        ref={cropsRef}
        label="Crops Grown"
        value={form.crops}
        onChangeText={(v) => updateForm('crops', v)}
        placeholder="Wheat, Rice, etc. (comma separated)"
        icon={<Sprout size={18} color="#9ca3af" />}
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />

      <TouchableOpacity 
        onPress={() => { Keyboard.dismiss(); setStep(2); }} 
        className="bg-[#4cae4f] py-4.5 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-[#4cae4f]/20 mt-4"
      >
        <Text className="text-white font-bold text-base uppercase tracking-wider">Continue</Text>
        <ChevronRight size={20} color="white" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View className="gap-4">
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Land Details</Text>
      
      <View className="mb-4">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Soil Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {SOIL_TYPES.map(type => (
            <TouchableOpacity key={type} onPress={() => updateForm('soil_type', form.soil_type === type ? '' : type)}
              className={`px-4 py-2.5 rounded-full border-2 transition-all ${form.soil_type === type ? 'bg-[#4cae4f] border-[#4cae4f]' : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'}`}>
              <Text className={`text-xs font-bold ${form.soil_type === type ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Irrigation Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {IRRIGATION_TYPES.map(type => (
            <TouchableOpacity key={type} onPress={() => updateForm('irrigation_type', form.irrigation_type === type ? '' : type)}
              className={`px-4 py-2.5 rounded-full border-2 transition-all ${form.irrigation_type === type ? 'bg-[#4cae4f] border-[#4cae4f]' : 'border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e]'}`}>
              <Text className={`text-xs font-bold ${form.irrigation_type === type ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Input
        ref={harvestRef}
        label="Expected Harvest Month"
        value={form.expected_harvest_month}
        onChangeText={(v) => updateForm('expected_harvest_month', v)}
        placeholder="e.g., October"
        icon={<Info size={18} color="#9ca3af" />}
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />

      <View className="flex-row items-center justify-between bg-white dark:bg-[#1e291e] p-5 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] mb-4">
        <View>
          <Text className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Organic Farming</Text>
          <Text className="text-[10px] text-gray-500 font-medium mt-0.5">Is this land certified organic?</Text>
        </View>
        <Switch 
          value={form.is_organic} 
          onValueChange={(v: boolean) => updateForm('is_organic', v)} 
          trackColor={{ false: '#d1d5db', true: '#4cae4f' }} 
          ios_backgroundColor="#d1d5db"
        />
      </View>

      <TouchableOpacity 
        onPress={() => { Keyboard.dismiss(); setStep(3); }} 
        className="bg-[#4cae4f] py-4.5 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-[#4cae4f]/20"
      >
        <Text className="text-white font-bold text-base uppercase tracking-wider">Next Step</Text>
        <ChevronRight size={20} color="white" strokeWidth={2.5} />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setStep(1)} className="py-4 items-center">
        <Text className="text-[#4cae4f] font-bold uppercase tracking-widest text-xs">Back to Step 1</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View className="gap-4">
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Photos</Text>
      <Text className="text-sm text-gray-500 mb-4 font-medium">Add up to 5 clear photos of your farm to attract investors.</Text>
      
      <View className="flex-row flex-wrap gap-4">
        {images.map((uri, i) => (
          <View key={i} className="relative size-24 rounded-2xl overflow-hidden shadow-sm">
            <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
            <TouchableOpacity 
              onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))} 
              className="absolute top-1 right-1 size-6 bg-black/50 rounded-full items-center justify-center border border-white/20"
            >
              <X size={14} color="white" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 5 && (
          <TouchableOpacity 
            onPress={pickImages} 
            className="size-24 rounded-2xl border-2 border-dashed border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-[#1e291e] items-center justify-center active:bg-gray-50"
          >
            <Camera size={28} color="#4cae4f" strokeWidth={1.5} />
            <Text className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        onPress={handleSubmit} 
        disabled={submitting} 
        className={`bg-[#4cae4f] py-4.5 rounded-2xl items-center shadow-lg shadow-[#4cae4f]/30 mt-8 ${submitting ? 'opacity-60' : ''}`}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-base uppercase tracking-widest">Publish Listing</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setStep(2)} className="py-4 items-center">
        <Text className="text-[#4cae4f] font-bold uppercase tracking-widest text-xs">Back to Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center gap-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} className="p-2">
            <ChevronLeft size={24} color="#4cae4f" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Create Listing</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step {step} of 3</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="px-6 pt-6">
          <View className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <View className="h-full bg-[#4cae4f] rounded-full shadow-sm" style={{ width: `${(step / 3) * 100}%` }} />
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView 
            className="flex-1 px-6 pt-6" 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            <View className="h-20" />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

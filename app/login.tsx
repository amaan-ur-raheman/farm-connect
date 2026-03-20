import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  StatusBar,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Mail, Lock, Sprout, Chrome } from 'lucide-react-native';
import { router } from 'expo-router';
import { Button } from '../src/components/ui/Button';

export default function LoginScreen() {
  const [role, setRole] = useState('Investor');

  return (
    <ImageBackground 
      source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAojkku7HDG2MveUqRUfIva8ol4C9L9rW5N70sjeY4q57r7OYgCY8-OA8LRCc-qmFqKMHPicNcIuEwcc9ByRbM1-zzBmYWFTnU69hYcV9dbj9GIepMWUZfYZbC3JT__QydH4f5bkNbR5zH-6Iegmdl2TA4Vk_Bt1tqw9t5rLqgJTLc_qOiSyyc8jTIbP-ae2D_YUPObwBUffbKtG0Vti4HE6NgPppSPXpYAs5KyOT7LcMwJ9bwk76ErAIu-7PUESCJyXNobsN2qG3lU' }}
      className="flex-1"
    >
      {/* Overlay Backdrop - Matching HTML bg-background-light/80 */}
      <View className="flex-1 bg-[#f6f8f6]/80 dark:bg-[#152111]/80 items-center justify-center p-4">
        <StatusBar barStyle="dark-content" />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full max-w-[480px] bg-white dark:bg-[#1a2c15] rounded-xl p-8 shadow-2xl overflow-hidden"
        >
          <ScrollView showsVerticalScrollIndicator={false} className="w-full">
            <View className="items-center w-full">
              {/* Logo Container - Material Symbols 'spa' equivalent */}
              <View className="size-12 bg-primary/20 rounded-full items-center justify-center mb-4">
                <Sprout size={30} color="#3db814" strokeWidth={1.5} />
              </View>
 
              <Text className="text-3xl font-bold text-[#111b0e] dark:text-white tracking-tight text-center">Welcome Back</Text>
              <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400 mb-8 text-center">Log in to manage your farm or portfolio.</Text>
 
              {/* Role Selector - Segmented Control style */}
              <View className="flex-row bg-[#eaf3e7] dark:bg-[#2a3e24] p-1 rounded-lg mb-8 w-full">
                <TouchableOpacity 
                   onPress={() => setRole('Investor')}
                   className={`flex-1 py-2.5 rounded-md items-center justify-center ${role === 'Investor' ? 'bg-white dark:bg-primary shadow-sm' : ''}`}
                >
                   <Text className={`text-sm font-medium ${role === 'Investor' ? 'text-[#111b0e] dark:text-black' : 'text-slate-600 dark:text-slate-300'}`}>Investor</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   onPress={() => setRole('Farmer')}
                   className={`flex-1 py-2.5 rounded-md items-center justify-center ${role === 'Farmer' ? 'bg-white dark:bg-primary shadow-sm' : ''}`}
                >
                   <Text className={`text-sm font-medium ${role === 'Farmer' ? 'text-[#111b0e] dark:text-black' : 'text-slate-600 dark:text-slate-300'}`}>Farmer</Text>
                </TouchableOpacity>
              </View>
 
              {/* Form Areas */}
              <View className="w-full gap-5">
                 <View className="gap-2">
                    <Text className="text-sm font-medium text-[#111b0e] dark:text-slate-200">Email or Phone Number</Text>
                    <View className="h-12 bg-[#f9fcf8] dark:bg-[#152111] rounded-lg px-4 flex-row items-center border border-[#d6e7d0] dark:border-[#3a5033] focus:border-primary">
                       <TextInput 
                          placeholder="Enter your email" 
                          placeholderTextColor="rgba(96, 151, 78, 0.6)"
                          className="flex-1 text-base text-[#111b0e] dark:text-white"
                       />
                       <Mail size={20} color="#60974e" />
                    </View>
                 </View>
 
                 <View className="gap-2">
                    <Text className="text-sm font-medium text-[#111b0e] dark:text-slate-200">Password</Text>
                    <View className="h-12 bg-[#f9fcf8] dark:bg-[#152111] rounded-lg px-4 flex-row items-center border border-[#d6e7d0] dark:border-[#3a5033] focus:border-primary">
                       <TextInput 
                          placeholder="Enter your password" 
                          secureTextEntry
                          placeholderTextColor="rgba(96, 151, 78, 0.6)"
                          className="flex-1 text-base text-[#111b0e] dark:text-white"
                       />
                       <Lock size={20} color="#60974e" />
                    </View>
                    <TouchableOpacity className="mt-1 items-end">
                       <Text className="text-sm font-medium text-[#60974e] dark:text-primary">Forgot Password?</Text>
                    </TouchableOpacity>
                 </View>
 
                 <Button 
                   title="Log In" 
                   onPress={() => router.replace('/marketplace')}
                   className="w-full py-3.5 rounded-lg bg-primary mt-3 shadow-md active:scale-95"
                   textClassName="text-black font-bold text-base"
                 />
 
                 <View className="relative my-6 flex-row items-center justify-center">
                    <View className="absolute w-full h-px bg-slate-200 dark:border-slate-700" />
                    <Text className="bg-white dark:bg-[#1a2c15] px-2 text-sm text-slate-500 dark:text-slate-400">Or continue with</Text>
                 </View>
 
                 <View className="flex-row gap-4 mb-4">
                    <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2a3e24] shadow-sm">
                       <Image source={{ uri: 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png' }} className="size-5" />
                       <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2a3e24] shadow-sm">
                       <View className="size-5 items-center justify-center">
                          <Text className="text-black dark:text-white text-lg font-bold"></Text>
                       </View>
                       <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">Apple</Text>
                    </TouchableOpacity>
                 </View>
 
                 <View className="flex-row justify-center mt-4">
                    <Text className="text-sm text-slate-500 dark:text-slate-400">Don't have an account?</Text>
                    <TouchableOpacity onPress={() => router.push('/register')}>
                       <Text className="text-sm font-semibold text-[#60974e] dark:text-primary ml-1">Sign up</Text>
                    </TouchableOpacity>
                 </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

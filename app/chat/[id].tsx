import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { 
  Video, 
  Camera, 
  MapPin, 
  Mic, 
  Send, 
  Play, 
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Header } from '../../src/components/ui/Header';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      type: 'farmer', 
      sender: 'Farmer John', 
      text: 'Here is the photo of the corn field this morning. The rain really helped!',
      image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=2940&auto=format&fit=crop',
      time: '10:23 AM',
      avatar: 'https://i.pravatar.cc/100?u=farmer'
    },
    { 
      id: '2', 
      type: 'user', 
      sender: 'You', 
      text: 'Looks great. Can we talk about the irrigation system for the south plot?',
      time: '10:24 AM',
      avatar: 'https://i.pravatar.cc/100?u=vikram'
    },
    { 
      id: '3', 
      type: 'farmer', 
      sender: 'Farmer John', 
      audio: true, 
      duration: '0:14',
      time: '10:25 AM',
      avatar: 'https://i.pravatar.cc/100?u=farmer'
    }
  ]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background-light dark:bg-background-dark"
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Header - Using unified Header component */}
      <Header
        variant="back-avatar"
        userName="Farmer John"
        userStatus="Online Now"
        userAvatar="https://i.pravatar.cc/100?u=farmer"
        onActionPress={() => {}}
      />

      {/* Main Chat Area */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 150 }}
      >
        {/* Timestamp */}
        <View className="items-center mb-10">
           <View className="bg-gray-200/50 dark:bg-gray-800/50 px-4 py-1.5 rounded-full">
              <Text className="text-[10px] font-black text-[#608562] dark:text-[#8ba88c] uppercase tracking-widest">Today, 10:23 AM</Text>
           </View>
        </View>

        {messages.map((msg) => (
          <View key={msg.id} className={`flex-row items-end gap-3 mb-10 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'farmer' && (
              <View className="size-10 rounded-full border border-[#eaf0ea] overflow-hidden bg-slate-100">
                <Image source={{ uri: msg.avatar }} className="w-full h-full" />
              </View>
            )}

            <View className={`flex flex-col gap-1.5 max-w-[80%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
              <Text className={`text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1`}>
                {msg.sender}
              </Text>
              
              <View 
                className={`p-4 shadow-sm ${
                  msg.type === 'user' 
                    ? 'bg-primary rounded-2xl rounded-br-none' 
                    : 'bg-white dark:bg-surface-dark border border-[#f0f4f0] dark:border-[#2a382a] rounded-2xl rounded-bl-none'
                }`}
              >
                {msg.text && (
                  <Text className={`text-base leading-relaxed font-bold ${msg.type === 'user' ? 'text-black' : 'text-[#111811] dark:text-white'}`}>
                    {msg.text}
                  </Text>
                )}

                {msg.image && (
                  <View className="w-full aspect-[4/3] rounded-xl overflow-hidden mt-3 bg-slate-50 border border-slate-100 dark:border-slate-800">
                     <Image source={{ uri: msg.image }} className="w-full h-full" resizeMode="cover" />
                  </View>
                )}

                {msg.audio && (
                  <View className="flex-row items-center gap-3 min-w-[200px]">
                    <TouchableOpacity className="size-10 bg-primary/20 rounded-full items-center justify-center">
                      <Play size={20} color="#4cae4f" fill="#4cae4f" />
                    </TouchableOpacity>
                    <View className="flex-1 h-6 flex-row gap-0.5 items-center opacity-50 px-1">
                      {[1, 2, 4, 3, 5, 2, 4, 1, 3, 5, 2, 4, 1, 3, 5, 2].map((h, i) => (
                        <View key={i} className={`flex-1 bg-slate-400 dark:bg-slate-500 rounded-full`} style={{ height: `${h * 20}%` }} />
                      ))}
                    </View>
                    <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500">{msg.duration}</Text>
                  </View>
                )}
              </View>
            </View>

            {msg.type === 'user' && (
              <View className="size-10 rounded-full border-2 border-primary overflow-hidden">
                <Image source={{ uri: msg.avatar }} className="w-full h-full" />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View className="bg-white/80 dark:bg-[#1e291e]/80 backdrop-blur-xl border-t border-[#eaf0ea] dark:border-[#2a382a] px-4 pt-4 pb-10">
        <View className="flex-row items-center gap-2">
          
          {/* Unified Utility Actions */}
          <View className="flex-row bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl p-1 gap-1 border border-gray-100/50 dark:border-white/5">
            <TouchableOpacity className="size-10 items-center justify-center rounded-xl active:bg-white dark:active:bg-gray-700 shadow-sm shadow-transparent active:shadow-black/5">
              <Camera size={20} color="#608562" strokeWidth={2.2} />
            </TouchableOpacity>
            <TouchableOpacity className="size-10 items-center justify-center rounded-xl active:bg-white dark:active:bg-gray-700 shadow-sm shadow-transparent active:shadow-black/5">
              <MapPin size={20} color="#608562" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Pill-Shaped Input Area */}
          <View className="flex-1 h-12 bg-white dark:bg-gray-900 rounded-full px-5 flex-row items-center border border-[#eaf0ea] dark:border-[#2a382a] shadow-sm shadow-black/5">
            <TextInput 
              placeholder="Type message..." 
              placeholderTextColor="#8ba88c"
              className="flex-1 h-full text-[15px] text-[#111811] dark:text-white font-semibold"
            />
            <TouchableOpacity className="p-1">
               <Mic size={20} color="#4cae4f" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Premium Send Action */}
          <TouchableOpacity 
            className="size-12 bg-[#4cae4f] rounded-full items-center justify-center shadow-lg shadow-[#4cae4f]/30 active:scale-90"
          >
            <Send size={22} color="white" strokeWidth={2.5} className="ml-0.5" />
          </TouchableOpacity>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

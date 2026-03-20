import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Sun,
  Droplets,
  Wind,
  CloudRain,
  Gauge,
  History,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Button } from '../src/components/ui/Button';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const inspectionImage = {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTy_BFevnJwTX9oUvW3cQRXLG5qTzbu0Mo42-QfJeT_itRa1eeJwlmUmzFW93riuxbCkvCVTDtkRMO3_GQGHnJWVb2kLpn_McXb2i7UJTWS_m5eaROMxEza2lnkbWUdXjnCRldnUMwR2bF61JIWVLbPSu6MttWwAaqunY3-Vob5hxkol-o-VhzuDvJV9vz9a6WeIjUAfwr5as7EHSY-T_Cue498JtDcWn33490jedTzZYEOfo0XwBrv0kk1iVwX5qcdVveUsJ51ik0',
  };

  const userImage = {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnqoZt2bc6WKn1NLLncufc2ilDe3kqNghVmjv3JwM63-at-4pnuYSiZEY2DQYk_Ztrs5mNSgZGDFFmv9CGsmvdNBI3bM27FTG-J_5D1_i7qVAdnrYpUYghzljHqsiaio6zsyaDYr745iRxNwjrHskeXlkHKMqUHTaAPFBm5zqMLsn4rdds3S0e9t06wQJ8ZmKcUHiv-CcXC_HPEg6h0PkT4g_KhblWzUqcSue06XL6uQueS9QxDFlyMMK7CgEdGMMBccEccrqlpcKa',
  };

  const workerImage = {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR90BTNhHUfqI3kJMpo1op1KhxP_BryQyqSQBCoazkI2ps05eAlOtIS_we9_FiCgE7qPg4qrGEeiBAp2xZuIbcQYZcGx0WOYlzCgeKGepCE1L4JaCwNNsowtwLTq4fxyLCU0fRka9wqXub_lbVlg74RKMnEyZU7k1ANZt7hrungspLpwWUNER7M0QGt0xKv694ghwxS11N3R9RdM4gztnVgd7r8X2lROrURHEFUA2KaxkqhrevwiJYARAgmztW1a_pWX5ojzdJqlAV',
  };

  const agronomistImage = {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCG49enS6rNNUZoPxmzda7YPcRY42_ObZZ28bLVFT_A0hBSWe3ZcpKnHBg8lFHEeoGO_NkJDPWFC_LwRR1jH-ibm6cjG2POxF10u1bxKfLXe49B_TJCpVQsc0iROSncMTCx4cpbJkW_ae0C8f5eXkCIJFoXnCuXDmyNB7f0gS3Z88DOwz2kvzJ_xvrus_4ptvUgijx173j4aILHEFrRqEr7iG3aFaNtq_X8BgNPV8bp1AyD3LUaq3IWPz7cqN0ctmra06pz4CgyjpW',
  };

  const managerImage = {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbLGhVGI5YeKZJ3iUEqEkmwjP0LBFDwvcLhJ3ptFHRqxQg_l0AJFDBM8pg_VFsrUoKyuU_ZYu-Hex-UZp40QKhovBKJ2msGOkUnAQkF-42KP91pMep6sby1L24EzriftElkkl86UG23Ur1PWczZU9WDLuccrU4RsXCVorQXexBpmTQdDZ8kaTviN94aI0ABGwmtkU0mO8yD3QR3LsZoWFTyDNBMUI-FymopgBSfdE8hWvEa54ePe2CO2u8eqVpl6zuwnqai3e8vyn_',
  };

  const activities = [
    {
      title: 'Soil Moisture Check',
      time: '02:15 PM',
      desc: 'Sensor reading indicated 65% humidity at root level. Status: Optimal',
      active: true,
    },
    {
      title: 'Fertilizer Application',
      time: '10:30 AM',
      desc: 'Applied organic compost mix to Rows 1-10.',
      tags: ['NPK 10-10-10', 'Inventory -2 Bags'],
    },
    {
      title: 'Irrigation Started',
      time: '08:30 AM',
      desc: 'Automated drip system activated for 45 minutes.',
    },
    {
      title: 'Workers Arrived',
      time: '07:00 AM',
      desc: '5 personnel checked in via biometrics.',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <View className="flex-1 bg-[#f6f7f6] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />

      {/* Header - Using unified Header component */}
      <Header
        variant="menu"
        userImage={userImage}
        onAvatarPress={() => router.push('/profile')}
      />

      {/* Main Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4cae4f"
            colors={['#4cae4f']}
          />
        }
      >
        {/* Title Section */}
        <View className="px-4 pt-4">
          <Text className="text-3xl font-bold tracking-tight text-[#111811] dark:text-white mb-1">
            Daily Progress
          </Text>
          <View className="flex-row items-center">
            <MapPin size={14} color="#608562" className="mr-1" />
            <Text className="text-sm font-medium text-[#608562]">
              Field B - Tomato Project, Nashik, MH
            </Text>
          </View>
        </View>

        {/* Field Selector & Date - Row matching HTML layout */}
        <View className="px-4 pt-4 flex-row items-center justify-between gap-3">
          {/* Field Selector - Dropdown style matching HTML */}
          <View className="flex-1">
            <View className="bg-white dark:bg-[#1e291e] border border-[#eaf0ea] dark:border-[#2a382a] rounded-lg px-4 py-2.5 flex-row items-center justify-between">
              <Text className="text-sm font-medium text-[#111811] dark:text-white">
                Field B - Tomato Project
              </Text>
              <ChevronDown size={14} color="#608562" />
            </View>
          </View>

          {/* Date Selector matching HTML */}
          <View className="flex-row items-center bg-white dark:bg-[#1e291e] border border-[#eaf0ea] dark:border-[#2a382a] rounded-lg p-1">
            <TouchableOpacity className="p-1.5">
              <ChevronLeft size={16} color="#608562" />
            </TouchableOpacity>
            <View className="px-3 border-x border-[#eaf0ea] dark:border-[#2a382a]">
              <Text className="text-sm font-bold text-[#111811] dark:text-white">
                24 Oct, 2023
              </Text>
            </View>
            <TouchableOpacity className="p-1.5">
              <ChevronRight size={16} color="#608562" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Action Card - Matching HTML exactly */}
        <View className="px-4 pt-6">
          <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-lg border-2 border-[#4cae4f]/20 p-6 relative overflow-hidden">
            <View className="absolute top-0 right-0 p-4 opacity-10">
              <Text className="text-8xl font-black text-[#4cae4f]">₹</Text>
            </View>

            <View className="relative z-10">
              <Text className="text-xs font-semibold uppercase tracking-wider text-[#608562] mb-1">
                Pending Action
              </Text>
              <View className="flex-row items-baseline gap-1 mb-4">
                <Text className="text-4xl font-bold text-[#111811] dark:text-white">₹3,600</Text>
                <Text className="text-sm text-gray-500">Daily Labour Cost</Text>
              </View>

              <View className="flex-row justify-between text-sm text-gray-600 dark:text-gray-400 mb-6 bg-[#f9fbf9] dark:bg-black/20 p-3 rounded-lg">
                <Text className="font-medium">5 Workers</Text>
                <Text className="font-medium">9hrs Total</Text>
              </View>

              <Button
                title="Pay Daily Wage"
                className="w-full py-3.5 rounded-lg bg-[#4cae4f]"
                textClassName="text-white font-bold"
                onPress={() => {}}
              />

              <View className="flex-row items-center justify-center mt-3 gap-1">
                <Text className="text-xs text-gray-400">Secure transaction via AgriPay</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Field Conditions Card - Matching HTML */}
        <View className="px-4 pt-6">
          <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="font-bold text-[#111811] dark:text-white">Field Conditions</Text>
              <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                <Text className="text-xs font-medium text-green-800 dark:text-green-200">Live</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 mb-6">
              <View className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-full">
                <Sun size={32} color="#eab308" />
              </View>
              <View>
                <Text className="text-4xl font-bold text-[#111811] dark:text-white">24°C</Text>
                <Text className="text-sm text-[#608562]">Sunny - UV High</Text>
              </View>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg">
                <View className="flex-row items-center gap-2 mb-1">
                  <Droplets size={14} color="#608562" />
                  <Text className="text-xs font-medium uppercase text-[#608562]">Humidity</Text>
                </View>
                <Text className="text-lg font-bold text-[#111811] dark:text-white">42%</Text>
              </View>
              <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg">
                <View className="flex-row items-center gap-2 mb-1">
                  <Wind size={14} color="#608562" />
                  <Text className="text-xs font-medium uppercase text-[#608562]">Wind</Text>
                </View>
                <Text className="text-lg font-bold text-[#111811] dark:text-white">12km/h</Text>
              </View>
              <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg">
                <View className="flex-row items-center gap-2 mb-1">
                  <CloudRain size={14} color="#608562" />
                  <Text className="text-xs font-medium uppercase text-[#608562]">Rain</Text>
                </View>
                <Text className="text-lg font-bold text-[#111811] dark:text-white">5%</Text>
              </View>
              <View className="bg-[#f9fbf9] dark:bg-[#1a231a] p-3 rounded-lg">
                <View className="flex-row items-center gap-2 mb-1">
                  <Gauge size={14} color="#608562" />
                  <Text className="text-xs font-medium uppercase text-[#608562]">Pressure</Text>
                </View>
                <Text className="text-lg font-bold text-[#111811] dark:text-white">1012hPa</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Crop Inspection Card - Matching HTML */}
        <View className="px-4 pt-6">
          <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] overflow-hidden">
            <View className="relative h-64 w-full">
              <Image source={inspectionImage} className="w-full h-full" resizeMode="cover" />
              <View className="absolute top-4 left-4 flex-row items-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                <ShieldCheck size={14} color="#4cae4f" className="mr-2" />
                <Text className="text-xs font-medium text-white">Verified by GPS - 09:42 AM</Text>
              </View>
            </View>

            <View className="p-5">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-lg font-bold text-[#111811] dark:text-white">
                    Daily Crop Inspection
                  </Text>
                  <Text className="text-sm text-[#608562]">North Quadrant - Row 12-18</Text>
                </View>
                <View className="flex-row -space-x-2">
                  <View className="size-8 rounded-full border-2 border-white dark:border-[#1e291e] overflow-hidden">
                    <Image source={workerImage} className="w-full h-full" />
                  </View>
                  <View className="size-8 rounded-full border-2 border-white dark:border-[#1e291e] overflow-hidden -ml-2">
                    <Image source={agronomistImage} className="w-full h-full" />
                  </View>
                </View>
              </View>
              <Text className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Tomatoes are showing excellent color development. No signs of pest activity. Soil moisture
                levels are optimal following the morning irrigation cycle.
              </Text>
            </View>
          </View>
        </View>

        {/* Manager's Note Card - Matching HTML */}
        <View className="px-4 pt-6">
          <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6">
            <Text className="font-bold text-[#111811] dark:text-white mb-3">Manager's Note</Text>
            <View className="flex-row items-center gap-3 mb-3">
              <View className="size-10 rounded-full border border-slate-100 overflow-hidden">
                <Image source={managerImage} className="w-full h-full" />
              </View>
              <View>
                <Text className="text-sm font-bold text-[#111811] dark:text-white">Anjali Desai</Text>
                <Text className="text-xs text-gray-500">Farm Manager</Text>
              </View>
            </View>
            <View className="relative bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg rounded-tl-none">
              <View className="absolute -top-1.5 left-4 size-2 bg-yellow-50 dark:bg-yellow-900/10 rotate-45" />
              <Text className="text-sm italic text-gray-700 dark:text-gray-300 leading-relaxed">
                "We finished the organic treatment early today. The team is ahead of schedule for next
                week's harvest prep. No issues reported."
              </Text>
            </View>
            <TouchableOpacity className="mt-4">
              <Text className="text-[#4cae4f] text-sm font-bold">Reply to Anjali</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Log - Matching HTML */}
        <View className="px-4 pt-6">
          <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6">
            <View className="flex-row items-center gap-2 mb-6">
              <History size={20} color="#4cae4f" />
              <Text className="text-lg font-bold text-[#111811] dark:text-white">Activity Log</Text>
            </View>

            <View className="pl-4 border-l-2 border-[#eaf0ea] dark:border-[#2a382a] space-y-8">
              {activities.map((item, index) => (
                <View key={index} className="relative pl-6">
                  <View
                    className={`absolute -left-[21px] top-1 size-4 rounded-full border-2 border-white dark:border-[#1e291e] ${
                      item.active ? 'bg-[#4cae4f]' : 'bg-[#eaf0ea] dark:bg-[#2a382a]'
                    }`}
                  />
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-bold text-[#111811] dark:text-white">{item.title}</Text>
                    <View className="bg-[#eaf0ea] dark:bg-[#2a382a] px-2 py-0.5 rounded">
                      <Text className="text-xs font-mono text-gray-500">{item.time}</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.desc}</Text>
                  {item.tags && item.tags.length > 0 && (
                    <View className="flex-row gap-2">
                      {item.tags.map((tag, tagIndex) => (
                        <View
                          key={tagIndex}
                          className={`px-2 py-1 rounded ${
                            tagIndex === 0
                              ? 'bg-blue-50 dark:bg-blue-900/30'
                              : 'bg-yellow-50 dark:bg-yellow-900/30'
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              tagIndex === 0
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-yellow-700 dark:text-yellow-300'
                            }`}
                          >
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Weekly Budget - Matching HTML */}
        <View className="px-4 pt-6">
          <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-sm border border-[#eaf0ea] dark:border-[#2a382a] p-6">
            <View className="flex-row justify-between items-end mb-2">
              <View>
                <Text className="text-xs font-medium uppercase text-[#608562] mb-0.5">Weekly Budget</Text>
                <Text className="text-xl font-bold text-[#111811] dark:text-white">
                  82% <Text className="text-sm font-normal text-gray-400 italic">used</Text>
                </Text>
              </View>
              <Text className="text-xs text-gray-400 mb-1">Last 7 days</Text>
            </View>

            <View className="flex-row items-end gap-1 h-16">
              <View className="flex-1 bg-[#eaf0ea] dark:bg-[#2a382a] h-[40%] rounded-t-sm" />
              <View className="flex-1 bg-[#eaf0ea] dark:bg-[#2a382a] h-[60%] rounded-t-sm" />
              <View className="flex-1 bg-[#eaf0ea] dark:bg-[#2a382a] h-[50%] rounded-t-sm" />
              <View className="flex-1 bg-[#4cae4f]/40 h-[70%] rounded-t-sm" />
              <View className="flex-1 bg-[#4cae4f]/60 h-[80%] rounded-t-sm" />
              <View className="flex-1 bg-[#4cae4f]/80 h-[65%] rounded-t-sm" />
              <View className="flex-1 bg-[#4cae4f] h-[90%] rounded-t-sm relative">
                <View className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black rounded">
                  <Text className="text-[10px] text-white font-bold">Today</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer - Matching HTML */}
        <View className="mt-12 mb-4 px-4">
          <Text className="text-xs text-center text-gray-400">
            - 2023 AgriInvest Platform. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

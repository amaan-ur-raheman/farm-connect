import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { ChevronLeft, ChevronDown, ChevronUp, Mail, Phone, Globe, FileText, Shield, HelpCircle, Info } from 'lucide-react-native';
import { router } from 'expo-router';

const faqs = [
  {
    question: 'What is FarmConnect?',
    answer: 'FarmConnect is a platform that connects farmers with investors. Farmers can list their farms for investment, and investors can fund agricultural projects and earn returns.',
  },
  {
    question: 'How do I invest in a farm?',
    answer: 'Browse the Marketplace, select a farm you\'re interested in, and click "Acquire Digital Lease" to start the investment process. Your funds will be held in escrow for security.',
  },
  {
    question: 'Is my investment secure?',
    answer: 'Yes! All investments are protected through our escrow system. Funds are released to farmers gradually based on contract milestones, and you can track progress through regular farm updates.',
  },
  {
    question: 'How do I list my farm?',
    answer: 'As a farmer, go to Profile → My Listings → Create Listing. Fill in your farm details, upload photos, and set your pricing. Your listing will be visible to investors after review.',
  },
  {
    question: 'What is KYC verification?',
    answer: 'KYC (Know Your Customer) is a verification process to ensure all users are legitimate. You\'ll need to upload a government-issued ID. This protects both farmers and investors.',
  },
  {
    question: 'How do I withdraw my earnings?',
    answer: 'Go to Profile → Wallet to view your balance. Farmers can withdraw earnings to their linked bank account. Processing typically takes 2-3 business days.',
  },
];

export default function HelpScreen() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@farmconnect.com');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+911234567890');
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://farmconnect.com');
  };

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#4cae4f" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">Help & Support</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">We're here to help!</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-6">
          {/* Contact Support */}
          <View className="bg-white dark:bg-[#1e291e] rounded-2xl p-6 border border-[#eaf0ea] dark:border-[#2a382a]">
            <View className="flex-row items-center gap-3 mb-4">
              <HelpCircle size={24} color="#4cae4f" />
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Contact Support</Text>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleEmailSupport}
                className="flex-row items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <Mail size={20} color="#4cae4f" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-white">Email Support</Text>
                  <Text className="text-xs text-gray-500">support@farmconnect.com</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCallSupport}
                className="flex-row items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <Phone size={20} color="#4cae4f" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-white">Call Support</Text>
                  <Text className="text-xs text-gray-500">+91 12345 67890</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVisitWebsite}
                className="flex-row items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <Globe size={20} color="#4cae4f" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-white">Visit Website</Text>
                  <Text className="text-xs text-gray-500">farmconnect.com</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQ */}
          <View className="bg-white dark:bg-[#1e291e] rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] overflow-hidden">
            <View className="p-6 border-b border-[#eaf0ea] dark:border-[#2a382a]">
              <View className="flex-row items-center gap-3">
                <HelpCircle size={24} color="#4cae4f" />
                <Text className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</Text>
              </View>
            </View>

            {faqs.map((faq, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className={`border-b border-[#eaf0ea] dark:border-[#2a382a] ${index === faqs.length - 1 ? 'border-b-0' : ''}`}
              >
                <View className="p-4 flex-row items-center justify-between">
                  <Text className="flex-1 text-sm font-semibold text-slate-900 dark:text-white pr-4">
                    {faq.question}
                  </Text>
                  {expandedFaq === index ? (
                    <ChevronUp size={20} color="#94a3b8" />
                  ) : (
                    <ChevronDown size={20} color="#94a3b8" />
                  )}
                </View>
                {expandedFaq === index && (
                  <View className="px-4 pb-4">
                    <Text className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Legal & Safety */}
          <View className="bg-white dark:bg-[#1e291e] rounded-2xl p-6 border border-[#eaf0ea] dark:border-[#2a382a]">
            <View className="flex-row items-center gap-3 mb-4">
              <Shield size={24} color="#4cae4f" />
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Legal & Safety</Text>
            </View>

            <View className="space-y-3">
              <TouchableOpacity className="flex-row items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <FileText size={20} color="#4cae4f" />
                <Text className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">Terms of Service</Text>
                <ChevronDown size={16} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Shield size={20} color="#4cae4f" />
                <Text className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">Privacy Policy</Text>
                <ChevronDown size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* App Info */}
          <View className="bg-white dark:bg-[#1e291e] rounded-2xl p-6 border border-[#eaf0ea] dark:border-[#2a382a]">
            <View className="flex-row items-center gap-3 mb-4">
              <Info size={24} color="#4cae4f" />
              <Text className="text-lg font-bold text-slate-900 dark:text-white">About FarmConnect</Text>
            </View>

            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Version</Text>
                <Text className="text-sm font-semibold text-slate-900 dark:text-white">2.4.0</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Build</Text>
                <Text className="text-sm font-semibold text-slate-900 dark:text-white">2026.04.03</Text>
              </View>
            </View>

            <Text className="text-xs text-gray-400 mt-4 text-center">
              Connecting Farmers with Investors
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

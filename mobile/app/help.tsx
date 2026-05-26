import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Linking, useColorScheme, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { ChevronLeft, ChevronDown, ChevronUp, Mail, Phone, Globe, FileText, Shield, HelpCircle, Info } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';
import { Card, Button } from '../src/components/ui';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@farmconnect.com');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+911234567890');
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://farmconnect.com');
  };

  const handleTermsOfService = () => {
    // TODO: Navigate to Terms of Service
  };

  const handlePrivacyPolicy = () => {
    // TODO: Navigate to Privacy Policy
  };

  const iconColor = isDark ? colors.primary[400] : colors.primary[700];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={iconColor} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[typography.title, { color: currentTheme.text }]}>Help & Support</Text>
            <Text style={[typography.caption, { color: currentTheme.textTertiary }]}>We're here to help!</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Contact Support */}
          <Card variant="default" padding="xl">
            <View style={styles.sectionHeader}>
              <HelpCircle size={24} color={iconColor} />
              <Text style={[typography.titleSm, { color: currentTheme.text }]}>Contact Support</Text>
            </View>

            <View style={styles.contactList}>
              <TouchableOpacity
                onPress={handleEmailSupport}
                style={[styles.contactItem, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[50] }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Mail size={20} color={iconColor} />
                <View style={styles.contactText}>
                  <Text style={[typography.bodySm, { fontWeight: '600', color: currentTheme.text }]}>Email Support</Text>
                  <Text style={[typography.caption, { color: currentTheme.textTertiary }]}>support@farmconnect.com</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCallSupport}
                style={[styles.contactItem, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[50] }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Phone size={20} color={iconColor} />
                <View style={styles.contactText}>
                  <Text style={[typography.bodySm, { fontWeight: '600', color: currentTheme.text }]}>Call Support</Text>
                  <Text style={[typography.caption, { color: currentTheme.textTertiary }]}>+91 12345 67890</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVisitWebsite}
                style={[styles.contactItem, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[50] }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Globe size={20} color={iconColor} />
                <View style={styles.contactText}>
                  <Text style={[typography.bodySm, { fontWeight: '600', color: currentTheme.text }]}>Visit Website</Text>
                  <Text style={[typography.caption, { color: currentTheme.textTertiary }]}>farmconnect.com</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Card>

          {/* FAQ */}
          <Card variant="default" padding="lg">
            <View style={[styles.faqHeader, { borderBottomColor: currentTheme.border }]}>
              <HelpCircle size={24} color={iconColor} />
              <Text style={[typography.titleSm, { color: currentTheme.text }]}>Frequently Asked Questions</Text>
            </View>

            {faqs.map((faq, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                style={[styles.faqItem, { borderBottomColor: index === faqs.length - 1 ? 'transparent' : currentTheme.border }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={[typography.bodySm, { fontWeight: '600', color: currentTheme.text, flex: 1, paddingRight: spacing.sm }]}>
                    {faq.question}
                  </Text>
                  {expandedFaq === index ? (
                    <ChevronUp size={20} color={isDark ? colors.neutral[400] : colors.neutral[400]} />
                  ) : (
                    <ChevronDown size={20} color={isDark ? colors.neutral[400] : colors.neutral[400]} />
                  )}
                </View>
                {expandedFaq === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={[typography.bodySm, { color: currentTheme.textTertiary, lineHeight: 22 }]}>
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Card>

          {/* Legal & Safety */}
          <Card variant="default" padding="xl">
            <View style={styles.sectionHeader}>
              <Shield size={24} color={iconColor} />
              <Text style={[typography.titleSm, { color: currentTheme.text }]}>Legal & Safety</Text>
            </View>

            <View style={styles.contactList}>
              <TouchableOpacity
                onPress={handleTermsOfService}
                style={[styles.contactItem, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[50] }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <FileText size={20} color={iconColor} />
                <Text style={[typography.bodySm, { fontWeight: '600', color: currentTheme.text, flex: 1 }]}>Terms of Service</Text>
                <ChevronDown size={16} color={isDark ? colors.neutral[400] : colors.neutral[400]} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePrivacyPolicy}
                style={[styles.contactItem, { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[50] }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Shield size={20} color={iconColor} />
                <Text style={[typography.bodySm, { fontWeight: '600', color: currentTheme.text, flex: 1 }]}>Privacy Policy</Text>
                <ChevronDown size={16} color={isDark ? colors.neutral[400] : colors.neutral[400]} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* App Info */}
          <Card variant="default" padding="xl">
            <View style={styles.sectionHeader}>
              <Info size={24} color={iconColor} />
              <Text style={[typography.titleSm, { color: currentTheme.text }]}>About FarmConnect</Text>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={[typography.bodySm, { color: currentTheme.textTertiary }]}>Version</Text>
                <Text style={[typography.bodySm, { fontWeight: '600', color: currentTheme.text }]}>2.4.0</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[typography.bodySm, { color: currentTheme.textTertiary }]}>Build</Text>
                <Text style={[typography.bodySm, { fontWeight: '600', color: currentTheme.text }]}>2026.04.03</Text>
              </View>
            </View>

            <Text style={[typography.captionXs, { color: isDark ? colors.neutral[500] : colors.neutral[300], textAlign: 'center', marginTop: spacing.lg }]}>
              Connecting Farmers with Investors
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 48,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  contactList: {
    gap: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    minHeight: 44,
  },
  contactText: {
    flex: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  faqItem: {
    borderBottomWidth: 1,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    minHeight: 44,
  },
  faqAnswer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    alignItems: 'center',
  },
});

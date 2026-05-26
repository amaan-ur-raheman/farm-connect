import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Switch,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import {
  Settings,
  LogOut,
  Wallet,
  Tractor,
  Shield,
  ChevronRight,
  TrendingUp,
  CreditCard,
  MessageSquare,
  HelpCircle,
  Clock,
  LayoutDashboard,
  Map,
  Compass,
  Globe,
  User,
  Heart,
  Bell,
  Package,
  AlertTriangle,
  FileText,
  Fingerprint,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Card } from '../src/components/ui/Card';
import { Skeleton } from '../src/components/ui/Skeleton';
import { Button } from '../src/components/ui/Button';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';
import { useUserStore, useAuthStore, useRegistrationStore } from '../src/stores';
import { useUnreadCounts } from '../src/config/unread-context';
import { biometric } from '../src/utils/biometric';
import { haptic } from '../src/utils/haptics';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';

function SidebarItem({ icon, label, active = false, onPress, badge }: { icon: any; label: string; active?: boolean; onPress?: () => void; badge?: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + spacing.xs,
        borderRadius: radii.md,
        backgroundColor: active ? (isDark ? colors.primary[900] : colors.primary[100]) : 'transparent',
        minHeight: 44,
      }}
    >
      <View style={{ marginRight: spacing.md }}>
        {React.cloneElement(icon, { color: active ? colors.primary[500] : currentTheme.textTertiary, size: 18, strokeWidth: active ? 2.5 : 2 })}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: typography.bodySm.fontSize,
          lineHeight: typography.bodySm.lineHeight,
          letterSpacing: -0.1,
          fontWeight: active ? typography.heading.fontWeight : typography.title.fontWeight,
          color: active ? currentTheme.primary : currentTheme.textTertiary,
        }}
      >
        {label}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View
          style={{
            backgroundColor: colors.error.light,
            borderRadius: radii.full,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            minWidth: 20,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: typography.captionXs.fontSize,
              fontWeight: typography.heading.fontWeight,
              color: '#FFFFFF',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MenuItem({ icon, label, isLast = false, onPress, badge }: { icon: any; label: string; isLast?: boolean; onPress?: () => void; badge?: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={{
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg + spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: currentTheme.divider,
        minHeight: 44,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {icon}
        <Text
          style={{
            fontSize: typography.bodySm.fontSize,
            lineHeight: typography.bodySm.lineHeight,
            fontWeight: typography.heading.fontWeight,
            color: currentTheme.text,
            letterSpacing: -0.1,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View
            style={{
              backgroundColor: colors.error.light,
              borderRadius: radii.full,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              minWidth: 20,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: typography.captionXs.fontSize,
                fontWeight: typography.heading.fontWeight,
                color: '#FFFFFF',
              }}
            >
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <ChevronRight size={14} color={currentTheme.textTertiary} opacity={0.5} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isLargeScreen = windowWidth > 1024;
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  const { profile, wallet, holdings, fetchProfile, fetchWallet, fetchHoldings } = useUserStore();
  const { userRole, authUser } = useAuthStore();
  const { unreadCounts } = useUnreadCounts();
  const resetRegistration = useRegistrationStore((s) => s.reset);
  const clearUser = useUserStore((s) => s.clearUser);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      await fetchProfile();
      return profile;
    },
  });

  const { data: walletData } = useQuery({
    queryKey: ['walletBalance', 'profile'],
    queryFn: async () => {
      await fetchWallet();
      return wallet;
    },
  });

  const { data: holdingsData } = useQuery({
    queryKey: ['userHoldings'],
    queryFn: async () => {
      await fetchHoldings();
      return holdings;
    },
  });

  const changeLanguage = async (lng: string) => {
    haptic.light();
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem('user-language', lng);
  };

  useEffect(() => {
    const checkBiometric = async () => {
      const supported = await biometric.isCompatible();
      const enrolled = await biometric.isEnrolled();
      const enabled = await biometric.isBiometricEnabled();

      setBiometricSupported(supported && enrolled);
      setBiometricEnabled(enabled);
    };
    checkBiometric();
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const handleLogout = () => {
    haptic.light();
    Alert.alert(
      t('common.logout'),
      'Are you sure you want to logout?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: () => {
            haptic.success();
            resetRegistration();
            clearUser();
            router.replace('/login');
          }
        },
      ]
    );
  };

  const toggleBiometric = async (value: boolean) => {
    haptic.light();
    if (value) {
      const success = await biometric.enableBiometric(authUser?.phone);
      if (success) {
        haptic.success();
        setBiometricEnabled(true);
        Alert.alert('Success', 'Biometric login enabled!');
      } else {
        haptic.error();
        Alert.alert('Failed', 'Could not enable biometric login. Please try again.');
      }
    } else {
      await biometric.disableBiometric();
      setBiometricEnabled(false);
    }
  };

  const kycStatus = authUser?.kyc_status || 'PENDING';

  const kycColorMap: Record<string, { bg: string; text: string }> = {
    VERIFIED: { bg: isDark ? 'rgba(22, 163, 74, 0.2)' : colors.primary[100], text: isDark ? '#4ADE80' : '#16A34A' },
    SUBMITTED: { bg: isDark ? 'rgba(56, 189, 248, 0.2)' : '#EFF6FF', text: isDark ? '#38BDF8' : '#0284C7' },
    PENDING: { bg: isDark ? 'rgba(250, 204, 21, 0.2)' : '#FEF9C3', text: isDark ? '#FACC15' : '#CA8A04' },
  };
  const kycColors = kycColorMap[kycStatus] || { bg: isDark ? 'rgba(248, 113, 113, 0.2)' : '#FEF2F2', text: isDark ? colors.error.dark : colors.error.light };

  const stats = [
    { label: 'Total Holdings', value: `${holdings?.totalAcres ?? 0} Acres`, icon: <Tractor size={20} color={currentTheme.primary} /> },
    { label: 'Lease Revenue', value: 'Coming Soon', icon: <TrendingUp size={20} color={currentTheme.info} /> },
    { label: 'Wallet Balance', value: `Rs.${(wallet?.balance ?? 0).toLocaleString('en-IN')}`, icon: <Wallet size={20} color={isDark ? colors.accent[400] : colors.accent[600]} /> },
  ];

  const Sidebar = () => (
    <View
      style={{
        width: 256,
        borderRightWidth: 1,
        borderRightColor: currentTheme.border,
        backgroundColor: currentTheme.surface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing['3xl'],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing['3xl'], gap: spacing.md }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radii.md,
            backgroundColor: currentTheme.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Tractor size={18} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <Text
          style={{
            fontSize: typography.heading.fontSize + 4,
            lineHeight: typography.heading.lineHeight + 4,
            fontWeight: typography.heading.fontWeight,
            letterSpacing: -0.5,
            color: currentTheme.text,
            textTransform: 'uppercase',
          }}
        >
          FarmConnect
        </Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        <SidebarItem icon={<LayoutDashboard />} label="Overview" onPress={() => router.push('/dashboard')} />
        <SidebarItem icon={<Map />} label="My Properties" onPress={() => userRole === 'farmer' ? router.push('/listings') : router.push('/contracts')} />
        <SidebarItem icon={<Compass />} label="Explore All" onPress={() => router.push('/marketplace')} />
        <SidebarItem icon={<MessageSquare />} label="Messages" onPress={() => router.push('/chat')} badge={unreadCounts.chat} />
        <SidebarItem icon={<Bell />} label="Notifications" onPress={() => router.push('/notifications')} badge={unreadCounts.notifications} />
        <SidebarItem icon={<User />} label="My Profile" active />
      </View>

      <View
        style={{
          marginTop: 'auto',
          paddingTop: spacing['3xl'],
          borderTopWidth: 1,
          borderTopColor: currentTheme.border,
        }}
      >
        <SidebarItem icon={<Wallet />} label="Wallet" onPress={() => router.push('/wallet')} />
        <SidebarItem icon={<LogOut />} label="Logout Portal" onPress={handleLogout} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Header variant="menu" />

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {isLargeScreen && <Sidebar />}

        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            style={{
              padding: spacing.xl,
              maxWidth: isLargeScreen ? 896 : undefined,
              alignSelf: isLargeScreen ? 'center' : undefined,
              width: isLargeScreen ? '100%' : undefined,
            }}
          >
            {/* Page Title */}
            <View style={{ marginBottom: spacing['2xl'] }}>
              <Text
                style={{
                  fontSize: typography.captionXs.fontSize,
                  lineHeight: typography.captionXs.lineHeight,
                  fontWeight: typography.heading.fontWeight,
                  color: currentTheme.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: spacing.xs / 2,
                }}
              >
                {userRole === 'consumer' ? 'Investor Dashboard' : 'Farmer Dashboard'}
              </Text>
              <Text
                style={{
                  fontSize: typography.heading.fontSize,
                  lineHeight: typography.heading.lineHeight,
                  fontWeight: typography.heading.fontWeight,
                  color: currentTheme.text,
                  letterSpacing: -0.3,
                  textTransform: 'uppercase',
                }}
              >
                My Profile
              </Text>
            </View>

            {/* Profile Hero Card */}
            {profileLoading ? (
              <Card padding="2xl" style={{ marginBottom: spacing['2xl'], flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
                <Skeleton width={96} height={96} borderRadius={radii.full} />
                <View style={{ flex: 1, gap: spacing.md }}>
                  <Skeleton width="60%" height={28} />
                  <Skeleton width="40%" height={16} />
                </View>
              </Card>
            ) : (
              <Card padding="2xl" style={{ marginBottom: spacing['2xl'], flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: radii.full,
                    borderWidth: 4,
                    borderColor: currentTheme.background,
                    overflow: 'hidden',
                    ...getShadow('sm', isDark),
                  }}
                >
                  <Image
                    source={{ uri: authUser?.avatar_url || profile?.avatar || `https://i.pravatar.cc/300?u=${authUser?.id}` }}
                    style={{ width: '100%', height: '100%' }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      width: 20,
                      height: 20,
                      borderRadius: radii.full,
                      backgroundColor: currentTheme.primary,
                      borderWidth: 2,
                      borderColor: currentTheme.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Shield size={10} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: typography.display.fontSize,
                      lineHeight: typography.display.lineHeight,
                      fontWeight: typography.heading.fontWeight,
                      color: currentTheme.text,
                      letterSpacing: -0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {profile?.firstName || authUser?.name?.split(' ')[0] || 'User'} {profile?.lastName || authUser?.name?.split(' ').slice(1).join(' ') || ''}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                    <View
                      style={{
                        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : `${colors.primary[700]}1A`,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radii.full,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: typography.captionXs.fontSize,
                          lineHeight: typography.captionXs.lineHeight,
                          fontWeight: typography.heading.fontWeight,
                          color: currentTheme.primary,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        {userRole === 'consumer' ? 'Premium Agri-Investor' : 'Verified Farmer'}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: kycColors.bg,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radii.full,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: typography.captionXs.fontSize,
                          lineHeight: typography.captionXs.lineHeight,
                          fontWeight: typography.heading.fontWeight,
                          color: kycColors.text,
                          textTransform: 'uppercase',
                        }}
                      >
                        KYC: {kycStatus}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            )}

            {/* Quick Stats Grid */}
            <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing['3xl'], flexWrap: 'wrap' }}>
              {stats.map((stat, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    backgroundColor: currentTheme.surface,
                    padding: spacing.xl,
                    borderRadius: radii.xl,
                    borderWidth: 1,
                    borderColor: currentTheme.border,
                    ...getShadow('sm', isDark),
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radii.md,
                      backgroundColor: currentTheme.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: spacing.lg,
                    }}
                  >
                    {stat.icon}
                  </View>
                  <Text
                    style={{
                      fontSize: typography.captionXs.fontSize,
                      lineHeight: typography.captionXs.lineHeight,
                      fontWeight: typography.heading.fontWeight,
                      color: currentTheme.textTertiary,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: spacing.xs / 2,
                    }}
                  >
                    {stat.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.title.fontSize,
                      lineHeight: typography.title.lineHeight,
                      fontWeight: typography.heading.fontWeight,
                      color: currentTheme.text,
                      letterSpacing: -0.2,
                    }}
                  >
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Sections */}
            <View style={{ gap: spacing['2xl'] }}>
              <View>
                <Text
                  style={{
                    fontSize: typography.captionXs.fontSize,
                    lineHeight: typography.captionXs.lineHeight,
                    fontWeight: typography.heading.fontWeight,
                    color: currentTheme.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: spacing.lg,
                    marginLeft: spacing.sm,
                  }}
                >
                  Financial Operations
                </Text>
                <Card style={{ overflow: 'hidden' }}>
                  <MenuItem icon={<Wallet size={18} color={currentTheme.textTertiary} />} label="Wallet & Transactions" onPress={() => router.push('/wallet')} />
                  <MenuItem icon={<CreditCard size={18} color={currentTheme.textTertiary} />} label="Escrow Ledger" onPress={() => router.push('/contracts')} />
                  <MenuItem icon={<Clock size={18} color={currentTheme.textTertiary} />} label="Transaction History" onPress={() => router.push('/wallet')} isLast />
                </Card>
              </View>

              <View>
                <Text
                  style={{
                    fontSize: typography.captionXs.fontSize,
                    lineHeight: typography.captionXs.lineHeight,
                    fontWeight: typography.heading.fontWeight,
                    color: currentTheme.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: spacing.lg,
                    marginLeft: spacing.sm,
                  }}
                >
                  Farm Management
                </Text>
                <Card style={{ overflow: 'hidden' }}>
                  <MenuItem icon={<FileText size={18} color={currentTheme.textTertiary} />} label={userRole === 'farmer' ? 'My Listings' : 'My Contracts'} onPress={() => userRole === 'farmer' ? router.push('/listings') : router.push('/contracts')} />
                  <MenuItem icon={<Heart size={18} color={currentTheme.textTertiary} />} label="My Favorites" onPress={() => router.push('/favorites')} />
                  <MenuItem icon={<Package size={18} color={currentTheme.textTertiary} />} label="Deliveries" onPress={() => router.push('/deliveries')} />
                  <MenuItem icon={<AlertTriangle size={18} color={currentTheme.textTertiary} />} label="Disputes" onPress={() => router.push('/disputes')} isLast />
                </Card>
              </View>

              <View>
                <Text
                  style={{
                    fontSize: typography.captionXs.fontSize,
                    lineHeight: typography.captionXs.lineHeight,
                    fontWeight: typography.heading.fontWeight,
                    color: currentTheme.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: spacing.lg,
                    marginLeft: spacing.sm,
                  }}
                >
                  {t('profile.settings')}
                </Text>
                <Card style={{ overflow: 'hidden' }}>
                  {/* Language Selector */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      borderBottomWidth: 1,
                      borderBottomColor: currentTheme.divider,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: radii.md,
                          backgroundColor: currentTheme.background,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Globe size={18} color={currentTheme.textTertiary} />
                      </View>
                      <Text
                        style={{
                          fontSize: typography.bodySm.fontSize,
                          lineHeight: typography.bodySm.lineHeight,
                          fontWeight: typography.title.fontWeight,
                          color: currentTheme.text,
                        }}
                      >
                        {t('profile.language')}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100],
                        borderRadius: radii.md,
                        padding: spacing.xs,
                        gap: spacing.xs,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => changeLanguage('en')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm + spacing.xs,
                          borderRadius: radii.sm,
                          backgroundColor: i18n.language === 'en' ? currentTheme.surface : 'transparent',
                          ...(i18n.language === 'en' ? getShadow('sm', isDark) : {}),
                          minHeight: 44,
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: typography.caption.fontSize,
                            lineHeight: typography.caption.lineHeight,
                            fontWeight: typography.heading.fontWeight,
                            color: i18n.language === 'en' ? currentTheme.primary : currentTheme.textTertiary,
                          }}
                        >
                          EN
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => changeLanguage('hi')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm + spacing.xs,
                          borderRadius: radii.sm,
                          backgroundColor: i18n.language === 'hi' ? currentTheme.surface : 'transparent',
                          ...(i18n.language === 'hi' ? getShadow('sm', isDark) : {}),
                          minHeight: 44,
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: typography.caption.fontSize,
                            lineHeight: typography.caption.lineHeight,
                            fontWeight: typography.heading.fontWeight,
                            color: i18n.language === 'hi' ? currentTheme.primary : currentTheme.textTertiary,
                          }}
                        >
                          हिन्दी
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Biometric Toggle */}
                  {biometricSupported && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: radii.md,
                            backgroundColor: currentTheme.background,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Fingerprint size={18} color={currentTheme.textTertiary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: typography.bodySm.fontSize,
                              lineHeight: typography.bodySm.lineHeight,
                              fontWeight: typography.title.fontWeight,
                              color: currentTheme.text,
                            }}
                          >
                            {t('profile.biometrics')}
                          </Text>
                          <Text
                            style={{
                              fontSize: typography.caption.fontSize,
                              lineHeight: typography.caption.lineHeight,
                              color: currentTheme.textTertiary,
                            }}
                          >
                            Use Face ID or Fingerprint
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={biometricEnabled}
                        onValueChange={toggleBiometric}
                        trackColor={{ false: isDark ? colors.neutral[700] : colors.neutral[200], true: currentTheme.primary }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor={isDark ? colors.neutral[700] : colors.neutral[200]}
                      />
                    </View>
                  )}
                </Card>
              </View>

              <View>
                <Text
                  style={{
                    fontSize: typography.captionXs.fontSize,
                    lineHeight: typography.captionXs.lineHeight,
                    fontWeight: typography.heading.fontWeight,
                    color: currentTheme.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: spacing.lg,
                    marginLeft: spacing.sm,
                  }}
                >
                  Support & Safety
                </Text>
                <Card style={{ overflow: 'hidden' }}>
                  <MenuItem icon={<Bell size={18} color={currentTheme.textTertiary} />} label="Notification Center" onPress={() => router.push('/notifications')} badge={unreadCounts.notifications} />
                  <MenuItem icon={<MessageSquare size={18} color={currentTheme.textTertiary} />} label="Messages" onPress={() => router.push('/chat')} badge={unreadCounts.chat} />
                  <MenuItem icon={<HelpCircle size={18} color={currentTheme.textTertiary} />} label="Help & Support" onPress={() => router.push('/help')} />
                  <MenuItem
                    icon={<Shield size={18} color={currentTheme.textTertiary} />}
                    label="Security & Verification"
                    onPress={() => router.push('/profile/kyc')}
                    isLast
                  />
                </Card>
              </View>

              {/* Logout Button */}
              <Button
                label="LOG OUT"
                onPress={handleLogout}
                variant="outline"
                size="lg"
                style={{
                  backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                  marginTop: spacing.md,
                }}
                labelStyle={{
                  color: isDark ? colors.error.dark : colors.error.light,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
                leftIcon={<LogOut size={18} color={isDark ? colors.error.dark : colors.error.light} />}
              />
            </View>

            {/* Footer */}
            <View style={{ marginTop: spacing['4xl'], marginBottom: spacing['3xl'], alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: typography.captionXs.fontSize,
                  lineHeight: typography.captionXs.lineHeight,
                  fontWeight: typography.heading.fontWeight,
                  color: isDark ? colors.neutral[700] : colors.neutral[300],
                  textTransform: 'uppercase',
                }}
              >
                FarmConnect Alpha v2.4.0
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

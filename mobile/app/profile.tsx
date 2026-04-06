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
import { useUserStore, useAuthStore, useRegistrationStore } from '../src/stores';
import { useUnreadCounts } from '../src/config/unread-context';
import { biometric } from '../src/utils/biometric';
import { haptic } from '../src/utils/haptics';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';

function SidebarItem({ icon, label, active = false, onPress, badge }: { icon: any; label: string; active?: boolean; onPress?: () => void; badge?: number }) {
  return (
    <TouchableOpacity onPress={onPress} className={`flex-row items-center px-4 py-3 rounded-lg ${active ? 'bg-primary/10' : ''}`}>
       <View className="mr-3">
          {React.cloneElement(icon, { color: active ? '#4cae4f' : '#608562', size: 18, strokeWidth: active ? 2.5 : 2 })}
       </View>
       <Text className={`flex-1 text-sm tracking-tight ${active ? 'font-bold text-primary' : 'font-medium text-gray-600 dark:text-gray-400'}`}>{label}</Text>
       {badge !== undefined && badge > 0 && (
         <View className="bg-red-500 rounded-full px-2 py-0.5 min-w-[20px] items-center">
           <Text className="text-[10px] font-bold text-white">{badge > 99 ? '99+' : badge}</Text>
         </View>
       )}
    </TouchableOpacity>
  );
}

function MenuItem({ icon, label, isLast = false, onPress, badge }: { icon: any; label: string; isLast?: boolean; onPress?: () => void; badge?: number }) {
  return (
    <TouchableOpacity onPress={onPress} className={`px-6 py-5 flex-row items-center justify-between ${!isLast ? 'border-b border-[#f6f7f6] dark:border-[#2a382a]/50' : ''}`}>
       <View className="flex-row items-center gap-4">
          {icon}
          <Text className="text-sm font-bold text-[#111811] dark:text-white uppercase tracking-tight">{label}</Text>
          {badge !== undefined && badge > 0 && (
            <View className="bg-red-500 rounded-full px-2 py-0.5 min-w-[20px] items-center">
              <Text className="text-[10px] font-bold text-white">{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
       </View>
       <ChevronRight size={14} color="#608562" opacity={0.5} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
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
    // Check biometric support
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

  const stats = [
    { label: 'Total Holdings', value: `${holdings?.totalAcres ?? 0} Acres`, icon: <Tractor size={20} color="#4cae4f" /> },
    { label: 'Lease Revenue', value: 'Coming Soon', icon: <TrendingUp size={20} color="#3b82f6" /> },
    { label: 'Wallet Balance', value: `₹${(wallet?.balance ?? 0).toLocaleString('en-IN')}`, icon: <Wallet size={20} color="#a855f7" /> },
  ];

  const Sidebar = () => (
    <View className="w-64 border-r border-[#eaf0ea] dark:border-[#2a382a] bg-white dark:bg-surface-dark px-4 py-8">
      <View className="flex-row items-center px-4 mb-10 gap-3">
        <View className="size-8 bg-primary rounded-lg items-center justify-center">
            <Tractor size={18} color="white" strokeWidth={2.5} />
        </View>
        <Text className="text-xl font-bold tracking-tighter dark:text-white uppercase">FarmConnect</Text>
      </View>
      
      <View className="gap-2">
        <SidebarItem icon={<LayoutDashboard />} label="Overview" onPress={() => router.push('/dashboard')} />
        <SidebarItem icon={<Map />} label="My Properties" onPress={() => userRole === 'farmer' ? router.push('/listings') : router.push('/contracts')} />
        <SidebarItem icon={<Compass />} label="Explore All" onPress={() => router.push('/marketplace')} />
        <SidebarItem icon={<MessageSquare />} label="Messages" onPress={() => router.push('/chat')} badge={unreadCounts.chat} />
        <SidebarItem icon={<Bell />} label="Notifications" onPress={() => router.push('/notifications')} badge={unreadCounts.notifications} />
        <SidebarItem icon={<User />} label="My Profile" active />
      </View>

      <View className="mt-auto pt-8 border-t border-[#eaf0ea] dark:border-[#2a382a]">
        <SidebarItem icon={<Wallet />} label="Wallet" onPress={() => router.push('/wallet')} />
        <SidebarItem icon={<LogOut />} label="Logout Portal" onPress={handleLogout} />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar barStyle="dark-content" />
      
      <Header
        variant="menu"
      />
      
      <View className="flex-1 flex-row">
        {isLargeScreen && <Sidebar />}

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className={`p-6 ${isLargeScreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
            
            {/* Page Title */}
            <View className="mb-8">
              <Text className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">
                {userRole === 'consumer' ? 'Investor Dashboard' : 'Farmer Dashboard'}
              </Text>
              <Text className="text-2xl font-bold text-[#111811] dark:text-white tracking-tighter uppercase">My Profile</Text>
            </View> 

            {/* Profile Hero Card */}
            <View className="bg-white dark:bg-surface-dark rounded-[32px] border border-[#eaf0ea] dark:border-[#2a382a] p-8 mb-8 flex-row items-center gap-8 shadow-sm">
                <View className="size-24 rounded-full border-4 border-background-light dark:border-background-dark overflow-hidden relative shadow-md">
                   <Image 
                    source={{ uri: authUser?.avatar_url || profile?.avatar || `https://i.pravatar.cc/300?u=${authUser?.id}` }} 
                    className="w-full h-full" 
                   />
                   <View className="absolute bottom-1 right-1 size-5 bg-primary rounded-full border-2 border-white items-center justify-center">
                      <Shield size={10} color="white" strokeWidth={3} />
                   </View>
                </View>
                <View className="flex-1">
                   <Text className="text-3xl font-bold text-[#111811] dark:text-white tracking-tighter uppercase">
                    {profile?.firstName || authUser?.name?.split(' ')[0] || 'User'} {profile?.lastName || authUser?.name?.split(' ').slice(1).join(' ') || ''}
                   </Text>
                   <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                      <View className="bg-primary/10 px-3 py-1 rounded-full">
                         <Text className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          {userRole === 'consumer' ? 'Premium Agri-Investor' : 'Verified Farmer'}
                         </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${
                        kycStatus === 'VERIFIED' ? 'bg-green-100 dark:bg-green-900/30' : 
                        kycStatus === 'SUBMITTED' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        kycStatus === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
                        'bg-red-100 dark:bg-red-900/30'
                      }`}>
                         <Text className={`text-[10px] font-bold uppercase ${
                          kycStatus === 'VERIFIED' ? 'text-green-700' : 
                          kycStatus === 'SUBMITTED' ? 'text-blue-700' :
                          kycStatus === 'PENDING' ? 'text-yellow-700' : 'text-red-700'
                         }`}>
                          KYC: {kycStatus}
                         </Text>
                      </View>
                   </View>
                </View>
            </View> 

            {/* Quick Stats Grid */}
            <View className="flex-row gap-4 mb-10 flex-wrap">
               {stats.map((stat, i) => (
                  <View key={i} className="flex-1 min-w-[200px] bg-white dark:bg-surface-dark p-6 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] shadow-sm">
                     <View className="size-10 bg-background-light dark:bg-background-dark rounded-xl items-center justify-center mb-4">
                        {stat.icon}
                     </View>
                     <Text className="text-[10px] font-bold text-[#608562] uppercase tracking-wider mb-1">{stat.label}</Text>
                     <Text className="text-xl font-bold text-[#111811] dark:text-white tracking-tight">{stat.value}</Text>
                  </View>
               ))}
            </View> 

            {/* Action Sections */}
            <View className="gap-8">
               <View>
                  <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4 ml-2">Financial Operations</Text>
                  <View className="bg-white dark:bg-surface-dark rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] overflow-hidden">
                     <MenuItem icon={<Wallet size={18} color="#608562" />} label="Wallet & Transactions" onPress={() => router.push('/wallet')} />
                     <MenuItem icon={<CreditCard size={18} color="#608562" />} label="Escrow Ledger" onPress={() => router.push('/contracts')} />
                     <MenuItem icon={<Clock size={18} color="#608562" />} label="Transaction History" onPress={() => router.push('/wallet')} isLast />
                  </View>
               </View>

               <View>
                  <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4 ml-2">Farm Management</Text>
                  <View className="bg-white dark:bg-surface-dark rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] overflow-hidden">
                     <MenuItem icon={<FileText size={18} color="#608562" />} label={userRole === 'farmer' ? 'My Listings' : 'My Contracts'} onPress={() => userRole === 'farmer' ? router.push('/listings') : router.push('/contracts')} />
                     <MenuItem icon={<Heart size={18} color="#608562" />} label="My Favorites" onPress={() => router.push('/favorites')} />
                     <MenuItem icon={<Package size={18} color="#608562" />} label="Deliveries" onPress={() => router.push('/deliveries')} />
                     <MenuItem icon={<AlertTriangle size={18} color="#608562" />} label="Disputes" onPress={() => router.push('/disputes')} isLast />
                  </View>
               </View>

               <View>
                  <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4 ml-2">{t('profile.settings')}</Text>
                  <View className="bg-white dark:bg-surface-dark rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] overflow-hidden">
                     <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#f6f7f6] dark:border-[#2a382a]/50">
                        <View className="flex-row items-center gap-3">
                           <View className="size-8 bg-background-light dark:bg-background-dark rounded-lg items-center justify-center">
                              <Globe size={18} color="#608562" />
                           </View>
                           <Text className="text-sm font-semibold text-slate-900 dark:text-white">{t('profile.language')}</Text>
                        </View>
                        <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                           <TouchableOpacity 
                            onPress={() => changeLanguage('en')}
                            className={`px-3 py-1.5 rounded-md ${i18n.language === 'en' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                           >
                              <Text className={`text-xs font-bold ${i18n.language === 'en' ? 'text-primary' : 'text-gray-500'}`}>EN</Text>
                           </TouchableOpacity>
                           <TouchableOpacity 
                            onPress={() => changeLanguage('hi')}
                            className={`px-3 py-1.5 rounded-md ${i18n.language === 'hi' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                           >
                              <Text className={`text-xs font-bold ${i18n.language === 'hi' ? 'text-primary' : 'text-gray-500'}`}>हिन्दी</Text>
                           </TouchableOpacity>
                        </View>
                     </View>

                     {biometricSupported && (
                       <View className="flex-row items-center justify-between px-4 py-3">
                          <View className="flex-row items-center gap-3 flex-1">
                             <View className="size-8 bg-background-light dark:bg-background-dark rounded-lg items-center justify-center">
                                <Fingerprint size={18} color="#608562" />
                             </View>
                             <View className="flex-1">
                                <Text className="text-sm font-semibold text-slate-900 dark:text-white">{t('profile.biometrics')}</Text>
                                <Text className="text-xs text-gray-500">Use Face ID or Fingerprint</Text>
                             </View>
                          </View>
                          <Switch
                            value={biometricEnabled}
                            onValueChange={toggleBiometric}
                            trackColor={{ false: '#e5e7eb', true: '#4cae4f' }}
                            thumbColor="#ffffff"
                            ios_backgroundColor="#e5e7eb"
                          />
                       </View>
                     )}
                  </View>
               </View>

               <View>
                  <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4 ml-2">Support & Safety</Text>
                  <View className="bg-white dark:bg-surface-dark rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] overflow-hidden">
                     <MenuItem icon={<Bell size={18} color="#608562" />} label="Notification Center" onPress={() => router.push('/notifications')} badge={unreadCounts.notifications} />
                     <MenuItem icon={<MessageSquare size={18} color="#608562" />} label="Messages" onPress={() => router.push('/chat')} badge={unreadCounts.chat} />
                     <MenuItem icon={<HelpCircle size={18} color="#608562" />} label="Help & Support" onPress={() => router.push('/help')} />
                     <MenuItem
                      icon={<Shield size={18} color="#608562" />}
                      label="Security & Verification"
                      onPress={() => router.push('/profile/kyc')}
                      isLast
                     />
                  </View>
               </View>

               <TouchableOpacity 
                className="bg-rose-500/10 h-14 rounded-xl items-center justify-center flex-row border border-rose-500/20 active:bg-rose-500/10 mt-4"
                onPress={handleLogout}
               >
                  <LogOut size={18} color="#ef4444" className="mr-3" />
                  <Text className="text-rose-600 font-bold text-sm uppercase tracking-wider">Log Out</Text>
               </TouchableOpacity>
            </View> 

            {/* Footer */}
            <View className="mt-16 mb-10 items-center">
               <Text className="text-[10px] font-bold text-gray-300 uppercase">FarmConnect Alpha v2.4.0</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

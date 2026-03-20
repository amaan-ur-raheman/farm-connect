import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import { 
  Settings, 
  LogOut, 
  Wallet, 
  Tractor, 
  LineChart, 
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
  User,
  Heart,
  Bell
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { useUserStore, useAuthStore } from '../src/stores';

function SidebarItem({ icon, label, active = false, onPress }: { icon: any; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className={`flex-row items-center px-4 py-3 rounded-lg ${active ? 'bg-primary/10' : ''}`}>
       <View className="mr-3">
          {React.cloneElement(icon, { color: active ? '#4cae4f' : '#608562', size: 18, strokeWidth: active ? 2.5 : 2 })}
       </View>
       <Text className={`text-sm tracking-tight ${active ? 'font-bold text-primary' : 'font-medium text-gray-600 dark:text-gray-400'}`}>{label}</Text>
    </TouchableOpacity>
  );
}

function MenuItem({ icon, label, isLast = false }: { icon: any; label: string; isLast?: boolean }) {
  return (
    <TouchableOpacity className={`px-6 py-5 flex-row items-center justify-between ${!isLast ? 'border-b border-[#f6f7f6] dark:border-[#2a382a]/50' : ''}`}>
       <View className="flex-row items-center gap-4">
          {icon}
          <Text className="text-sm font-bold text-[#111811] dark:text-white uppercase tracking-tight">{label}</Text>
       </View>
       <ChevronRight size={14} color="#608562" opacity={0.5} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isLargeScreen = windowWidth > 1024;

  const { profile, wallet, holdings } = useUserStore();
  const { userRole, logout } = useAuthStore();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          }
        },
      ]
    );
  };

  const stats = [
    { label: 'Total Holdings', value: `${holdings.totalAcres} Acres`, icon: <Tractor size={20} color="#4cae4f" /> },
    { label: 'Lease Revenue', value: `₹${(holdings.totalProperties * 42000).toLocaleString('en-IN')}`, icon: <TrendingUp size={20} color="#3b82f6" /> },
    { label: 'Wallet Balance', value: `₹${wallet.balance.toLocaleString('en-IN')}`, icon: <Wallet size={20} color="#a855f7" /> },
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
        <SidebarItem icon={<Map />} label="My Properties" />
        <SidebarItem icon={<Compass />} label="Explore All" />
        <SidebarItem icon={<MessageSquare />} label="Messages" />
        <SidebarItem icon={<User />} label="My Profile" active />
        <SidebarItem icon={<Heart />} label="Watchlist" />
      </View>

      <View className="mt-auto pt-8 border-t border-[#eaf0ea] dark:border-[#2a382a]">
        <SidebarItem icon={<Settings />} label="Control Panel" />
        <SidebarItem icon={<LogOut />} label="Logout Portal" onPress={handleLogout} />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <Header
        variant="menu"
        onAvatarPress={() => router.push('/marketplace')}
      />
      
      <View className="flex-1 flex-row">
        {isLargeScreen && <Sidebar />}

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className={`p-6 ${isLargeScreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
            
            {/* Page Title */}
            <View className="mb-8">
              <Text className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">
                {userRole === 'investor' ? 'Investor Dashboard' : 'Farmer Dashboard'}
              </Text>
              <Text className="text-2xl font-bold text-[#111811] dark:text-white tracking-tighter uppercase">My Profile</Text>
            </View> 

            {/* Profile Hero Card */}
            <View className="bg-white dark:bg-surface-dark rounded-[32px] border border-[#eaf0ea] dark:border-[#2a382a] p-8 mb-8 flex-row items-center gap-8 shadow-sm">
                <View className="size-24 rounded-full border-4 border-background-light dark:border-background-dark overflow-hidden relative shadow-md">
                   <Image 
                    source={{ uri: profile?.avatar || 'https://i.pravatar.cc/300?u=amaan' }} 
                    className="w-full h-full" 
                   />
                   <View className="absolute bottom-1 right-1 size-5 bg-primary rounded-full border-2 border-white items-center justify-center">
                      <Shield size={10} color="white" strokeWidth={3} />
                   </View>
                </View>
                <View className="flex-1">
                   <Text className="text-3xl font-bold text-[#111811] dark:text-white tracking-tighter uppercase">
                    {profile?.firstName || 'User'} {profile?.lastName || ''}
                   </Text>
                   <View className="flex-row items-center gap-2 mt-2">
                      <View className="bg-primary/10 px-3 py-1 rounded-full">
                         <Text className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          {userRole === 'investor' ? 'Premium Agri-Investor' : 'Verified Farmer'}
                         </Text>
                      </View>
                      <Text className="text-xs text-gray-400 font-medium italic">Verified since 2022</Text>
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
                     <MenuItem icon={<CreditCard size={18} color="#608562" />} label="Payment Methods" />
                     <MenuItem icon={<LineChart size={18} color="#608562" />} label="Yield Analytics" />
                     <MenuItem icon={<Clock size={18} color="#608562" />} label="Transaction History" isLast />
                  </View>
               </View>

               <View>
                  <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4 ml-2">Support & Safety</Text>
                  <View className="bg-white dark:bg-surface-dark rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a] overflow-hidden">
                     <MenuItem icon={<Bell size={18} color="#608562" />} label="Notification Center" />
                     <MenuItem icon={<MessageSquare size={18} color="#608562" />} label="Live Farm Support" />
                     <MenuItem icon={<HelpCircle size={18} color="#608562" />} label="Security & Verification" isLast />
                  </View>
               </View>

               <TouchableOpacity 
                className="bg-rose-500/10 h-14 rounded-xl items-center justify-center flex-row border border-rose-500/20 active:bg-rose-500/10 mt-4"
                onPress={handleLogout}
               >
                  <LogOut size={18} color="#ef4444" className="mr-3" />
                  <Text className="text-rose-600 font-bold text-sm uppercase tracking-wider">Terminate Session</Text>
               </TouchableOpacity>
            </View> 

            {/* Footer */}
            <View className="mt-16 mb-10 items-center">
               <Text className="text-[10px] font-bold text-gray-300 uppercase letter-spacing-[2px]">FarmConnect Alpha v2.4.0</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

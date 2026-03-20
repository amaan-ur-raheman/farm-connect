import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  StatusBar,
  TextInput,
  Dimensions
} from 'react-native';
import { 
  Search, 
  Filter, 
  MapPin, 
  Grid3X3,
  List,
  Tractor, 
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  ShieldCheck,
  Wifi,
  Droplets,
  Plus,
  Minus,
  Locate
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Button } from '../src/components/ui/Button';

const { width } = Dimensions.get('window');

const MARKETPLACE_DATA = [
  {
    id: '1',
    title: 'Sahyadri Vineyards',
    location: 'Nashik, Maharashtra',
    price: '₹25,000',
    size: '45 Acres',
    soil: 'Class A',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800',
    verified: true,
    remoteReady: true,
    rating: 4.9,
    type: 'Grape Asset'
  },
  {
    id: '2',
    title: 'Sutlej River Farms',
    location: 'Ludhiana, Punjab',
    price: '₹18,000',
    size: '120 Acres',
    soil: 'Class B',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=800',
    newListing: true,
    rating: 4.7,
    type: 'Cereal Farm'
  },
  {
    id: '3',
    title: 'Haryana Gold Fields',
    location: 'Karnal, Haryana',
    price: '₹50,000',
    size: '300 Acres',
    soil: 'Class A+',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800',
    verified: true,
    rating: 4.8,
    type: 'Cash Crop'
  },
  {
    id: '4',
    title: 'Deccan Plateau Land',
    location: 'Guntur, Andhra Pradesh',
    price: '₹15,000',
    size: '80 Acres',
    soil: 'Clay Loam',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800',
    irrigated: true,
    rating: 4.6,
    type: 'Mixed Farm'
  }
];

export default function MarketplaceScreen() {
  const [activeTab, setActiveTab] = useState('Marketplace');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);

  const userImage = { uri: 'https://i.pravatar.cc/100?u=amaan' };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />

      {/* Header - Using unified Header component */}
      <Header
        variant="menu"
        userImage={userImage}
        showSearch={showSearch}
        onSearchToggle={() => setShowSearch(!showSearch)}
        onAvatarPress={() => router.push('/profile')}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Map Section - Matching HTML Reference */}
          <View className="relative w-full h-[300px] lg:h-[450px] bg-[#eaf0ea] dark:bg-[#2a352a] overflow-hidden">
             <Image 
               source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2940' }} 
               className="w-full h-full opacity-60"
               resizeMode="cover"
             />
             {/* Price Pins */}
             <View className="absolute top-[20%] left-[25%] bg-white dark:bg-[#1e291e] px-3 py-1.5 rounded-lg shadow-lg border border-[#4cae4f]">
                <Text className="text-xs font-bold text-[#111811] dark:text-white">₹25,000/mo</Text>
                <View className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-[#1e291e] border-r border-b border-[#4cae4f] rotate-45" />
             </View>
             <View className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-[#4cae4f] px-3 py-1.5 rounded-lg shadow-lg border-2 border-white">
                <Text className="text-xs font-bold text-white">₹50,000/mo</Text>
                <View className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#4cae4f] border-r border-b border-white rotate-45" />
             </View>
             <View className="absolute bottom-[25%] right-[20%] bg-white dark:bg-[#1e291e] px-3 py-1.5 rounded-lg shadow-lg border border-[#4cae4f]">
                <Text className="text-xs font-bold text-[#111811] dark:text-white">₹18,000/mo</Text>
                <View className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-[#1e291e] border-r border-b border-[#4cae4f] rotate-45" />
             </View>

             {/* Quick Map Controls - Matching HTML */}
             <View className="absolute bottom-6 right-6 flex-col gap-2">
                <View className="bg-white dark:bg-[#1e291e] rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                   <TouchableOpacity className="p-2.5 border-b border-gray-100 dark:border-gray-700">
                      <Plus size={18} color="#111811" className="dark:text-white" />
                   </TouchableOpacity>
                   <TouchableOpacity className="p-2.5">
                      <Minus size={18} color="#111811" className="dark:text-white" />
                   </TouchableOpacity>
                </View>
                <TouchableOpacity className="bg-white dark:bg-[#1e291e] p-2.5 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800">
                   <Locate size={18} color="#111811" className="dark:text-white" />
                </TouchableOpacity>
             </View>
          </View>

          {/* Discovery Area */}
          <View className="px-4 md:px-10 lg:px-40 py-8">
             {/* Results Header with View Toggle & Sort - Matching HTML */}
             <View className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <View>
                   <Text className="text-2xl font-bold text-[#111811] dark:text-white">Find your perfect plot</Text>
                   <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Showing 124 properties in Nashik Region</Text>
                </View>
                
                <View className="flex-row items-center gap-3 bg-white dark:bg-[#1e291e] p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                   <TouchableOpacity 
                     onPress={() => setViewMode('grid')}
                     className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#4cae4f]/10 text-[#4cae4f]' : ''}`}
                   >
                      <Grid3X3 size={18} />
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => setViewMode('list')}
                     className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#4cae4f]/10 text-[#4cae4f]' : ''}`}
                   >
                      <List size={18} />
                   </TouchableOpacity>
                   
                   <View className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                   
                   <TouchableOpacity className="flex-row items-center gap-1 px-3 py-2">
                      <Text className="text-sm font-medium text-[#111811] dark:text-white">Sort by: Featured</Text>
                      <ChevronDown size={14} color="#111811" className="dark:text-white" />
                   </TouchableOpacity>
                </View>
             </View>

             {/* In-View Search & Filters - Matching HTML Reference */}
             <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-800 mb-8">
                <View className="relative mb-4">
                   <View className="absolute left-3 top-2.5 z-10">
                      <MapPin size={18} color="#94a3b8" />
                   </View>
                   <TextInput 
                      className="w-full pl-10 pr-4 py-2 bg-[#f9fbf9] dark:bg-[#151d15] border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      placeholder="Pincode or City"
                      placeholderTextColor="#94a3b8"
                   />
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 hide-scrollbar">
                   <TouchableOpacity className="flex-row items-center gap-1 px-3 py-2 bg-[#f9fbf9] dark:bg-[#151d15] border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Text className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Radius: 50km</Text>
                      <ChevronDown size={12} color="#94a3b8" />
                   </TouchableOpacity>
                   <TouchableOpacity className="flex-row items-center gap-1 px-3 py-2 bg-[#f9fbf9] dark:bg-[#151d15] border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Text className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Acres: 10-100</Text>
                      <ChevronDown size={12} color="#94a3b8" />
                   </TouchableOpacity>
                   <TouchableOpacity className="flex-row items-center gap-1 px-3 py-2 bg-[#f9fbf9] dark:bg-[#151d15] border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Text className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Budget: ₹10k-₹50k</Text>
                      <ChevronDown size={12} color="#94a3b8" />
                   </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center gap-1 px-3 py-2 bg-[#f9fbf9] dark:bg-[#151d15] border border-gray-200 dark:border-gray-700 rounded-lg">
                       <Filter size={14} color="#4cae4f" />
                       <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">More</Text>
                    </TouchableOpacity>
                </ScrollView>
             </View>

             {/* Property Grid - 4 Column Layout Matching HTML */}
             <View className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {MARKETPLACE_DATA.map((item) => (
                   <TouchableOpacity 
                     key={item.id} 
                     onPress={() => router.push(`/property/${item.id}`)}
                     className="bg-white dark:bg-[#1e291e] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                   >
                      <View className="relative aspect-[4/3]">
                         {/* Badges */}
                         <View className="absolute top-3 left-3 z-10 flex-row gap-2">
                            {item.verified && (
                              <View className="bg-[#4cae4f]/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex-row items-center gap-1">
                                 <ShieldCheck size={10} color="white" />
                                 <Text className="text-[10px] font-bold text-white">Verified Soil</Text>
                              </View>
                            )}
                            {item.newListing && (
                              <View className="bg-[#f59e0b]/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                                 <Text className="text-[10px] font-bold text-white">New Listing</Text>
                              </View>
                            )}
                            {item.remoteReady && (
                              <View className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex-row items-center gap-1">
                                 <Wifi size={10} color="#111811" />
                                 <Text className="text-[10px] font-medium text-[#111811]">Remote Ready</Text>
                              </View>
                            )}
                            {item.irrigated && (
                              <View className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex-row items-center gap-1">
                                 <Droplets size={10} color="#111811" />
                                 <Text className="text-[10px] font-medium text-[#111811]">Irrigated</Text>
                              </View>
                            )}
                         </View>

                         {/* Favorite Button */}
                         <TouchableOpacity 
                           onPress={() => toggleFavorite(item.id)}
                           className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/20 backdrop-blur-sm"
                         >
                            <Heart size={16} color="white" fill={favorites.has(item.id) ? '#ef4444' : 'transparent'} />
                         </TouchableOpacity>
                         
                         <Image source={{ uri: item.image }} className="w-full h-full" />
                      </View>

                      <View className="p-4">
                         <View className="flex-row justify-between items-start mb-2">
                            <View className="flex-1 mr-2">
                               <Text className="font-bold text-base text-[#111811] dark:text-white truncate">{item.title}</Text>
                               <View className="flex-row items-center mt-0.5">
                                  <MapPin size={12} color="#6b7280" />
                                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">{item.location}</Text>
                               </View>
                            </View>
                            <View className="text-right">
                               <Text className="text-base font-bold text-[#4cae4f]">{item.price}<Text className="text-xs font-normal text-gray-500">/mo</Text></Text>
                            </View>
                         </View>

                         {/* Property Specs Grid */}
                         <View className="flex-row gap-2 my-3">
                            <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] p-2 rounded text-center">
                               <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Size</Text>
                               <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.size}</Text>
                            </View>
                            <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] p-2 rounded text-center">
                               <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Soil</Text>
                               <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.soil}</Text>
                            </View>
                         </View>

                         <Button 
                           title="View Details" 
                           onPress={() => router.push(`/property/${item.id}`)}
                           variant="outline"
                           className="w-full py-2.5 rounded-lg border-[#4cae4f] border"
                           textClassName="text-[#4cae4f] font-bold text-xs uppercase"
                         />
                      </View>
                   </TouchableOpacity>
                ))}
             </View>

             {/* Pagination - Matching HTML Reference */}
             <View className="flex flex-row items-center justify-center gap-2 mt-12">
                <TouchableOpacity className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a352a]">
                   <ChevronLeft size={18} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity className="w-10 h-10 rounded-lg bg-[#4cae4f] text-white font-bold text-sm flex items-center justify-center">
                   <Text className="text-white font-bold text-sm">1</Text>
                </TouchableOpacity>
                <TouchableOpacity className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a352a]">
                   <Text className="text-gray-700 dark:text-gray-300 font-bold text-sm text-center leading-10">2</Text>
                </TouchableOpacity>
                <TouchableOpacity className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a352a]">
                   <Text className="text-gray-700 dark:text-gray-300 font-bold text-sm text-center leading-10">3</Text>
                </TouchableOpacity>
                <Text className="text-gray-400 px-2">...</Text>
                <TouchableOpacity className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a352a]">
                   <Text className="text-gray-700 dark:text-gray-300 font-bold text-sm text-center leading-10">12</Text>
                </TouchableOpacity>
                <TouchableOpacity className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a352a]">
                   <ChevronRight size={18} color="#6b7280" />
                </TouchableOpacity>
             </View>
          </View>
       </ScrollView>

       {/* Bottom Navigation - Matching HTML */}
       <View className="absolute bottom-6 left-4 right-4 bg-[#111811] dark:bg-white h-16 rounded-2xl items-center justify-around px-6 shadow-2xl flex-row">
          <TouchableOpacity 
            onPress={() => setActiveTab('Marketplace')}
            className="items-center"
          >
             <View className={`size-1.5 rounded-full mb-1 ${activeTab === 'Marketplace' ? 'bg-[#4cae4f]' : 'bg-transparent'}`} />
             <Grid3X3 size={22} color={activeTab === 'Marketplace' ? '#4cae4f' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('My Leases')}
            className="items-center"
          >
             <View className={`size-1.5 rounded-full mb-1 ${activeTab === 'My Leases' ? 'bg-[#4cae4f]' : 'bg-transparent'}`} />
             <Tractor size={22} color={activeTab === 'My Leases' ? '#4cae4f' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setActiveTab('Management');
              router.push('/dashboard');
            }}
            className="items-center"
          >
             <View className={`size-1.5 rounded-full mb-1 ${activeTab === 'Management' ? 'bg-[#4cae4f]' : 'bg-transparent'}`} />
             <List size={22} color={activeTab === 'Management' ? '#4cae4f' : '#6b7280'} />
          </TouchableOpacity>
       </View>
     </View>
   );
}

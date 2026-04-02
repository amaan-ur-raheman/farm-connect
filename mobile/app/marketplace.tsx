import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { 
  Search, 
  MapPin, 
  Grid3X3,
  List,
  Tractor, 
  Heart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Droplets,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import { Button } from '../src/components/ui/Button';
import { useMarketplaceStore } from '../src/stores';
import api, { Listing } from '../src/config/api';

const mapListingToProperty = (listing: Listing) => ({
  id: listing.id,
  title: listing.name,
  location: listing.location_name,
  price: `₹${listing.price_per_acre.toLocaleString('en-IN')}`,
  size: `${listing.area_acres} Acres`,
  soil: listing.soil_type || '',
  image: listing.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800',
  verified: listing.farmer?.kyc_status === 'VERIFIED',
  remoteReady: listing.is_organic,
  newListing: listing.status === 'ACTIVE',
  irrigated: !!listing.irrigation_type,
  rating: 4.5,
  type: listing.crops?.[0] || 'Farm',
  isOrganic: listing.is_organic,
});

export default function MarketplaceScreen() {
  const [activeTab, setActiveTab] = React.useState('Marketplace');
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const { 
    viewMode, 
    setViewMode,
    toggleFavorite,
    isFavorite,
    currentPage,
    setCurrentPage,
    setProperties,
    setIsLoading,
    isLoading,
  } = useMarketplaceStore();

  const fetchListings = useCallback(async (page = 1, search?: string, filter?: string | null) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '12');
      params.set('page', page.toString());
      if (search) params.set('search', search);
      if (filter === 'organic') params.set('is_organic', 'true');
      if (filter === 'price_low') params.set('sort', 'price_asc');
      if (filter === 'price_high') params.set('sort', 'price_desc');
      if (filter === 'newest') params.set('sort', 'newest');

      const response = await api.get<{ data: Listing[]; pagination: { total: number; pages: number } }>(`/api/listings?${params.toString()}`);
      const result = response.data;
      setListings(result.data || []);
      setProperties(result.data?.map(mapListingToProperty) || []);
      setTotalCount(result.pagination?.total || 0);
      setTotalPages(result.pagination?.pages || 1);
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setProperties]);

  useEffect(() => {
    fetchListings(currentPage);
  }, [currentPage, fetchListings]);

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchListings(1, searchQuery, activeFilter).finally(() => setRefreshing(false));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchListings(1, searchQuery, activeFilter);
  };

  const handleFilterChange = (filter: string) => {
    const newFilter = activeFilter === filter ? null : filter;
    setActiveFilter(newFilter);
    setCurrentPage(1);
    fetchListings(1, searchQuery, newFilter);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchListings(page, searchQuery, activeFilter);
  };

  const filterOptions = [
    { key: 'organic', label: 'Organic' },
    { key: 'newest', label: 'Newest' },
    { key: 'price_low', label: 'Price: Low' },
    { key: 'price_high', label: 'Price: High' },
  ];

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />

      <Header
        variant="menu"
        onAvatarPress={() => router.push('/profile')}
      />

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />
        }
      >
          {/* Map Section */}
          <View className="relative w-full h-[200px] bg-[#eaf0ea] dark:bg-[#2a352a] overflow-hidden">
             <Image 
               source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2940' }} 
               className="w-full h-full opacity-60"
               resizeMode="cover"
             />
             {listings.slice(0, 3).map((listing, i) => (
               <View 
                 key={listing.id}
                 className="absolute bg-white dark:bg-[#1e291e] px-3 py-1.5 rounded-lg shadow-lg border border-[#4cae4f]"
                 style={{ top: `${20 + i * 25}%`, left: `${15 + i * 30}%` }}
               >
                 <Text className="text-xs font-bold text-[#111811] dark:text-white">
                   ₹{(listing.price_per_acre / 1000).toFixed(0)}k/acre
                 </Text>
               </View>
             ))}
          </View>

          {/* Discovery Area */}
          <View className="px-4 py-8">
             {/* Results Header */}
             <View className="flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <View>
                   <Text className="text-2xl font-bold text-[#111811] dark:text-white">Find your perfect plot</Text>
                   <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                     {isLoading ? 'Loading...' : `Showing ${listings.length} of ${totalCount} properties`}
                   </Text>
                </View>
                
                <View className="flex-row items-center gap-3 bg-white dark:bg-[#1e291e] p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                   <TouchableOpacity 
                     onPress={() => setViewMode('grid')}
                     className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#4cae4f]/10' : ''}`}
                   >
                      <Grid3X3 size={18} color={viewMode === 'grid' ? '#4cae4f' : '#6b7280'} />
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => setViewMode('list')}
                     className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#4cae4f]/10' : ''}`}
                   >
                      <List size={18} color={viewMode === 'list' ? '#4cae4f' : '#6b7280'} />
                   </TouchableOpacity>
                </View>
             </View>

             {/* Search & Filters */}
             <View className="bg-white dark:bg-[#1e291e] rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-800 mb-8">
                <View className="flex-row items-center gap-2 mb-4">
                   <View className="flex-1 flex-row items-center bg-[#f9fbf9] dark:bg-[#151d15] border border-gray-200 dark:border-gray-700 rounded-lg px-3">
                      <MapPin size={18} color="#94a3b8" />
                      <TextInput 
                        className="flex-1 py-2.5 px-2 text-sm"
                        placeholder="Search farms, crops, or locations..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                      />
                      {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); fetchListings(1); }}>
                          <X size={18} color="#94a3b8" />
                        </TouchableOpacity>
                      )}
                   </View>
                   <TouchableOpacity onPress={handleSearch} className="bg-[#4cae4f] p-2.5 rounded-lg">
                      <Search size={18} color="white" />
                   </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                   {filterOptions.map((option) => (
                     <TouchableOpacity
                       key={option.key}
                       onPress={() => handleFilterChange(option.key)}
                       className={`flex-row items-center gap-1 px-3 py-2 rounded-lg border ${
                         activeFilter === option.key
                           ? 'bg-[#4cae4f] border-[#4cae4f]'
                           : 'bg-[#f9fbf9] dark:bg-[#151d15] border-gray-200 dark:border-gray-700'
                       }`}
                     >
                        <Text className={`text-xs font-medium ${
                          activeFilter === option.key ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {option.label}
                        </Text>
                     </TouchableOpacity>
                   ))}
                </ScrollView>
             </View>

             {/* Property Grid */}
             {isLoading && listings.length === 0 ? (
               <View className="flex items-center justify-center py-20">
                 <ActivityIndicator size="large" color="#4cae4f" />
                 <Text className="text-sm text-gray-500 mt-3">Loading listings...</Text>
               </View>
             ) : listings.length === 0 ? (
               <View className="flex items-center justify-center py-20">
                 <Text className="text-4xl mb-4">🌾</Text>
                 <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">No listings found</Text>
                 <Text className="text-sm text-gray-500 text-center px-8">
                   Try adjusting your search or filters to find more properties.
                 </Text>
                 <TouchableOpacity 
                   onPress={() => { setSearchQuery(''); setActiveFilter(null); fetchListings(1); }}
                   className="mt-4 bg-[#4cae4f] px-6 py-2 rounded-xl"
                 >
                   <Text className="text-white font-bold text-sm">Clear Filters</Text>
                 </TouchableOpacity>
               </View>
             ) : (
             <View className={`gap-4 ${viewMode === 'grid' ? 'flex-row flex-wrap' : 'flex-col'}`}>
                 {listings.map((item: Listing) => {
                   const prop = mapListingToProperty(item);
                   return (
                     <TouchableOpacity 
                       key={item.id} 
                       onPress={() => router.push(`/property/${item.id}`)}
                       className={`bg-white dark:bg-[#1e291e] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm ${
                         viewMode === 'grid' ? 'w-[48%]' : 'w-full'
                       }`}
                     >
                        <View className="relative aspect-[4/3]">
                           <View className="absolute top-3 left-3 z-10 flex-row gap-2">
                              {prop.verified && (
                                <View className="bg-[#4cae4f]/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex-row items-center gap-1">
                                   <ShieldCheck size={10} color="white" />
                                   <Text className="text-[10px] font-bold text-white">Verified</Text>
                                </View>
                              )}
                              {prop.newListing && (
                                <View className="bg-[#f59e0b]/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                                   <Text className="text-[10px] font-bold text-white">New</Text>
                                </View>
                              )}
                              {prop.irrigated && (
                                <View className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex-row items-center gap-1">
                                   <Droplets size={10} color="#111811" />
                                   <Text className="text-[10px] font-medium text-[#111811]">Irrigated</Text>
                                </View>
                              )}
                           </View>
                           <TouchableOpacity 
                             onPress={() => toggleFavorite(item.id)}
                             className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/20 backdrop-blur-sm"
                           >
                              <Heart size={16} color="white" fill={isFavorite(item.id) ? '#ef4444' : 'transparent'} />
                           </TouchableOpacity>
                          <Image source={{ uri: prop.image }} className="w-full h-full" />
                        </View>

                        <View className="p-4">
                           <View className="flex-row justify-between items-start mb-2">
                              <View className="flex-1 mr-2">
                                 <Text className="font-bold text-base text-[#111811] dark:text-white" numberOfLines={1}>{prop.title}</Text>
                                 <View className="flex-row items-center mt-0.5">
                                    <MapPin size={12} color="#6b7280" />
                                    <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1" numberOfLines={1}>{prop.location}</Text>
                                 </View>
                              </View>
                              <Text className="text-base font-bold text-[#4cae4f]">{prop.price}</Text>
                           </View>

                           <View className="flex-row gap-2 my-3">
                              <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] p-2 rounded">
                                 <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Size</Text>
                                 <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{prop.size}</Text>
                              </View>
                              <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] p-2 rounded">
                                 <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Soil</Text>
                                 <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300" numberOfLines={1}>{prop.soil || 'N/A'}</Text>
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
                   );
                 })}
             </View>
             )}

             {/* Pagination */}
             {totalPages > 1 && (
               <View className="flex-row items-center justify-center gap-2 mt-12">
                 <TouchableOpacity 
                   onPress={() => handlePageChange(currentPage - 1)}
                   disabled={currentPage <= 1}
                   className={`p-2 rounded-lg border ${currentPage <= 1 ? 'opacity-30' : ''}`}
                   style={{ borderColor: '#e5e7eb' }}
                 >
                    <ChevronLeft size={18} color="#6b7280" />
                 </TouchableOpacity>
                 {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                   let page: number;
                   if (totalPages <= 5) {
                     page = i + 1;
                   } else if (currentPage <= 3) {
                     page = i + 1;
                   } else if (currentPage >= totalPages - 2) {
                     page = totalPages - 4 + i;
                   } else {
                     page = currentPage - 2 + i;
                   }
                   return (
                     <TouchableOpacity
                       key={page}
                       onPress={() => handlePageChange(page)}
                       className={`w-10 h-10 rounded-lg items-center justify-center ${
                         currentPage === page ? 'bg-[#4cae4f]' : 'border border-gray-200 dark:border-gray-700'
                       }`}
                     >
                       <Text className={`font-bold text-sm ${currentPage === page ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                         {page}
                       </Text>
                     </TouchableOpacity>
                   );
                 })}
                 <TouchableOpacity 
                   onPress={() => handlePageChange(currentPage + 1)}
                   disabled={currentPage >= totalPages}
                   className={`p-2 rounded-lg border ${currentPage >= totalPages ? 'opacity-30' : ''}`}
                   style={{ borderColor: '#e5e7eb' }}
                 >
                    <ChevronRight size={18} color="#6b7280" />
                 </TouchableOpacity>
              </View>
             )}
          </View>
       </ScrollView>

       {/* Bottom Navigation */}
       <View className="absolute bottom-6 left-4 right-4 bg-[#111811] dark:bg-white h-16 rounded-2xl items-center justify-around px-6 shadow-2xl flex-row">
          <TouchableOpacity 
            onPress={() => setActiveTab('Marketplace')}
            className="items-center"
          >
             <View className={`size-1.5 rounded-full mb-1 ${activeTab === 'Marketplace' ? 'bg-[#4cae4f]' : 'bg-transparent'}`} />
             <Grid3X3 size={22} color={activeTab === 'Marketplace' ? '#4cae4f' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setActiveTab('Contracts'); router.push('/contracts'); }}
            className="items-center"
          >
             <View className={`size-1.5 rounded-full mb-1 ${activeTab === 'Contracts' ? 'bg-[#4cae4f]' : 'bg-transparent'}`} />
             <Tractor size={22} color={activeTab === 'Contracts' ? '#4cae4f' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setActiveTab('Management'); router.push('/dashboard'); }}
            className="items-center"
          >
             <View className={`size-1.5 rounded-full mb-1 ${activeTab === 'Management' ? 'bg-[#4cae4f]' : 'bg-transparent'}`} />
             <List size={22} color={activeTab === 'Management' ? '#4cae4f' : '#6b7280'} />
          </TouchableOpacity>
       </View>
     </View>
   );
}

# Investor Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dedicated dashboard for investors (consumers) to track their investments, returns, and farm updates.

**Architecture:** 
- **Backend**: Add a stats aggregation service for consumers to provide high-level metrics.
- **Mobile**: Create a new `investor-dashboard.tsx` screen and update navigation logic to route investors there by default.

**Tech Stack:** React Native, Expo, Node.js, Express, Prisma.

---

### Task 1: Backend Investor Stats Aggregation

**Files:**
- Modify: `backend/src/modules/contract/contract.service.ts`
- Modify: `backend/src/modules/contract/contract.controller.ts`
- Modify: `backend/src/modules/contract/contract.routes.ts`

- [ ] **Step 1: Implement `getConsumerStats` in `contract.service.ts`**

```typescript
export const getConsumerStats = async (consumerId: string) => {
  const contracts = await prisma.contract.findMany({
    where: { consumer_id: consumerId },
    include: {
      deliveries: { where: { status: 'VERIFIED' } },
    },
  });

  const totalInvested = contracts
    .filter(c => ['ACTIVE', 'COMPLETED'].includes(c.status))
    .reduce((sum, c) => sum + c.total_amount, 0);

  const activeInvestments = contracts.filter(c => c.status === 'ACTIVE').length;

  const totalYield = contracts.reduce((sum, c) => {
    const contractYield = c.deliveries.reduce((ySum, d) => ySum + (d.yield_amount_kg || 0), 0);
    return sum + contractYield;
  }, 0);

  const recentUpdates = await prisma.farmUpdate.findMany({
    where: { contract: { consumer_id: consumerId } },
    include: { 
      contract: { include: { listing: { select: { name: true } } } },
      farmer: { select: { name: true, avatar_url: true } }
    },
    orderBy: { created_at: 'desc' },
    take: 5,
  });

  return {
    totalInvested,
    activeInvestments,
    totalYield,
    recentUpdates,
  };
};
```

- [ ] **Step 2: Add `getConsumerStatsHandler` in `contract.controller.ts`**

```typescript
export const getConsumerStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const stats = await getConsumerStats(req.user!.userId);
  res.json({ success: true, data: stats });
});
```

- [ ] **Step 3: Register route in `contract.routes.ts`**

```typescript
contractRouter.get('/consumer/stats', authenticate, getConsumerStatsHandler);
```

- [ ] **Step 4: Commit backend changes**

```bash
git add backend/src/modules/contract/
git commit -m "feat(backend): add investor stats aggregation endpoint"
```

### Task 2: Mobile Navigation & Routing

**Files:**
- Modify: `mobile/app/index.tsx`
- Modify: `mobile/app/marketplace.tsx`

- [ ] **Step 1: Update routing in `mobile/app/index.tsx`**

```tsx
// Change 'investor' route from '/marketplace' to '/investor-dashboard'
if (userRole === 'investor') {
  router.replace('/investor-dashboard');
}
```

- [ ] **Step 2: Update bottom nav in `mobile/app/marketplace.tsx`**

```tsx
// Update the 'Management' tab to route to /investor-dashboard for investors
<TouchableOpacity 
  onPress={() => { 
    setActiveTab('Management'); 
    router.push(userRole === 'investor' ? '/investor-dashboard' : '/dashboard'); 
  }}
  className="items-center"
>
```

- [ ] **Step 3: Commit navigation changes**

```bash
git add mobile/app/index.tsx mobile/app/marketplace.tsx
git commit -m "feat(mobile): route investors to investor-dashboard by default"
```

### Task 3: Mobile Investor Dashboard UI

**Files:**
- Create: `mobile/app/investor-dashboard.tsx`

- [ ] **Step 1: Implement the Investor Dashboard Screen**

```tsx
// mobile/app/investor-dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { TrendingUp, Wallet, Package, ChevronRight, Bell, MapPin, Sprout } from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '../src/components/ui/Header';
import api from '../src/config/api';
import { useAuthStore } from '../src/stores';

export default function InvestorDashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/contracts/consumer/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch investor stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats().finally(() => setRefreshing(false));
  };

  if (loading && !refreshing) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4cae4f" /></View>;
  }

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <Header variant="menu" onAvatarPress={() => router.push('/profile')} />
      
      <ScrollView 
        className="flex-1" 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      >
        <View className="p-4">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Investment Overview</Text>
          
          {/* Stats Grid */}
          <View className="flex-row gap-3 mb-8">
            <View className="flex-1 bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a]">
              <TrendingUp size={20} color="#4cae4f" className="mb-2" />
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Invested</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">₹{stats?.totalInvested?.toLocaleString()}</Text>
            </View>
            <View className="flex-1 bg-white dark:bg-[#1e291e] p-4 rounded-2xl border border-[#eaf0ea] dark:border-[#2a382a]">
              <Sprout size={20} color="#3b82f6" className="mb-2" />
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Active Farms</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">{stats?.activeInvestments}</Text>
            </View>
          </View>

          {/* Recent Updates */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Farm Updates</Text>
              <TouchableOpacity onPress={() => router.push('/contracts')}>
                <Text className="text-xs font-bold text-[#4cae4f]">View My Farms</Text>
              </TouchableOpacity>
            </View>
            
            {stats?.recentUpdates?.length === 0 ? (
              <View className="bg-white dark:bg-[#1e291e] p-8 rounded-2xl items-center border border-[#eaf0ea] dark:border-[#2a382a]">
                <Text className="text-gray-400 text-sm">No updates from your farms yet.</Text>
              </View>
            ) : (
              stats?.recentUpdates?.map((update: any) => (
                <TouchableOpacity 
                  key={update.id} 
                  onPress={() => router.push(`/updates/${update.contract_id}`)}
                  className="bg-white dark:bg-[#1e291e] p-4 rounded-2xl mb-3 border border-[#eaf0ea] dark:border-[#2a382a] flex-row gap-4"
                >
                  <Image source={{ uri: update.media_url }} className="size-16 rounded-lg" />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{update.contract.listing.name}</Text>
                    <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>{update.caption}</Text>
                    <Text className="text-[10px] text-gray-400 mt-2">{new Date(update.created_at).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity onPress={() => router.push('/marketplace')} className="bg-[#4cae4f] p-4 rounded-2xl flex-1 items-center">
              <Text className="text-white font-bold">Invest More</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/wallet')} className="bg-slate-900 dark:bg-white p-4 rounded-2xl flex-1 items-center">
              <Text className="text-white dark:text-slate-900 font-bold">Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Commit mobile dashboard**

```bash
git add mobile/app/investor-dashboard.tsx
git commit -m "feat(mobile): implement investor dashboard screen"
```

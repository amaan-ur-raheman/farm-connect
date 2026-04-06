import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, TextInput as RNTextInput, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Wallet, ArrowUpRight, ArrowDownLeft, ChevronLeft, CreditCard } from 'lucide-react-native';
import { router } from 'expo-router';
import api, { WalletTransaction, WalletBalance } from '../src/config/api';
import { useAuthStore } from '../src/stores/authStore';
import { Input } from '../src/components/ui/Input';
import { useQuery } from '@tanstack/react-query';
import { WalletBalanceResponseSchema, WalletTransactionsResponseSchema } from '../src/config/schemas';
import { haptic } from '../src/utils/haptics';

export default function WalletScreen() {
  const { userRole } = useAuthStore();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const withdrawRef = useRef<RNTextInput>(null);

  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance, isRefetching: isRefetchingBalance } = useQuery({
    queryKey: ['walletBalance', 'wallet'],
    queryFn: async () => {
      const res = await api.get('/api/wallet/balance', undefined, WalletBalanceResponseSchema);
      return res.data.data;
    },
  });

  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx, isRefetching: isRefetchingTx } = useQuery({
    queryKey: ['walletTransactions'],
    queryFn: async () => {
      const res = await api.get('/api/wallet/transactions', undefined, WalletTransactionsResponseSchema).catch(() => ({ data: { success: true, data: [] } }));
      return res.data.data || [];
    },
  });

  const loading = balanceLoading || txLoading;
  const isRefetching = isRefetchingBalance || isRefetchingTx;
  const balance = {
    balance: balanceData?.balance ?? 0,
    currency: balanceData?.currency ?? 'INR',
  };

  const onRefresh = () => {
    haptic.light();
    refetchBalance();
    refetchTx();
  };

  const handleWithdraw = async () => {
    Keyboard.dismiss();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      haptic.error();
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (amount > balance.balance) {
      haptic.error();
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance.');
      return;
    }
    setWithdrawing(true);
    haptic.light();
    try {
      await api.post('/api/wallet/withdraw', { amount });
      haptic.success();
      Alert.alert('Success', `₹${amount.toLocaleString('en-IN')} withdrawal initiated.`);
      setWithdrawAmount('');
      refetchBalance();
      refetchTx();
    } catch (err: any) {
      haptic.error();
      Alert.alert('Error', err.response?.data?.message || 'Withdrawal failed.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading && !isRefetching) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] items-center justify-center">
        <ActivityIndicator size="large" color="#4cae4f" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
        <StatusBar barStyle="dark-content" />
        <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center gap-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#4cae4f" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">My Wallet</Text>
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#4cae4f" />}
        >
          {/* Balance Card */}
          <View className="mx-4 mt-6 bg-[#4cae4f] rounded-3xl p-8 shadow-xl shadow-[#4cae4f]/20">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <Wallet size={16} color="white" />
                <Text className="text-xs font-bold text-white uppercase tracking-wider">Available Balance</Text>
              </View>
              <CreditCard size={24} color="white" opacity={0.5} />
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-white text-xl font-bold mr-1">₹</Text>
              <Text className="text-5xl font-black text-white tracking-tighter">
                {balance.balance.toLocaleString('en-IN')}
              </Text>
            </View>
            <Text className="text-xs text-white/60 font-bold mt-2 uppercase tracking-widest">{balance.currency} • SECURE WALLET</Text>
          </View>

          {/* Withdraw (Farmers only) */}
          {userRole === 'farmer' && (
            <View className="mx-4 mt-8 bg-white dark:bg-[#1e291e] rounded-[32px] p-8 border border-[#eaf0ea] dark:border-[#2a382a] shadow-sm">
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Withdraw Funds</Text>
              <View className="flex-row items-start gap-3">
                <View className="flex-1">
                  <Input
                    ref={withdrawRef}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    className="text-xl font-bold"
                    icon={<Text className="text-gray-400 font-bold ml-2">INR</Text>}
                    returnKeyType="done"
                    onSubmitEditing={handleWithdraw}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                  className={`bg-[#4cae4f] h-[52px] px-6 rounded-xl items-center justify-center shadow-lg shadow-[#4cae4f]/20 ${!withdrawAmount ? 'opacity-50' : ''}`}
                >
                  {withdrawing ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-bold uppercase tracking-wider">Withdraw</Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text className="text-[10px] text-gray-400 mt-4 text-center font-medium">Funds will be transferred to your linked bank account within 24-48 hours.</Text>
            </View>
          )}

          {/* Transactions */}
          <View className="mx-4 mt-8 mb-8">
            <View className="flex-row items-center justify-between mb-6 px-2">
              <Text className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Activity Log</Text>
              <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-gray-500 uppercase">{transactions.length} entries</Text>
              </View>
            </View>
            
            {transactions.length === 0 ? (
              <View className="bg-white dark:bg-[#1e291e] rounded-3xl p-12 items-center border border-[#eaf0ea] dark:border-[#2a382a]">
                <View className="size-16 bg-gray-50 dark:bg-gray-900 rounded-full items-center justify-center mb-4">
                  <CreditCard size={32} color="#94a3b8" />
                </View>
                <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1 uppercase">No activity yet</Text>
                <Text className="text-xs text-gray-500 text-center px-4">Your transaction and withdrawal history will appear here.</Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} className="bg-white dark:bg-[#1e291e] rounded-2xl p-5 mb-3 border border-[#eaf0ea] dark:border-[#2a382a] flex-row items-center shadow-sm">
                  <View className={`size-12 rounded-2xl items-center justify-center mr-4 ${
                    tx.type === 'CREDIT' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    {tx.type === 'CREDIT' ? (
                      <ArrowDownLeft size={22} color="#4cae4f" strokeWidth={2.5} />
                    ) : (
                      <ArrowUpRight size={22} color="#ef4444" strokeWidth={2.5} />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>{tx.description}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                      {tx.status !== 'SUCCESS' && (
                        <View className={`px-2 py-0.5 rounded-full ${
                          tx.status === 'PENDING' ? 'bg-orange-100 dark:bg-orange-900/30' : 
                          'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          <Text className={`text-[8px] font-black uppercase tracking-tighter ${
                            tx.status === 'PENDING' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {tx.status}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className={`text-base font-black ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

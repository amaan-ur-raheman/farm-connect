import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { Wallet, ArrowUpRight, ArrowDownLeft, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import api, { WalletTransaction } from '../src/config/api';
import { useAuthStore } from '../src/stores/authStore';

export default function WalletScreen() {
  const { userRole } = useAuthStore();
  const [balance, setBalance] = useState({ balance: 0, currency: 'INR' });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [balRes, txRes] = await Promise.all([
        api.get('/api/wallet/balance'),
        api.get('/api/wallet/transactions').catch(() => ({ data: { data: [] } })),
      ]);
      setBalance(balRes.data.data || balRes.data);
      setTransactions(txRes.data.data || txRes.data || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (amount > balance.balance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance.');
      return;
    }
    setWithdrawing(true);
    try {
      await api.post('/api/wallet/withdraw', { amount });
      Alert.alert('Success', `₹${amount.toLocaleString('en-IN')} withdrawal initiated.`);
      setWithdrawAmount('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Withdrawal failed.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] items-center justify-center">
        <ActivityIndicator size="large" color="#4cae4f" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15]">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white dark:bg-[#1e291e] px-4 pt-12 pb-4 flex-row items-center gap-3 border-b border-[#eaf0ea] dark:border-[#2a382a]">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} color="#4cae4f" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Wallet</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      >
        {/* Balance Card */}
        <View className="mx-4 mt-6 bg-[#4cae4f] rounded-3xl p-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Wallet size={20} color="white" />
              <Text className="text-sm font-semibold text-white/80">Wallet Balance</Text>
            </View>
          </View>
          <Text className="text-4xl font-black text-white mb-1">
            ₹{balance.balance.toLocaleString('en-IN')}
          </Text>
          <Text className="text-sm text-white/60">{balance.currency}</Text>
        </View>

        {/* Withdraw (Farmers only) */}
        {userRole === 'farmer' && (
          <View className="mx-4 mt-6 bg-white dark:bg-[#1e291e] rounded-2xl p-6 border border-[#eaf0ea] dark:border-[#2a382a]">
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Withdraw Funds</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-1 bg-[#f9fbf9] dark:bg-[#151d15] rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                <TextInput
                  placeholder="Enter amount"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  className="text-lg font-bold text-slate-900 dark:text-white"
                />
              </View>
              <TouchableOpacity
                onPress={handleWithdraw}
                disabled={withdrawing}
                className="bg-[#4cae4f] px-6 py-3.5 rounded-xl"
              >
                <Text className="text-white font-bold">{withdrawing ? '...' : 'Withdraw'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Transactions */}
        <View className="mx-4 mt-6 mb-8">
          <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Transaction History</Text>
          {transactions.length === 0 ? (
            <View className="bg-white dark:bg-[#1e291e] rounded-2xl p-8 items-center border border-[#eaf0ea] dark:border-[#2a382a]">
              <Text className="text-3xl mb-3">💳</Text>
              <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1">No transactions yet</Text>
              <Text className="text-xs text-gray-500 text-center">Your transaction history will appear here.</Text>
            </View>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} className="bg-white dark:bg-[#1e291e] rounded-xl p-4 mb-3 border border-[#eaf0ea] dark:border-[#2a382a] flex-row items-center">
                <View className={`size-10 rounded-full items-center justify-center mr-3 ${
                  tx.type === 'CREDIT' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {tx.type === 'CREDIT' ? (
                    <ArrowDownLeft size={20} color="#4cae4f" />
                  ) : (
                    <ArrowUpRight size={20} color="#ef4444" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">{tx.description}</Text>
                  <Text className="text-[10px] text-gray-400 mt-1">
                    {new Date(tx.created_at).toLocaleString()}
                  </Text>
                </View>
                <Text className={`text-sm font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

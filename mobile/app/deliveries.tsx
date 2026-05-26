import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  useColorScheme,
  Platform,
} from 'react-native';
import { ChevronLeft, Package, CheckCircle, Clock, Truck, X, Plus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api, { Delivery } from '../src/config/api';
import { useAuthStore } from '../src/stores/authStore';
import { colors, spacing, radii, typography, theme, getShadow } from '../src/config/theme';
import { Card, Skeleton, EmptyState, Button } from '../src/components/ui';

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  HARVESTED: Clock,
  IN_TRANSIT: Truck,
  DELIVERED: Package,
  VERIFIED: CheckCircle,
  REJECTED: X,
};

const statusColorKeys: Record<string, { light: string; dark: string }> = {
  PENDING: { light: colors.accent[600], dark: colors.accent[400] },
  HARVESTED: { light: '#8b5cf6', dark: '#a78bfa' },
  IN_TRANSIT: { light: colors.info.light, dark: colors.info.dark },
  DELIVERED: { light: colors.success.light, dark: colors.success.dark },
  VERIFIED: { light: colors.success.light, dark: colors.success.dark },
  REJECTED: { light: colors.error.light, dark: colors.error.dark },
};

export default function DeliveriesScreen() {
  const { contractId } = useLocalSearchParams();
  const { userRole } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newDelivery, setNewDelivery] = useState({
    batch_number: '',
    quantity_kg: '',
    quality_grade: '',
  });

  const fetchDeliveries = useCallback(async () => {
    try {
      const endpoint = contractId ? `/api/deliveries/contract/${contractId}` : '/api/deliveries';
      const res = await api.get<{ data: Delivery[] }>(endpoint);
      setDeliveries(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries().finally(() => setRefreshing(false));
  };

  const handleCreateDelivery = async () => {
    const quantity = parseFloat(newDelivery.quantity_kg);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }
    if (!contractId) return;
    try {
      await api.post('/api/deliveries', {
        contract_id: contractId,
        batch_number: newDelivery.batch_number,
        quantity_kg: quantity,
        quality_grade: newDelivery.quality_grade,
      });
      setShowCreateModal(false);
      setNewDelivery({ batch_number: '', quantity_kg: '', quality_grade: '' });
      fetchDeliveries();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create delivery.');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/deliveries/${id}/status`, { status });
      fetchDeliveries();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed.');
    }
  };

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await api.patch(`/api/deliveries/${id}/verify`, { status });
      fetchDeliveries();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Verification failed.');
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap = statusColorKeys[status] || colors.neutral;
    return isDark ? colorMap.dark : colorMap.light;
  };

  const getStatusBgColor = (status: string) => {
    const baseColor = getStatusColor(status);
    return isDark ? `${baseColor}20` : `${baseColor}15`;
  };

  const minTouchHeight = Platform.OS === 'ios' ? 44 : 48;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: currentTheme.background, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          backgroundColor: currentTheme.surface,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing['3xl'],
          paddingBottom: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: spacing.sm, minHeight: minTouchHeight, justifyContent: 'center' }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={currentTheme.primary} />
          </TouchableOpacity>
          <Text style={{ ...typography.title, color: currentTheme.text }}>Deliveries</Text>
        </View>
        {userRole === 'farmer' && contractId && (
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={{
              padding: spacing.sm,
              minHeight: minTouchHeight,
              justifyContent: 'center',
              borderRadius: radii.full,
              backgroundColor: `${currentTheme.primary}15`,
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Plus size={24} color={currentTheme.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.primary} />
        }
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
          {deliveries.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No deliveries yet"
              description="Delivery records will appear here once created by the farmer."
              style={{ paddingVertical: spacing['3xl'] }}
            />
          ) : (
            deliveries.map((delivery) => {
              const Icon = statusIcons[delivery.status] || Clock;
              const statusColor = getStatusColor(delivery.status);
              const statusBg = getStatusBgColor(delivery.status);

              return (
                <Card key={delivery.id} variant="default" padding="lg" style={{ marginBottom: spacing.lg }}>
                  {/* Header Row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: radii.full,
                          backgroundColor: statusBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={20} color={statusColor} />
                      </View>
                      <View>
                        <Text style={{ ...typography.labelSm, color: currentTheme.text }}>
                          Batch #{delivery.batch_number}
                        </Text>
                        <Text style={{ ...typography.captionXs, color: currentTheme.textTertiary }}>
                          {new Date(delivery.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radii.full,
                        backgroundColor: statusBg,
                      }}
                    >
                      <Text style={{ ...typography.captionXs, fontWeight: '700', color: statusColor }}>
                        {delivery.status}
                      </Text>
                    </View>
                  </View>

                  {/* Details Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
                    <View>
                      <Text style={{ ...typography.captionXs, color: currentTheme.textTertiary, textTransform: 'uppercase' }}>
                        Quantity
                      </Text>
                      <Text style={{ ...typography.labelSm, color: currentTheme.text }}>
                        {delivery.quantity_kg} kg
                      </Text>
                    </View>
                    <View>
                      <Text style={{ ...typography.captionXs, color: currentTheme.textTertiary, textTransform: 'uppercase' }}>
                        Quality
                      </Text>
                      <Text style={{ ...typography.labelSm, color: currentTheme.text }}>
                        {delivery.quality_grade}
                      </Text>
                    </View>
                  </View>

                  {/* Farmer Actions */}
                  {userRole === 'farmer' && (
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      {delivery.status === 'PENDING' && (
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(delivery.id, 'HARVESTED')}
                          style={{
                            flex: 1,
                            backgroundColor: '#8b5cf6',
                            paddingVertical: spacing.md,
                            borderRadius: radii.lg,
                            alignItems: 'center',
                            minHeight: minTouchHeight,
                          }}
                        >
                          <Text style={{ ...typography.labelSm, color: '#FFFFFF' }}>Mark Harvested</Text>
                        </TouchableOpacity>
                      )}
                      {delivery.status === 'HARVESTED' && (
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(delivery.id, 'IN_TRANSIT')}
                          style={{
                            flex: 1,
                            backgroundColor: colors.info.light,
                            paddingVertical: spacing.md,
                            borderRadius: radii.lg,
                            alignItems: 'center',
                            minHeight: minTouchHeight,
                          }}
                        >
                          <Text style={{ ...typography.labelSm, color: '#FFFFFF' }}>Dispatch</Text>
                        </TouchableOpacity>
                      )}
                      {delivery.status === 'IN_TRANSIT' && (
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(delivery.id, 'DELIVERED')}
                          style={{
                            flex: 1,
                            backgroundColor: colors.success.light,
                            paddingVertical: spacing.md,
                            borderRadius: radii.lg,
                            alignItems: 'center',
                            minHeight: minTouchHeight,
                          }}
                        >
                          <Text style={{ ...typography.labelSm, color: '#FFFFFF' }}>Mark Delivered</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Investor Actions */}
                  {userRole === 'consumer' && delivery.status === 'DELIVERED' && (
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <TouchableOpacity
                        onPress={() => handleVerify(delivery.id, 'VERIFIED')}
                        style={{
                          flex: 1,
                          backgroundColor: currentTheme.primary,
                          paddingVertical: spacing.md,
                          borderRadius: radii.lg,
                          alignItems: 'center',
                          minHeight: minTouchHeight,
                        }}
                      >
                        <Text style={{ ...typography.labelSm, color: currentTheme.onPrimary }}>Verify & Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleVerify(delivery.id, 'REJECTED')}
                        style={{
                          flex: 1,
                          backgroundColor: colors.error.light,
                          paddingVertical: spacing.md,
                          borderRadius: radii.lg,
                          alignItems: 'center',
                          minHeight: minTouchHeight,
                        }}
                      >
                        <Text style={{ ...typography.labelSm, color: '#FFFFFF' }}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              );
            })
          )}
          <View style={{ height: spacing['3xl'] }} />
        </View>
      </ScrollView>

      {/* Create Delivery Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: currentTheme.scrim, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: currentTheme.surface,
              borderTopLeftRadius: radii['2xl'],
              borderTopRightRadius: radii['2xl'],
              padding: spacing.xl,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
              <Text style={{ ...typography.title, color: currentTheme.text }}>Report New Delivery</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={{ padding: spacing.sm, minHeight: minTouchHeight, justifyContent: 'center' }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={currentTheme.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={{ gap: spacing.lg }}>
              <View>
                <Text style={{ ...typography.caption, fontWeight: '700', color: currentTheme.textTertiary, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                  Batch Number
                </Text>
                <TextInput
                  placeholder="e.g. BATCH-001"
                  placeholderTextColor={currentTheme.inputPlaceholder}
                  value={newDelivery.batch_number}
                  onChangeText={(v) => setNewDelivery({ ...newDelivery, batch_number: v })}
                  style={{
                    backgroundColor: currentTheme.inputBackground,
                    padding: spacing.lg,
                    borderRadius: radii.lg,
                    color: currentTheme.inputText,
                    borderWidth: 1,
                    borderColor: currentTheme.inputBorder,
                    ...typography.body,
                    minHeight: minTouchHeight,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.caption, fontWeight: '700', color: currentTheme.textTertiary, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                  Quantity (kg)
                </Text>
                <TextInput
                  placeholder="e.g. 500"
                  placeholderTextColor={currentTheme.inputPlaceholder}
                  keyboardType="numeric"
                  value={newDelivery.quantity_kg}
                  onChangeText={(v) => setNewDelivery({ ...newDelivery, quantity_kg: v })}
                  style={{
                    backgroundColor: currentTheme.inputBackground,
                    padding: spacing.lg,
                    borderRadius: radii.lg,
                    color: currentTheme.inputText,
                    borderWidth: 1,
                    borderColor: currentTheme.inputBorder,
                    ...typography.body,
                    minHeight: minTouchHeight,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.caption, fontWeight: '700', color: currentTheme.textTertiary, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                  Quality Grade
                </Text>
                <TextInput
                  placeholder="e.g. Grade A+"
                  placeholderTextColor={currentTheme.inputPlaceholder}
                  value={newDelivery.quality_grade}
                  onChangeText={(v) => setNewDelivery({ ...newDelivery, quality_grade: v })}
                  style={{
                    backgroundColor: currentTheme.inputBackground,
                    padding: spacing.lg,
                    borderRadius: radii.lg,
                    color: currentTheme.inputText,
                    borderWidth: 1,
                    borderColor: currentTheme.inputBorder,
                    ...typography.body,
                    minHeight: minTouchHeight,
                  }}
                />
              </View>

              <Button
                label="Create Delivery Record"
                onPress={handleCreateDelivery}
                variant="primary"
                size="lg"
                style={{ marginTop: spacing.md }}
              />
            </View>
            <View style={{ height: spacing.xl }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

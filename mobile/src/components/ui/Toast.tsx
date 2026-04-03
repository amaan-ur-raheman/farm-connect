import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { useToastStore, Toast as ToastType } from '../stores/toastStore';

const toastConfig = {
  success: {
    bgColor: '#dcfce7',
    borderColor: '#86efac',
    textColor: '#166534',
    iconColor: '#16a34a',
    icon: CheckCircle,
  },
  error: {
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    textColor: '#991b1b',
    iconColor: '#dc2626',
    icon: AlertCircle,
  },
  warning: {
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
    textColor: '#92400e',
    iconColor: '#d97706',
    icon: AlertTriangle,
  },
  info: {
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    textColor: '#1e40af',
    iconColor: '#2563eb',
    icon: Info,
  },
};

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(toast.duration || 3000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
          paddingHorizontal: 16,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Icon size={20} color={config.iconColor} style={{ marginRight: 10 }} />
        <Text
          style={{
            flex: 1,
            color: config.textColor,
            fontSize: 14,
            fontWeight: '500',
            lineHeight: 20,
          }}
        >
          {toast.message}
        </Text>
        <TouchableOpacity
          onPress={() => onDismiss(toast.id)}
          style={{ marginLeft: 8, padding: 4 }}
        >
          <X size={16} color={config.textColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </View>
  );
}

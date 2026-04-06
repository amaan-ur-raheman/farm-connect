import api from '../config/api';

interface RazorpayOptions {
  amount: number;
  contract_id: string;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Real Razorpay payment integration using react-native-razorpay SDK.
 * Opens native Razorpay checkout flow and verifies payment on backend.
 */
export const startRazorpayPayment = async ({
  amount,
  contract_id,
  currency = 'INR',
  name = 'FarmConnect',
  description = 'Contract payment',
  prefill = {},
}: RazorpayOptions): Promise<RazorpayResponse> => {
  // Use require for native module to prevent top-level crashes in Expo Go
  let RazorpayCheckout: any;
  try {
    RazorpayCheckout = require('react-native-razorpay').default;
    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
      throw new Error('Native Razorpay module not found');
    }
  } catch (err) {
    console.warn('Razorpay native module is not available in this environment.');
    throw new Error('Native payments are not supported in Expo Go. Use a development build or production app.');
  }

  try {
    // 1. Create order on backend
    const orderRes = await api.post<{ data: { id: string; amount: number; currency: string } }>('/api/payments/order', {
      amount,
      contract_id,
    });

    const order = orderRes.data.data;

    // 2. Open native Razorpay checkout
    const options: any = {
      description,
      image: 'https://your-logo-url.com/logo.png',
      currency: order.currency || currency,
      key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: String(order.amount),
      name,
      order_id: order.id,
      prefill,
      theme: { color: '#4cae4f' },
    };

    const paymentData: RazorpayResponse = await RazorpayCheckout.open(options);

    // 3. Verify payment on backend
    await api.post('/api/payments/escrow/deposit', {
      contract_id,
      amount,
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature,
    });

    return paymentData;
  } catch (error: any) {
    // Razorpay errors have code and description
    if (error.code) {
      throw new Error(error.description || 'Payment failed');
    }
    throw error;
  }
};

/**
 * Helper to open Razorpay checkout for wallet top-up (non-contract specific)
 */
export const startRazorpayWalletTopUp = async (
  amount: number,
  userId: string,
): Promise<RazorpayResponse> => {
  // Use require for native module to prevent top-level crashes in Expo Go
  let RazorpayCheckout: any;
  try {
    RazorpayCheckout = require('react-native-razorpay').default;
    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
      throw new Error('Native Razorpay module not found');
    }
  } catch (err) {
    console.warn('Razorpay native module is not available in this environment.');
    throw new Error('Native payments are not supported in Expo Go. Use a development build or production app.');
  }

  try {
    const orderRes = await api.post<{ data: { id: string; amount: number } }>('/api/payments/order', {
      amount,
      user_id: userId,
    });

    const order = orderRes.data.data;

    const options: any = {
      description: 'Wallet top-up',
      image: 'https://your-logo-url.com/logo.png',
      currency: 'INR',
      key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: String(order.amount),
      name: 'FarmConnect',
      order_id: order.id,
      theme: { color: '#4cae4f' },
    };

    const paymentData: RazorpayResponse = await RazorpayCheckout.open(options);

    // Credit wallet on successful payment
    await api.post('/api/wallet/credit-payment', {
      razorpay_payment_id: paymentData.razorpay_payment_id,
      amount,
    });

    return paymentData;
  } catch (error: any) {
    if (error.code) {
      throw new Error(error.description || 'Payment failed');
    }
    throw error;
  }
};

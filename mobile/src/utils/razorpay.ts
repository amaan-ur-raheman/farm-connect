import { Alert } from 'react-native';
import api from '../config/api';

interface RazorpayOptions {
  amount: number;
  contract_id: string;
  onSuccess: (data: any) => void;
  onFailure: (error: any) => void;
}

/**
 * MOCK Razorpay integration for the prototype.
 * In a real app, you'd use 'react-native-razorpay' or WebView.
 */
export const startRazorpayPayment = async ({
  amount,
  contract_id,
  onSuccess,
  onFailure,
}: RazorpayOptions) => {
  try {
    // 1. Create order on backend
    const orderRes = await api.post<{ data: { id: string; amount: number } }>('/api/payments/order', {
      amount,
      contract_id,
    });

    const order = orderRes.data.data;

    // 2. Simulate User Checkout UI
    Alert.alert(
      'Secure Payment',
      `Proceed to pay ₹${amount.toLocaleString('en-IN')} via Razorpay Secure?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => onFailure(new Error('User cancelled')) },
        {
          text: 'Pay Now',
          onPress: async () => {
            // 3. Simulate success response from Razorpay
            const mockPaymentId = `pay_${Math.random().toString(36).substring(7)}`;
            const mockSignature = `sig_${Math.random().toString(36).substring(7)}`;

            try {
              // 4. Verify and deposit on backend
              const depositRes = await api.post('/api/payments/escrow/deposit', {
                contract_id,
                amount,
                razorpay_order_id: order.id,
                razorpay_payment_id: mockPaymentId,
                razorpay_signature: mockSignature,
              });

              onSuccess(depositRes.data);
            } catch (err) {
              onFailure(err);
            }
          },
        },
      ]
    );
  } catch (err) {
    onFailure(err);
  }
};

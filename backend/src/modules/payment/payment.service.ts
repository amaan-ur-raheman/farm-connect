import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '@/config/env';
import { BadRequestError } from '@/shared/errors';
import { prisma } from '@/config/database';
import { createNotification } from '@/modules/notification/notification.service';

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId,
  key_secret: env.razorpay.keySecret,
});

export const createRazorpayOrder = async (amount: number, receipt: string) => {
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // razorpay uses paise
    currency: 'INR',
    receipt,
    notes: { type: 'escrow_deposit' },
  });
  return order;
};

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expectedSignature === signature;
};

export const verifyWebhookSignature = (payload: string, signature: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(payload)
    .digest('hex');
  return expectedSignature === signature;
};

export const handleWebhookEvent = async (
  event: string,
  payload: Record<string, unknown>
) => {
  console.log(`📡 Processing Razorpay webhook event: ${event}`);

  try {
    switch (event) {
      case 'payment.captured': {
        const payment = payload.payment as Record<string, unknown>;
        const paymentId = payment?.id as string;
        const amount = (payment?.amount as number) / 100; // Convert from paise
        const orderId = payment?.order_id as string;

        console.log(`✅ Payment captured: ${paymentId}, Amount: ₹${amount}`);

        // Find the contract from the order receipt
        const order = await razorpay.orders.fetch(orderId);
        const receipt = order.receipt; // escrow_{contract_id}_{timestamp}
        const contractId = receipt?.split('_')[1];

        if (contractId) {
          // Find the consumer from the contract
          const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            select: { consumer_id: true, farmer_id: true },
          });

          if (contract) {
            // Create escrow deposit entry
            await prisma.escrowLedger.create({
              data: {
                contract_id: contractId,
                user_id: contract.consumer_id,
                event: 'DEPOSIT',
                amount,
                transaction_type: 'CREDIT',
                razorpay_payment_id: paymentId,
                description: `Escrow deposit via Razorpay for contract ${contractId}`,
              },
            });

            // Update contract escrow held
            await prisma.contract.update({
              where: { id: contractId },
              data: { escrow_held: { increment: amount } },
            });

            // Notify both parties
            await Promise.all([
              createNotification(
                contract.consumer_id,
                'PAYMENT_RECEIVED',
                'Payment Successful',
                `₹${amount.toLocaleString('en-IN')} has been added to escrow for your contract.`,
                { contract_id: contractId, payment_id: paymentId }
              ),
              createNotification(
                contract.farmer_id,
                'PAYMENT_RECEIVED',
                'Escrow Funded',
                `₹${amount.toLocaleString('en-IN')} has been added to escrow by the investor.`,
                { contract_id: contractId, payment_id: paymentId }
              ),
            ]);
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment as Record<string, unknown>;
        const paymentId = payment?.id as string;
        const reason = payment?.error_description as string;

        console.error(`❌ Payment failed: ${paymentId}, Reason: ${reason}`);
        // Log failed payment for monitoring
        break;
      }

      case 'refund.created': {
        const refund = payload.refund as Record<string, unknown>;
        const refundId = refund?.id as string;
        const paymentId = refund?.payment_id as string;
        const amount = (refund?.amount as number) / 100;

        console.log(`↩️ Refund created: ${refundId}, Amount: ₹${amount}`);
        // Handle refund logic if needed
        break;
      }

      case 'refund.processed': {
        const refund = payload.refund as Record<string, unknown>;
        const refundId = refund?.id as string;

        console.log(`✅ Refund processed: ${refundId}`);
        // Update refund status in database if needed
        break;
      }

      default:
        console.log(`⚠️ Unhandled webhook event: ${event}`);
    }
  } catch (error) {
    console.error('❌ Webhook event processing failed:', error);
    // Don't throw - webhook should always return success to avoid retries
  }
};

export const createFundAccount = async (userId: string, contact: string, accountDetails: {
  bank_account: {
    account_number: string;
    ifsc: string;
    name: string;
  };
}) => {
  const customer = await razorpay.customers.create({
    name: `FarmConnect User ${userId.slice(0, 8)}`,
    contact,
    email: undefined,
  });

  const fundAccount = await razorpay.fundAccount.create({
    customer_id: customer.id,
    account_type: 'bank_account',
    bank_account: accountDetails.bank_account,
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      razorpay_customer_id: customer.id,
      razorpay_fund_account_id: fundAccount.id,
    },
  });

  return fundAccount;
};

export const initiatePayout = async (userId: string, amount: number, fundAccountId: string) => {
  const payout = await (razorpay as any).payouts.create({
    account_number: env.razorpay.fundAccountNumber,
    to_fund_account_id: fundAccountId,
    amount: Math.round(amount * 100),
    currency: 'INR',
    mode: 'NEFT',
    purpose: 'payout',
  });

  await prisma.walletTransaction.create({
    data: {
      user_id: userId,
      type: 'CREDIT',
      amount,
      description: 'Payout received',
      balance_after: 0,
      razorpay_payout_id: payout.id,
    },
  });

  return payout;
};

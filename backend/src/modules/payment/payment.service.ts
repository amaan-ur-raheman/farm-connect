import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '@/config/env';
import { BadRequestError } from '@/shared/errors';
import { prisma } from '@/config/database';

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

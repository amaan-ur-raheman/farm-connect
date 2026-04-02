import { Router } from 'express';
import { authenticate } from '@/shared/middleware/auth';
import { requireRole } from '@/shared/middleware/auth';
import { asyncHandler } from '@/shared/middleware/handlers';
import { validate } from '@/shared/middleware/validate';
import { prisma } from '@/config/database';
import { initiatePayout } from '@/modules/payment/payment.service';
import { BadRequestError } from '@/shared/errors';
import { z } from 'zod';

const withdrawSchema = z.object({
  amount: z.number().positive(),
});

export const walletRouter = Router();

walletRouter.get('/transactions', authenticate, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const transactions = await prisma.walletTransaction.findMany({
    where: { user_id: req.user!.userId },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });
  res.json({ success: true, data: transactions });
}));

walletRouter.get('/balance', authenticate, asyncHandler(async (req, res) => {
  const transactions = await prisma.walletTransaction.findMany({
    where: { user_id: req.user!.userId },
  });
  const balance = transactions.reduce((acc, t) => t.type === 'CREDIT' ? acc + t.amount : acc - t.amount, 0);
  res.json({ success: true, data: { balance } });
}));

walletRouter.post('/withdraw', authenticate, requireRole('FARMER'), validate(withdrawSchema), asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.razorpay_fund_account_id) {
    throw new BadRequestError('No fund account linked. Please add your bank details first.');
  }

  const transactions = await prisma.walletTransaction.findMany({ where: { user_id: userId } });
  const balance = transactions.reduce((acc, t) => t.type === 'CREDIT' ? acc + t.amount : acc - t.amount, 0);

  if (amount > balance) {
    throw new BadRequestError('Insufficient balance');
  }

  const payout = await initiatePayout(userId, amount, user.razorpay_fund_account_id);

  res.json({ success: true, data: { payout_id: payout.id, amount } });
}));

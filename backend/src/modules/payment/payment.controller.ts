import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { createRazorpayOrder, verifyRazorpaySignature } from './payment.service';
import { createEscrowDeposit } from '@/modules/escrow/escrow.service';
import { validate } from '@/shared/middleware/validate';
import { depositToEscrowSchema } from './payment.schema';
import { BadRequestError } from '@/shared/errors';

export const createOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const { amount, contract_id } = req.body;
  const receipt = `escrow_${contract_id}_${Date.now()}`;
  const order = await createRazorpayOrder(amount, receipt);
  res.json({ success: true, data: order });
});

export const depositEscrowHandler = asyncHandler(async (req: Request, res: Response) => {
  const { contract_id, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!isValid) throw new BadRequestError('Invalid payment signature');

  const result = await createEscrowDeposit(contract_id, req.user!.userId, amount, razorpay_payment_id);
  res.json({ success: true, data: result });
});

export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ received: true });
});

import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature, handleWebhookEvent } from './payment.service';
import { createEscrowDeposit } from '@/modules/escrow/escrow.service';
import { validate } from '@/shared/middleware/validate';
import { depositToEscrowSchema, createOrderSchema } from './payment.schema';
import { BadRequestError, ForbiddenError } from '@/shared/errors';
import { prisma } from '@/config/database';

export const createOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const { amount, contract_id } = req.body;

  // Verify user has access to the contract
  const contract = await prisma.contract.findUnique({
    where: { id: contract_id },
    select: { consumer_id: true, farmer_id: true, status: true },
  });
  if (!contract) {
    throw new BadRequestError('Contract not found');
  }
  if (contract.consumer_id !== req.user!.userId && contract.farmer_id !== req.user!.userId) {
    throw new ForbiddenError('You do not have access to this contract');
  }
  if (contract.status !== 'ACTIVE') {
    throw new BadRequestError('Contract must be active for payments');
  }

  const receipt = `escrow_${contract_id}_${Date.now()}`;
  const order = await createRazorpayOrder(amount, receipt);
  res.json({ success: true, data: order });
});

export const depositEscrowHandler = asyncHandler(async (req: Request, res: Response) => {
  const { contract_id, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Idempotency: check if payment already processed
  const existingLedger = await prisma.escrowLedger.findFirst({
    where: {
      contract_id,
      razorpay_payment_id,
      event: 'DEPOSIT',
    },
  });
  if (existingLedger) {
    // Return existing entry (idempotent)
    res.json({ success: true, data: existingLedger, message: 'Payment already processed' });
    return;
  }

  const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!isValid) throw new BadRequestError('Invalid payment signature');

  const result = await createEscrowDeposit(contract_id, req.user!.userId, amount, razorpay_payment_id);
  res.json({ success: true, data: result });
});

export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = JSON.stringify(req.body);

  const isValid = verifyWebhookSignature(body, signature);
  if (!isValid) {
    res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    return;
  }

  const event = req.body.event;
  const payload = req.body.payload;

  await handleWebhookEvent(event, payload);

  res.json({ received: true, event });
});

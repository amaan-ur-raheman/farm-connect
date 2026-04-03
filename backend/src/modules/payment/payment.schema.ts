import { z } from 'zod';

export const createOrderSchema = z.object({
  contract_id: z.string().uuid(),
  amount: z.number().positive(),
});

export const depositToEscrowSchema = z.object({
  contract_id: z.string().uuid(),
  amount: z.number().positive(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export const releaseWageSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
});

export const webhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number(),
        status: z.string(),
        method: z.string(),
      }),
    }),
  }),
});

export type DepositToEscrowInput = z.infer<typeof depositToEscrowSchema>;
export type ReleaseWageInput = z.infer<typeof releaseWageSchema>;

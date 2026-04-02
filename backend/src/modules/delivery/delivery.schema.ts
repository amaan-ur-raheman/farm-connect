import { z } from 'zod';
import { DeliveryStatus } from '@/generated';

export const createDeliverySchema = z.object({
  contract_id: z.string().uuid(),
  batch_number: z.string().optional(),
  yield_amount_kg: z.number().positive().optional(),
  quality_grade: z.string().optional(),
  delivery_date: z.string().datetime().optional(),
  delivery_proof_url: z.string().url().optional(),
  organic_verified: z.boolean().default(false),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.nativeEnum(DeliveryStatus),
});

export const verifyDeliverySchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
export type VerifyDeliveryInput = z.infer<typeof verifyDeliverySchema>;

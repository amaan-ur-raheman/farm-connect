import { z } from 'zod';

export const createContractSchema = z.object({
  listing_id: z.string().uuid(),
  crop: z.string().min(2).max(100),
  acreage: z.number().positive(),
  price_per_acre: z.number().positive(),
  start_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  end_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const contractFiltersSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const contractActionSchema = z.object({
  action: z.enum(['accept', 'reject', 'cancel', 'complete']),
});

export const releaseWageSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

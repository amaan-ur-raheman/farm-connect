import { z } from 'zod';

export const createUpdateSchema = z.object({
  contract_id: z.string().uuid(),
  caption: z.string().max(1000).optional(),
});

export const getUpdatesSchema = z.object({
  contract_id: z.string().uuid(),
});

export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;

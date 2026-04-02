import { z } from "zod";

export const createDisputeSchema = z.object({
	contract_id: z.string().uuid(),
	reason: z.string().min(10).max(500),
	description: z.string().max(2000).optional(),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;

export const resolveDisputeSchema = z.object({
	resolution: z.string().min(10).max(2000),
	outcome: z.enum(["RELEASE_TO_FARMER", "REFUND_TO_CONSUMER"]),
});

export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

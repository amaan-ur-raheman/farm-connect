import { z } from "zod";

export const freezeEscrowSchema = z.object({
	amount: z.number().positive("Amount must be positive"),
	reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason too long"),
	description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
});

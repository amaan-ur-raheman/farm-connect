import { z } from "zod";

export const handleKycActionSchema = z.object({
	action: z.enum(["APPROVE", "REJECT"]),
	reason: z.string().max(500).optional(),
});

export type HandleKycActionInput = z.infer<typeof handleKycActionSchema>;

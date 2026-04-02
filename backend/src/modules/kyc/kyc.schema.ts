import { z } from "zod";

export const rejectKycSchema = z.object({
	reason: z.string().min(1),
});

export type RejectKycInput = z.infer<typeof rejectKycSchema>;

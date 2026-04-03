import { z } from "zod";

export const updateProfileSchema = z.object({
	name: z.string().min(2).max(100).optional(),
	email: z.string().email().optional().or(z.literal("")),
	address: z.string().max(500).optional(),
	city: z.string().max(100).optional(),
	state: z.string().max(100).optional(),
	pincode: z
		.string()
		.regex(/^\d{6}$/)
		.optional(),
	latitude: z.number().min(-90).max(90).optional(),
	longitude: z.number().min(-180).max(180).optional(),
	farm_size_acres: z.number().positive().optional(),
	farm_type: z.string().max(100).optional(),
	crops_grown: z.array(z.string().max(100)).optional(),
	irrigation_type: z.string().max(100).optional(),
	years_of_experience: z.number().int().nonnegative().optional(),
	land_records_url: z.string().url().optional().or(z.literal("")),
	soil_type: z.string().max(100).optional(),
	investment_range: z.string().max(100).optional(),
	investment_goals: z.array(z.string().max(100)).optional(),
	preferred_farm_types: z.array(z.string().max(100)).optional(),
	bank_name: z.string().max(100).optional(),
	bank_account_number: z.string().max(50).optional(),
	bank_ifsc: z.string().max(20).optional(),
	farm_name: z.string().max(100).optional(),
});

export const getProfileSchema = z.object({});

export const pushTokenSchema = z.object({
	expo_push_token: z.string(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PushTokenInput = z.infer<typeof pushTokenSchema>;

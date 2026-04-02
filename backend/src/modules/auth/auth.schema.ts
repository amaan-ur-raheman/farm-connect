import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  fcmToken: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

import { z } from 'zod';

// Allow any +91 number in dev, strict in prod
const phoneRegex = process.env.NODE_ENV === 'development' 
  ? /^\+91\d{10}$/ 
  : /^\+91[6-9]\d{9}$/;

export const sendOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, process.env.NODE_ENV === 'development' ? 'Invalid phone number (use +91XXXXXXXXXX)' : 'Invalid Indian mobile number'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(phoneRegex),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  fcmToken: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { sendOtp, verifyOtpAndLogin, refreshAccessToken, logout } from './auth.service';
import { validate } from '@/shared/middleware/validate';
import { sendOtpSchema, verifyOtpSchema, refreshTokenSchema } from './auth.schema';
import { env } from '@/config/env';
import { getOtp } from '@/config/redis';

export const sendOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await sendOtp(req.body);
  res.json({ success: true, data: result });
});

export const verifyOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await verifyOtpAndLogin(req.body);
  res.json({ success: true, data: result });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await refreshAccessToken(req.body.refreshToken);
  res.json({ success: true, data: result });
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  await logout(req.user!.userId);
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

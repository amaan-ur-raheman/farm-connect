import { Router } from 'express';
import { authenticate } from '@/shared/middleware/auth';
import { validate } from '@/shared/middleware/validate';
import { sendOtpSchema, verifyOtpSchema, refreshTokenSchema } from './auth.schema';
import {
  sendOtpHandler,
  verifyOtpHandler,
  refreshHandler,
  logoutHandler,
} from './auth.controller';

export const authRouter = Router();

authRouter.post('/otp/send', validate(sendOtpSchema), sendOtpHandler);
authRouter.post('/otp/verify', validate(verifyOtpSchema), verifyOtpHandler);
authRouter.post('/refresh', validate(refreshTokenSchema), refreshHandler);
authRouter.post('/logout', authenticate, logoutHandler);

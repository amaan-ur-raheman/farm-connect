import { prisma } from '@/config/database';
import { setOtp, verifyOtp, deleteOtp, checkOtpRateLimit, setRefreshToken, deleteRefreshToken, getRefreshToken } from '@/config/redis';
import { sendSmsOtp } from './auth.sms';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './auth.utils';
import { ConflictError, UnauthorizedError, BadRequestError } from '@/shared/errors';
import { env } from '@/config/env';
import { JwtPayload } from '@/shared/middleware/auth';
import type { SendOtpInput, VerifyOtpInput } from './auth.schema';

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = async (input: SendOtpInput): Promise<{ message: string, devOtp?: string }> => {
  const allowed = await checkOtpRateLimit(input.phone);
  if (!allowed) {
    throw new BadRequestError('Too many OTP requests. Please try again after an hour.');
  }

  const otp = generateOtp();
  await setOtp(input.phone, otp);

  // Always log OTP to console FIRST (guaranteed to show)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔑 OTP for ${input.phone}: ${otp}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Try to send SMS if Twilio is configured
  const twilioConfigured = env.twilio.accountSid && env.twilio.authToken && env.twilio.phoneNumber;

  if (twilioConfigured) {
    try {
      await sendSmsOtp(input.phone, otp);
      console.log(`✅ SMS sent to ${input.phone} via Twilio`);
    } catch (smsError) {
      console.warn(`⚠️  SMS failed (${smsError instanceof Error ? smsError.message : 'Unknown error'})`);
      console.warn(`💡 User will see OTP in app (dev mode only)`);
    }
  }

  return { 
    message: 'OTP sent successfully',
    ...(env.isDev ? { devOtp: otp } : {})
  };
};

export const verifyOtpAndLogin = async (input: VerifyOtpInput): Promise<{
  user: object;
  accessToken: string;
  refreshToken: string;
}> => {
  const isValid = await verifyOtp(input.phone, input.otp);

  if (!isValid) {
    throw new UnauthorizedError('Invalid or expired OTP');
  }

  await deleteOtp(input.phone);

  let user = await prisma.user.findUnique({ where: { phone: input.phone } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: input.phone,
        name: null,
        email: null,
        expo_push_token: input.fcmToken,
      },
    });
  } else if (input.fcmToken) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { expo_push_token: input.fcmToken },
    });
  }

  const payload: JwtPayload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await setRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      kyc_status: user.kyc_status,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  const payload = verifyRefreshToken(refreshToken);
  const storedToken = await getRefreshToken(payload.userId);

  if (!storedToken || storedToken !== refreshToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const newPayload: JwtPayload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  await setRefreshToken(user.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logout = async (userId: string): Promise<void> => {
  await deleteRefreshToken(userId);
};

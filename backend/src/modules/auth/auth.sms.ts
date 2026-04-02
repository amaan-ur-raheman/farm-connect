import twilio from 'twilio';
import { env } from '@/config/env';

const client = twilio(env.twilio.accountSid, env.twilio.authToken);

export const sendSmsOtp = async (phone: string, otp: string): Promise<void> => {
  await client.messages.create({
    body: `FarmConnect: Your OTP is ${otp}. Valid for 5 minutes. Do not share.`,
    from: env.twilio.phoneNumber,
    to: phone,
  });
};

export const sendSms = async (phone: string, message: string): Promise<void> => {
  await client.messages.create({
    body: message,
    from: env.twilio.phoneNumber,
    to: phone,
  });
};

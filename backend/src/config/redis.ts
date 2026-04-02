import { Redis } from "@upstash/redis";
import { env } from "@/config/env";

const redis = new Redis({
	url: env.redis.url,
	token: env.redis.token,
});

const OTP_TTL = 300; // 5 minutes
const OTP_LIMIT = 5; // max OTP requests per hour per phone

export const redisClient = redis;

export const setOtp = async (phone: string, otp: string): Promise<void> => {
	await redis.set(`otp:${phone}`, otp, { ex: OTP_TTL });
};

export const getOtp = async (phone: string): Promise<string | null> => {
	return await redis.get(`otp:${phone}`);
};

export const deleteOtp = async (phone: string): Promise<void> => {
	await redis.del(`otp:${phone}`);
};

export const checkOtpRateLimit = async (phone: string): Promise<boolean> => {
	const key = `otp_limit:${phone}`;
	const count = await redis.get<number>(key);
	if (count !== null && count >= OTP_LIMIT) {
		return false; // rate limited
	}
	const current = await redis.incr(key);
	if (current === 1) {
		await redis.expire(key, 3600); // 1 hour window
	}
	return true;
};

export const setRefreshToken = async (
	userId: string,
	token: string,
): Promise<void> => {
	await redis.set(`refresh:${userId}`, token, { ex: 7 * 24 * 3600 }); // 7 days
};

export const getRefreshToken = async (
	userId: string,
): Promise<string | null> => {
	return await redis.get(`refresh:${userId}`);
};

export const deleteRefreshToken = async (userId: string): Promise<void> => {
	await redis.del(`refresh:${userId}`);
};

export const getWalletBalance = (userId: string) =>
	redis.get<number>(`wallet_balance:${userId}`);

export const setWalletBalance = (userId: string, balance: number) =>
	redis.set(`wallet_balance:${userId}`, balance, { ex: 60 });

export const invalidateWalletBalance = (userId: string) =>
	redis.del(`wallet_balance:${userId}`);

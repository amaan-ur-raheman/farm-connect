import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Redis URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Redis token is required'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_FUND_ACCOUNT_NUMBER: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig;

try {
  envConfig = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

export const env = {
  node: envConfig.NODE_ENV,
  port: parseInt(envConfig.PORT, 10),
  corsOrigin: envConfig.CORS_ORIGIN.split(',').map(origin => origin.trim()) as string[],

  database: {
    url: envConfig.DATABASE_URL,
    directUrl: envConfig.DIRECT_URL,
  },

  jwt: {
    secret: envConfig.JWT_SECRET,
    refreshSecret: envConfig.JWT_REFRESH_SECRET,
    accessExpiry: envConfig.ACCESS_TOKEN_EXPIRY,
    refreshExpiry: envConfig.REFRESH_TOKEN_EXPIRY,
  },

  redis: {
    url: envConfig.UPSTASH_REDIS_REST_URL,
    token: envConfig.UPSTASH_REDIS_REST_TOKEN,
    host: envConfig.REDIS_HOST,
    port: parseInt(envConfig.REDIS_PORT, 10),
    password: envConfig.REDIS_PASSWORD,
    username: envConfig.REDIS_USERNAME,
  },

  twilio: {
    accountSid: envConfig.TWILIO_ACCOUNT_SID,
    authToken: envConfig.TWILIO_AUTH_TOKEN,
    phoneNumber: envConfig.TWILIO_PHONE_NUMBER,
  },

  razorpay: {
    keyId: envConfig.RAZORPAY_KEY_ID,
    keySecret: envConfig.RAZORPAY_KEY_SECRET,
    webhookSecret: envConfig.RAZORPAY_WEBHOOK_SECRET,
    fundAccountNumber: envConfig.RAZORPAY_FUND_ACCOUNT_NUMBER,
  },

  cloudinary: {
    cloudName: envConfig.CLOUDINARY_CLOUD_NAME,
    apiKey: envConfig.CLOUDINARY_API_KEY,
    apiSecret: envConfig.CLOUDINARY_API_SECRET,
  },

  isProd: envConfig.NODE_ENV === 'production',
  isDev: envConfig.NODE_ENV === 'development',
};

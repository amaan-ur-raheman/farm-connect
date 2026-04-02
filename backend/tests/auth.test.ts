import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateOtp, verifyOtp } from '../src/modules/auth/auth.utils';
import { sendOtp, verifyOtpAndLogin } from '../src/modules/auth/auth.service';
import type { SendOtpInput, VerifyOtpInput } from '../src/modules/auth/auth.schema';

// Mock dependencies
vi.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../src/config/redis', () => ({
  setOtp: vi.fn(),
  getOtp: vi.fn(),
  deleteOtp: vi.fn(),
  checkOtpRateLimit: vi.fn().mockResolvedValue(true),
  setRefreshToken: vi.fn(),
  deleteRefreshToken: vi.fn(),
  getRefreshToken: vi.fn(),
}));

vi.mock('../src/modules/auth/auth.sms', () => ({
  sendSmsOtp: vi.fn(),
}));

describe('Auth Module', () => {
  describe('OTP Generation', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs on each call', () => {
      const otp1 = generateOtp();
      const otp2 = generateOtp();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('Send OTP', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should send OTP successfully', async () => {
      const input: SendOtpInput = { phone: '+919876543210' };
      const result = await sendOtp(input);
      
      expect(result).toHaveProperty('message', 'OTP sent successfully');
    });

    it('should respect rate limiting', async () => {
      const { checkOtpRateLimit } = await import('../src/config/redis');
      vi.mocked(checkOtpRateLimit).mockResolvedValue(false);

      const input: SendOtpInput = { phone: '+919876543210' };
      
      await expect(sendOtp(input)).rejects.toThrow('Too many OTP requests');
    });
  });

  describe('Verify OTP', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should verify correct OTP', async () => {
      const { getOtp, deleteOtp } = await import('../src/config/redis');
      const { prisma } = await import('../src/config/database');
      
      vi.mocked(getOtp).mockResolvedValue('123456');
      vi.mocked(deleteOtp).mockResolvedValue();
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        phone: '+919876543210',
        name: 'Test User',
        role: 'FARMER',
        kyc_status: 'PENDING',
      });

      const input: VerifyOtpInput = { phone: '+919876543210', otp: '123456' };
      const result = await verifyOtpAndLogin(input);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id', 'user-123');
    });

    it('should reject incorrect OTP', async () => {
      const { getOtp } = await import('../src/config/redis');
      vi.mocked(getOtp).mockResolvedValue('654321');

      const input: VerifyOtpInput = { phone: '+919876543210', otp: '111111' };

      await expect(verifyOtpAndLogin(input)).rejects.toThrow('Invalid or expired OTP');
    });

    it('should create new user if not exists', async () => {
      const { getOtp, deleteOtp } = await import('../src/config/redis');
      const { prisma } = await import('../src/config/database');
      
      vi.mocked(getOtp).mockResolvedValue('123456');
      vi.mocked(deleteOtp).mockResolvedValue();
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-user-456',
        phone: '+919876543210',
        name: null,
        role: 'FARMER',
        kyc_status: 'PENDING',
      });

      const input: VerifyOtpInput = { phone: '+919876543210', otp: '123456' };
      const result = await verifyOtpAndLogin(input);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          phone: '+919876543210',
          name: null,
          email: null,
        },
      });
      expect(result.user).toHaveProperty('id', 'new-user-456');
    });
  });
});

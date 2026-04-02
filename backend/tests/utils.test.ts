import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('Phone Number Validation', () => {
    const validatePhone = (phone: string): boolean => {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(phone);
    };

    it('should validate valid Indian phone numbers', () => {
      expect(validatePhone('+919876543210')).toBe(true);
      expect(validatePhone('+919123456789')).toBe(true);
    });

    it('should validate international phone numbers', () => {
      expect(validatePhone('+12015550123')).toBe(true);
      expect(validatePhone('+447911123456')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('12345')).toBe(false);
      expect(validatePhone('+91987654321')).toBe(false); // Too short
      expect(validatePhone('abcdefghij')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('OTP Validation', () => {
    const validateOtp = (otp: string): boolean => {
      return /^\d{6}$/.test(otp);
    };

    it('should validate 6-digit OTP', () => {
      expect(validateOtp('123456')).toBe(true);
      expect(validateOtp('000000')).toBe(true);
      expect(validateOtp('999999')).toBe(true);
    });

    it('should reject invalid OTP formats', () => {
      expect(validateOtp('12345')).toBe(false); // Too short
      expect(validateOtp('1234567')).toBe(false); // Too long
      expect(validateOtp('abcdef')).toBe(false);
      expect(validateOtp('12345a')).toBe(false);
      expect(validateOtp('')).toBe(false);
    });
  });

  describe('Currency Formatting', () => {
    const formatCurrency = (amount: number): string => {
      return `₹${amount.toLocaleString('en-IN')}`;
    };

    it('should format amounts in INR', () => {
      expect(formatCurrency(50000)).toBe('₹50,000');
      expect(formatCurrency(1000000)).toBe('₹10,00,000');
      expect(formatCurrency(500.50)).toBe('₹500.5');
    });
  });

  describe('Date Validation', () => {
    const isValidDate = (date: string): boolean => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    };

    it('should validate ISO date strings', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-12-31T23:59:59Z')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('2024-13-45')).toBe(false);
    });
  });
});

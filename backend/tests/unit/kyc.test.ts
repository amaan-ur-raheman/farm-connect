import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadKycDocuments } from '../../src/modules/kyc/kyc.service';
import { prisma } from '../../src/config/database';
import { NotFoundError } from '../../src/shared/errors';

vi.mock('../../src/config/database', () => ({
  prisma: { 
    user: { 
      findUnique: vi.fn(),
      update: vi.fn() 
    } 
  }
}));

describe('KYC Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw NotFoundError if user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    
    try {
      await uploadKycDocuments('non-existent', { aadhaar: 'url' });
      expect.fail('Should have thrown an error');
    } catch (err: any) {
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('User not found');
    }
  });

  it('should update user kyc_documents and status if user exists', async () => {
    const mockUser = { id: '1', kyc_status: 'PENDING' };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, kyc_status: 'SUBMITTED', kyc_documents: { aadhaar: 'url' } } as any);
    
    const result = await uploadKycDocuments('1', { aadhaar: 'url' });
    expect(result.kyc_status).toBe('SUBMITTED');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { kyc_status: 'SUBMITTED', kyc_documents: { aadhaar: 'url' } }
    });
  });
});

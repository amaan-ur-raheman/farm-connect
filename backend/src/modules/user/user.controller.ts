import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { getProfile, updateProfile, uploadKycDocument } from './user.service';
import { authenticate } from '@/shared/middleware/auth';
import { validate } from '@/shared/middleware/validate';
import { updateProfileSchema } from './user.schema';
import { BadRequestError } from '@/shared/errors';

export const getProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await getProfile(req.user!.userId);
  res.json({ success: true, data: user });
});

export const updateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateProfile(req.user!.userId, req.body);
  res.json({ success: true, data: user });
});

/**
 * @deprecated Use POST /api/kyc/upload instead.
 * This endpoint will be removed in v2.0.
 * Migrated to consolidate KYC uploads into a single endpoint.
 */
export const uploadKycHandler = asyncHandler(async (req: Request, res: Response) => {
  console.warn('DEPRECATION WARNING: POST /api/users/upload-kyc is deprecated. Use POST /api/kyc/upload instead.');
  
  const { documentType, fileUrl } = req.body;
  const validTypes = ['aadhaar_front', 'aadhaar_back', 'pan_card', 'bank_statement'];
  if (!documentType || !validTypes.includes(documentType)) {
    throw new BadRequestError(
      `Invalid documentType. Must be one of: ${validTypes.join(', ')}`
    );
  }
  if (!fileUrl) {
    throw new BadRequestError('fileUrl is required. Upload file to POST /api/kyc/upload instead.');
  }

  const userId = req.user!.userId;
  const updated = await uploadKycDocument(userId, documentType as any, fileUrl);
  res.json({ success: true, data: updated });
});

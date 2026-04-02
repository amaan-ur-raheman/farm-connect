import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { getProfile, updateProfile, uploadKycDocument } from './user.service';
import { authenticate } from '@/shared/middleware/auth';
import { validate } from '@/shared/middleware/validate';
import { updateProfileSchema } from './user.schema';
import multer from 'multer';
import streamifier from 'streamifier';
import { cloudinary } from '@/config/cloudinary';
import { BadRequestError } from '@/shared/errors';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDF documents are allowed.'));
    }
  },
});

export const getProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await getProfile(req.user!.userId);
  res.json({ success: true, data: user });
});

export const updateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateProfile(req.user!.userId, req.body);
  res.json({ success: true, data: user });
});

export const uploadKycHandler = [
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const { documentType } = req.body as { documentType: string };
    const validTypes = ['aadhaar_front', 'aadhaar_back', 'pan_card', 'bank_statement'];
    if (!documentType || !validTypes.includes(documentType)) {
      throw new BadRequestError(
        `Invalid documentType. Must be one of: ${validTypes.join(', ')}`
      );
    }
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const userId = req.user!.userId;
    const folder = `farmconnect/kyc/${userId}/${documentType}`;
    const fileUrl: string = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
        if (err) reject(err);
        else resolve(result!.secure_url);
      });
      streamifier.createReadStream(req.file!.buffer).pipe(stream);
    });

    const updated = await uploadKycDocument(userId, documentType as any, fileUrl);
    res.json({ success: true, data: updated });
  }),
];

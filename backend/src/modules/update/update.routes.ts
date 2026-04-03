import { Router } from 'express';
import { authenticate, requireRole } from '@/shared/middleware/auth';
import { asyncHandler } from '@/shared/middleware/handlers';
import { validate } from '@/shared/middleware/validate';
import { sanitizeFields } from '@/shared/middleware/sanitize';
import { BadRequestError } from '@/shared/errors';
import { createFarmUpdate, getContractUpdates } from './update.service';
import multer from 'multer';
import streamifier from 'streamifier';
import { cloudinary } from '@/config/cloudinary';
import { createUpdateSchema } from './update.schema';

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

const uploadRouter = Router({ mergeParams: true });

uploadRouter.post(
  '/',
  authenticate,
  requireRole('FARMER'),
  upload.single('media'),
  sanitizeFields('caption'),
  validate(createUpdateSchema),
  asyncHandler(async (req, res) => {
    const { contract_id, caption } = req.body;

    let mediaUrl = '';
    let mediaType: string | undefined;

    if (req.file) {
      const folder = `farmconnect/updates/${contract_id}`;
      mediaUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
          if (err) reject(err);
          else resolve(result!.secure_url);
        });
        streamifier.createReadStream(req.file!.buffer).pipe(stream);
      });
      mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    // Reject updates without media
    if (!mediaUrl) {
      throw new BadRequestError('Media file is required for farm updates');
    }

    const update = await createFarmUpdate(
      req.user!.userId,
      contract_id,
      caption,
      mediaUrl,
      mediaType,
    );

    res.status(201).json({ success: true, data: update });
  })
);

const listRouter = Router();
listRouter.get(
  '/:contractId',
  authenticate,
  asyncHandler(async (req, res) => {
    const updates = await getContractUpdates(req.params.contractId as string);
    res.json({ success: true, data: updates });
  })
);

export const updateRouter = Router();
updateRouter.use('/', uploadRouter);
updateRouter.use('/', listRouter);

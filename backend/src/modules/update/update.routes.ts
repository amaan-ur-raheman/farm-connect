import { Router } from 'express';
import { authenticate, requireRole } from '@/shared/middleware/auth';
import { asyncHandler } from '@/shared/middleware/handlers';
import { createFarmUpdate, getContractUpdates } from './update.service';
import multer from 'multer';
import streamifier from 'streamifier';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';
import { createUpdateSchema } from './update.schema';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const uploadRouter = Router({ mergeParams: true });

uploadRouter.post(
  '/',
  authenticate,
  requireRole('FARMER'),
  upload.single('media'),
  asyncHandler(async (req, res) => {
    const { contract_id, caption } = createUpdateSchema.parse(req.body);

    let mediaUrl = '';
    if (req.file) {
      const folder = `farmconnect/updates/${contract_id}`;
      mediaUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
          if (err) reject(err);
          else resolve(result!.secure_url);
        });
        streamifier.createReadStream(req.file!.buffer).pipe(stream);
      });
    }

    const update = await createFarmUpdate(
      req.user!.userId,
      contract_id,
      caption,
      mediaUrl,
      req.file?.mimetype.startsWith('video') ? 'video' : 'image'
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

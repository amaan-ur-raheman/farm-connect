import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { uploadKycDocuments } from './kyc.service';
import { BadRequestError } from '@/shared/errors';
import { uploadToCloudinary } from '@/shared/utils/cloudinary';

export const uploadDocumentsHandler = asyncHandler(async (req: Request, res: Response) => {
	const files = req.files as { [fieldname: string]: Express.Multer.File[] };
	if (!files || !files.aadhaar) {
		throw new BadRequestError('Aadhaar document is required');
	}

	const userId = req.user!.userId;
	const uploadTasks: Promise<[string, string]>[] = [];

	// Upload Aadhaar
	uploadTasks.push(
		uploadToCloudinary(files.aadhaar[0], `farmconnect/users/${userId}/kyc`).then(
			(url) => ['aadhaar', url],
		),
	);

	// Upload Land Record if provided
	if (files.land_record) {
		uploadTasks.push(
			uploadToCloudinary(
				files.land_record[0],
				`farmconnect/users/${userId}/kyc`,
			).then((url) => ['land_record', url]),
		);
	}

	const results = await Promise.all(uploadTasks);
	const documents = Object.fromEntries(results);

	const result = await uploadKycDocuments(userId, documents);
	res.json({ success: true, data: result });
});

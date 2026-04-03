import { cloudinary } from '@/config/cloudinary';
import streamifier from 'streamifier';

/**
 * Uploads a file buffer to Cloudinary using a stream.
 * @param file The multer file object containing the buffer.
 * @param folder The Cloudinary folder to upload to.
 * @returns A promise that resolves to the secure URL of the uploaded file.
 */
export const uploadToCloudinary = (
	file: Express.Multer.File,
	folder: string,
): Promise<string> => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ folder, resource_type: 'auto' },
			(err, result) => {
				if (err) reject(err);
				else resolve(result!.secure_url);
			},
		);
		streamifier.createReadStream(file.buffer).pipe(stream);
	});
};

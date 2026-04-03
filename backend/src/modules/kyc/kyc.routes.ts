import { Router } from "express";
import { authenticate, requireRole } from "@/shared/middleware/auth";
import { asyncHandler } from "@/shared/middleware/handlers";
import { validate } from "@/shared/middleware/validate";
import {
	getPendingKyc,
	verifyKyc,
	rejectKyc,
	getUserKycStatus,
} from "./kyc.service";
import { rejectKycSchema } from "./kyc.schema";
import { uploadDocumentsHandler } from "./kyc.controller";
import multer from "multer";
import { BadRequestError } from "@/shared/errors";

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		const allowedMimes = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"application/pdf",
		];
		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(
				new BadRequestError(
					"Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.",
				) as any,
			);
		}
	},
});

export const kycRouter = Router();

// Get current user's KYC status
kycRouter.get(
	"/status",
	authenticate,
	asyncHandler(async (req, res) => {
		const kyc = await getUserKycStatus(req.user!.userId);
		res.json({ success: true, data: kyc });
	}),
);

kycRouter.post(
	"/upload",
	authenticate,
	upload.fields([
		{ name: "aadhaar", maxCount: 1 },
		{ name: "land_record", maxCount: 1 },
	]),
	uploadDocumentsHandler,
);

kycRouter.get(
	"/pending",
	authenticate,
	requireRole("ADMIN"),
	asyncHandler(async (_req, res) => {
		const users = await getPendingKyc();
		res.json({ success: true, data: users });
	}),
);

kycRouter.post(
	"/:userId/verify",
	authenticate,
	requireRole("ADMIN"),
	asyncHandler(async (req, res) => {
		const user = await verifyKyc(req.params.userId as string);
		res.json({ success: true, data: user });
	}),
);

kycRouter.post(
	"/:userId/reject",
	authenticate,
	requireRole("ADMIN"),
	validate(rejectKycSchema),
	asyncHandler(async (req, res) => {
		const user = await rejectKyc(req.params.userId as string, req.body.reason);
		res.json({ success: true, data: user });
	}),
);

import { Router } from "express";
import { authenticate, requireRole } from "@/shared/middleware/auth";
import { asyncHandler } from "@/shared/middleware/handlers";
import { validate } from "@/shared/middleware/validate";
import { getPendingKyc, verifyKyc, rejectKyc } from "./kyc.service";
import { rejectKycSchema } from "./kyc.schema";

export const kycRouter = Router();

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

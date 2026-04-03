import { Router } from "express";
import { authenticate } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { updateProfileSchema, pushTokenSchema } from "./user.schema";
import {
	getProfileHandler,
	updateProfileHandler,
	uploadKycHandler,
} from "./user.controller";
import { getUserStats, savePushToken } from "./user.service";
import { asyncHandler } from "@/shared/middleware/handlers";

export const userRouter = Router();

userRouter.get("/me", authenticate, getProfileHandler);
userRouter.get(
	"/stats",
	authenticate,
	asyncHandler(async (req, res) => {
		const stats = await getUserStats(req.user!.userId);
		res.json({ success: true, data: stats });
	}),
);
userRouter.patch(
	"/me",
	authenticate,
	validate(updateProfileSchema),
	updateProfileHandler,
);
// @deprecated - This endpoint is deprecated. Use /api/kyc/upload instead
userRouter.post("/upload-kyc", authenticate, uploadKycHandler);
userRouter.post(
	"/push-token",
	authenticate,
	validate(pushTokenSchema),
	asyncHandler(async (req, res) => {
		await savePushToken(req.user!.userId, req.body.expo_push_token);
		res.json({ success: true });
	}),
);

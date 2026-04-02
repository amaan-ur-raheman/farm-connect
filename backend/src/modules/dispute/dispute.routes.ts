import { Router } from "express";
import { authenticate, requireRole } from "@/shared/middleware/auth";
import { asyncHandler } from "@/shared/middleware/handlers";
import {
	createDispute,
	getUserDisputes,
	resolveDispute,
} from "./dispute.service";
import { validate } from "@/shared/middleware/validate";
import { createDisputeSchema, resolveDisputeSchema } from "./dispute.schema";

export const disputeRouter = Router();

disputeRouter.post(
	"/",
	authenticate,
	validate(createDisputeSchema),
	asyncHandler(async (req, res) => {
		const dispute = await createDispute(req.user!.userId, req.body);
		res.status(201).json({ success: true, data: dispute });
	}),
);

disputeRouter.get(
	"/",
	authenticate,
	asyncHandler(async (req, res) => {
		const disputes = await getUserDisputes(req.user!.userId);
		res.json({ success: true, data: disputes });
	}),
);

disputeRouter.post(
	"/:id/resolve",
	authenticate,
	requireRole("ADMIN"),
	validate(resolveDisputeSchema),
	asyncHandler(async (req, res) => {
		const dispute = await resolveDispute(
			req.params.id,
			req.user!.userId,
			req.body,
		);
		res.json({ success: true, data: dispute });
	}),
);

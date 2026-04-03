import { Router } from "express";
import { authenticate, requireRole } from "@/shared/middleware/auth";
import { asyncHandler } from "@/shared/middleware/handlers";
import { sanitizeFields } from "@/shared/middleware/sanitize";
import {
	createDispute,
	getUserDisputes,
	resolveDispute,
} from "./dispute.service";
import { validate } from "@/shared/middleware/validate";
import { createDisputeSchema, resolveDisputeSchema } from "./dispute.schema";
import { prisma } from "@/config/database";

export const disputeRouter = Router();

disputeRouter.post(
	"/",
	authenticate,
	sanitizeFields("description"),
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
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
		const skip = (page - 1) * limit;
		const [disputes, total] = await Promise.all([
			getUserDisputes(req.user!.userId, skip, limit),
			prisma.dispute.count({
				where: {
					OR: [
						{ reporter_id: req.user!.userId },
						{ contract: { farmer_id: req.user!.userId } },
						{ contract: { consumer_id: req.user!.userId } },
					],
				}
			})
		]);
		res.json({ success: true, data: disputes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
	}),
);

disputeRouter.post(
	"/:id/resolve",
	authenticate,
	requireRole("ADMIN"),
	validate(resolveDisputeSchema),
	asyncHandler(async (req, res) => {
		const dispute = await resolveDispute(
			req.params.id as string,
			req.user!.userId,
			req.body,
		);
		res.json({ success: true, data: dispute });
	}),
);

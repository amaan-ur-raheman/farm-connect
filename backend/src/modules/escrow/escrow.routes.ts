import { Router } from "express";
import { authenticate } from "@/shared/middleware/auth";
import { asyncHandler } from "@/shared/middleware/handlers";
import {
	releaseWageToFarmer,
	finalSettlement,
	getEscrowLedger,
} from "./escrow.service";
import { releaseWageSchema } from "@/modules/payment/payment.schema";
import { validate } from "@/shared/middleware/validate";
import { prisma } from "@/config/database";
import { BadRequestError } from "@/shared/errors";

export const escrowRouter = Router();

// Get escrow ledger by contract ID (alias for compatibility)
escrowRouter.get(
	"/contract/:contractId",
	authenticate,
	asyncHandler(async (req, res) => {
		const ledger = await getEscrowLedger(req.params.contractId as string);
		res.json({ success: true, data: ledger });
	}),
);

escrowRouter.post(
	"/contracts/:contractId/release-wage",
	authenticate,
	validate(releaseWageSchema),
	asyncHandler(async (req, res) => {
		const result = await releaseWageToFarmer(
			req.params.contractId as string,
			req.user!.userId,
			req.body.amount,
			req.body.description,
		);
		res.json({ success: true, data: result });
	}),
);

escrowRouter.post(
	"/contracts/:contractId/settle",
	authenticate,
	asyncHandler(async (req, res) => {
		const result = await finalSettlement(req.params.contractId as string);
		res.json({ success: true, data: result });
	}),
);

escrowRouter.get(
	"/contracts/:contractId/ledger",
	authenticate,
	asyncHandler(async (req, res) => {
		const ledger = await getEscrowLedger(req.params.contractId as string);
		res.json({ success: true, data: ledger });
	}),
);

escrowRouter.post(
	"/contracts/:contractId/freeze",
	authenticate,
	asyncHandler(async (req, res) => {
		const { amount, reason, description } = req.body;
		const contractId = req.params.contractId as string;
		const reporterId = req.user!.userId;

		const result = await prisma.$transaction(async (tx) => {
			const contract = await tx.contract.findUnique({
				where: { id: contractId },
			});
			if (!contract) {
				throw new BadRequestError("Contract not found");
			}

			await tx.contract.update({
				where: { id: contractId },
				data: {
					status: "DISPUTED",
					escrow_frozen: { increment: amount },
				},
			});

			await tx.escrowLedger.create({
				data: {
					contract_id: contractId,
					user_id: reporterId,
					event: "DISPUTE_LOCK",
					amount,
					transaction_type: "DEBIT",
					description: `Escrow frozen for dispute: ${reason}`,
				},
			});

			const dispute = await tx.dispute.create({
				data: {
					contract_id: contractId,
					reporter_id: reporterId,
					reason,
					description,
					escrow_frozen: amount,
					status: "OPEN",
				},
			});

			return { contract: await tx.contract.findUnique({ where: { id: contractId } }), dispute };
		});

		res.json({ success: true, data: result });
	}),
);

import { Router } from "express";
import { authenticate } from "@/shared/middleware/auth";
import { asyncHandler } from "@/shared/middleware/handlers";
import {
	releaseWageToFarmer,
	finalSettlement,
	getEscrowLedger,
	freezeEscrow,
} from "./escrow.service";
import { releaseWageSchema } from "@/modules/payment/payment.schema";
import { validate } from "@/shared/middleware/validate";
import { createDispute } from "@/modules/dispute/dispute.service";

export const escrowRouter = Router();

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

		const contract = await freezeEscrow(contractId, amount);

		const dispute = await createDispute(req.user!.userId, {
			contract_id: contractId,
			reason,
			description,
		});

		res.json({ success: true, data: { contract, dispute } });
	}),
);

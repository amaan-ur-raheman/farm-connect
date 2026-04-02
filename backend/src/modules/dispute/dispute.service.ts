import { prisma } from "@/config/database";
import {
	NotFoundError,
	ForbiddenError,
	BadRequestError,
} from "@/shared/errors";
import { createNotification } from "@/modules/notification/notification.service";
import type { CreateDisputeInput, ResolveDisputeInput } from "./dispute.schema";

export const createDispute = async (
	reporterId: string,
	input: CreateDisputeInput,
) => {
	const contract = await prisma.contract.findUnique({
		where: { id: input.contract_id },
	});
	if (!contract) throw new NotFoundError("Contract");
	if (
		contract.farmer_id !== reporterId &&
		contract.consumer_id !== reporterId
	) {
		throw new ForbiddenError("Not your contract");
	}
	if (!["ACTIVE", "COMPLETED"].includes(contract.status)) {
		throw new ForbiddenError("Cannot dispute this contract");
	}

	const existing = await prisma.dispute.findFirst({
		where: {
			contract_id: input.contract_id,
			status: { in: ["OPEN", "UNDER_REVIEW"] },
		},
	});
	if (existing) throw new ForbiddenError("Active dispute already exists");

	return prisma.dispute.create({
		data: {
			contract_id: input.contract_id,
			reporter_id: reporterId,
			reason: input.reason,
			description: input.description,
			escrow_frozen: contract.escrow_held,
		},
	});
};

export const getUserDisputes = async (userId: string) => {
	return prisma.dispute.findMany({
		where: {
			OR: [
				{ reporter_id: userId },
				{ contract: { farmer_id: userId } },
				{ contract: { consumer_id: userId } },
			],
		},
		include: {
			contract: { include: { listing: { select: { name: true } } } },
		},
		orderBy: { created_at: "desc" },
	});
};

export const resolveDispute = async (
	disputeId: string,
	adminId: string,
	input: ResolveDisputeInput,
) => {
	const resolved = await prisma.$transaction(async (tx) => {
		const dispute = await tx.dispute.findUnique({
			where: { id: disputeId },
			include: { contract: true },
		});
		if (!dispute) throw new NotFoundError("Dispute");

		if (!["OPEN", "UNDER_REVIEW"].includes(dispute.status)) {
			throw new BadRequestError("Dispute is not open");
		}

		const { farmer_id, consumer_id } = dispute.contract;
		const recipientId =
			input.outcome === "RELEASE_TO_FARMER" ? farmer_id : consumer_id;

		const latestTx = await tx.walletTransaction.findFirst({
			where: { user_id: recipientId },
			orderBy: { created_at: "desc" },
		});
		const currentBalance = latestTx?.balance_after ?? 0;

		const updatedDispute = await tx.dispute.update({
			where: { id: disputeId },
			data: {
				status: "RESOLVED",
				resolution: input.resolution,
				resolved_at: new Date(),
			},
		});

		if (input.outcome === "RELEASE_TO_FARMER") {
			await tx.walletTransaction.create({
				data: {
					user_id: farmer_id,
					type: "CREDIT",
					amount: dispute.escrow_frozen,
					balance_after: currentBalance + dispute.escrow_frozen,
					description: "Dispute resolved: funds released to farmer",
				},
			});
			await tx.contract.update({
				where: { id: dispute.contract_id },
				data: {
					status: "COMPLETED",
					escrow_held: { decrement: dispute.escrow_frozen },
					escrow_frozen: 0,
				},
			});
		} else {
			await tx.walletTransaction.create({
				data: {
					user_id: consumer_id,
					type: "CREDIT",
					amount: dispute.escrow_frozen,
					balance_after: currentBalance + dispute.escrow_frozen,
					description: "Dispute resolved: funds refunded to consumer",
				},
			});
			await tx.contract.update({
				where: { id: dispute.contract_id },
				data: {
					status: "CANCELLED",
					escrow_held: { decrement: dispute.escrow_frozen },
					escrow_frozen: 0,
				},
			});
		}

		return { updatedDispute, farmer_id, consumer_id };
	});

	await Promise.all([
		createNotification(
			resolved.farmer_id,
			"DISPUTE_RESOLVED",
			"Dispute Resolved",
			input.resolution,
		),
		createNotification(
			resolved.consumer_id,
			"DISPUTE_RESOLVED",
			"Dispute Resolved",
			input.resolution,
		),
	]);

	return resolved.updatedDispute;
};

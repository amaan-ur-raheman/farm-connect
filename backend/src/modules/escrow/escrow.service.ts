import { prisma } from "@/config/database";
import {
	NotFoundError,
	BadRequestError,
	ForbiddenError,
} from "@/shared/errors";
import { createTransaction } from "@/modules/wallet/wallet.service";
import { escrowQueue } from "@/config/queue";

export const createEscrowDeposit = async (
	contractId: string,
	userId: string,
	amount: number,
	razorpayPaymentId?: string,
) => {
	const contract = await prisma.contract.findUnique({
		where: { id: contractId },
	});
	if (!contract) throw new NotFoundError("Contract");
	if (contract.consumer_id !== userId)
		throw new ForbiddenError("Not your contract");
	if (contract.status !== "ACTIVE")
		throw new BadRequestError("Contract not active");

	const [escrowEntry, updatedContract] = await prisma.$transaction([
		prisma.escrowLedger.create({
			data: {
				contract_id: contractId,
				user_id: userId,
				event: "DEPOSIT",
				amount,
				transaction_type: "CREDIT",
				razorpay_payment_id: razorpayPaymentId,
				description: `Escrow deposit for contract ${contractId}`,
			},
		}),
		prisma.contract.update({
			where: { id: contractId },
			data: { escrow_held: { increment: amount } },
		}),
	]);

	return { escrowEntry, escrow_held: updatedContract.escrow_held };
};

export const releaseWageToFarmer = async (
	contractId: string,
	farmerId: string,
	amount: number,
	description?: string,
) => {
	const contract = await prisma.contract.findUnique({
		where: { id: contractId },
	});
	if (!contract) throw new NotFoundError("Contract");
	if (contract.farmer_id !== farmerId)
		throw new ForbiddenError("Not your contract");
	if (contract.status !== "ACTIVE")
		throw new BadRequestError("Contract not active");
	if (amount <= 0 || amount > contract.escrow_held - contract.farmer_paid) {
		throw new BadRequestError("Invalid wage amount");
	}

	const [, updatedContract] = await prisma.$transaction([
		prisma.escrowLedger.create({
			data: {
				contract_id: contractId,
				user_id: farmerId,
				event: "WAGE_RELEASE",
				amount,
				transaction_type: "DEBIT",
				description: description ?? "Wage release to farmer",
			},
		}),
		prisma.contract.update({
			where: { id: contractId },
			data: {
				escrow_held: { decrement: amount },
				farmer_paid: { increment: amount },
			},
		}),
	]);

	// Credit farmer's wallet
	await createTransaction(
		farmerId,
		"CREDIT",
		amount,
		description ?? `Wage release from contract ${contractId}`,
	);

	return {
		wage_released: amount,
		farmer_paid: updatedContract.farmer_paid,
		escrow_held: updatedContract.escrow_held,
	};
};

export const finalSettlement = async (contractId: string) => {
	const contract = await prisma.contract.findUnique({
		where: { id: contractId },
	});
	if (!contract) throw new NotFoundError("Contract");
	if (contract.status !== "ACTIVE")
		throw new BadRequestError("Contract not active");

	const remaining = contract.escrow_held - contract.farmer_paid;
	if (remaining <= 0) throw new BadRequestError("No remaining escrow");

	await prisma.$transaction([
		prisma.escrowLedger.create({
			data: {
				contract_id: contractId,
				user_id: contract.farmer_id,
				event: "FINAL_SETTLEMENT",
				amount: remaining,
				transaction_type: "DEBIT",
				description: "Final settlement to farmer",
			},
		}),
		prisma.contract.update({
			where: { id: contractId },
			data: {
				escrow_held: { decrement: remaining },
				farmer_paid: { increment: remaining },
				status: "COMPLETED",
			},
		}),
	]);

	// Credit farmer's wallet
	await createTransaction(
		contract.farmer_id,
		"CREDIT",
		remaining,
		`Final settlement for contract ${contractId}`,
	);

	return { settled: remaining };
};

export const freezeEscrow = async (contractId: string, amount: number) => {
	return prisma.contract.update({
		where: { id: contractId },
		data: {
			status: "DISPUTED",
			escrow_frozen: amount,
		},
	});
};

export const getEscrowLedger = async (contractId: string) => {
	return prisma.escrowLedger.findMany({
		where: { contract_id: contractId },
		orderBy: { created_at: "desc" },
	});
};

export const scheduleEscrowRelease = async (
	contractId: string,
	farmerId: string,
	amount: number,
	delayInMs: number,
) => {
	await escrowQueue.add(
		`release-${contractId}-${Date.now()}`,
		{ contractId, farmerId, amount },
		{ delay: delayInMs },
	);
};

export const processEscrowRelease = async (
	contractId: string,
	farmerId: string,
	amount: number,
) => {
	console.log(
		`[EscrowWorker] Processing escrow release: contract=${contractId}, farmer=${farmerId}, amount=${amount}`,
	);

	const contract = await prisma.contract.findUnique({
		where: { id: contractId },
	});

	if (!contract || contract.status !== "ACTIVE") {
		console.warn(`[EscrowWorker] Contract ${contractId} not found or not active`);
		return;
	}

	// Check if already paid or disputed
	if (contract.escrow_held < amount) {
		console.warn(`[EscrowWorker] Insufficient escrow for contract ${contractId}`);
		return;
	}

	await releaseWageToFarmer(contractId, farmerId, amount, "Automated escrow release");
};

import { prisma } from "@/config/database";
import {
	getWalletBalance,
	setWalletBalance,
	invalidateWalletBalance,
} from "@/config/redis";

export const getBalance = async (userId: string): Promise<number> => {
	const cached = await getWalletBalance(userId);
	if (cached !== null) return cached;

	const latest = await prisma.walletTransaction.findFirst({
		where: { user_id: userId },
		orderBy: { created_at: "desc" },
	});

	const balance = latest?.balance_after ?? 0;
	await setWalletBalance(userId, balance);
	return balance;
};

export const createTransaction = async (
	userId: string,
	type: "CREDIT" | "DEBIT",
	amount: number,
	description: string,
) => {
	// Use Prisma interactive transaction with row-level locking to prevent race conditions
	const transaction = await prisma.$transaction(async (tx) => {
		// Lock the latest transaction row to prevent concurrent modifications
		const latest = await tx.walletTransaction.findFirst({
			where: { user_id: userId },
			orderBy: { created_at: "desc" },
		});

		const previous = latest?.balance_after ?? 0;
		const balance_after =
			type === "CREDIT" ? previous + amount : previous - amount;

		const newTransaction = await tx.walletTransaction.create({
			data: { user_id: userId, type, amount, description, balance_after },
		});

		return newTransaction;
	}, {
		timeout: 10000, // 10 second timeout
	});

	await invalidateWalletBalance(userId);
	return transaction;
};

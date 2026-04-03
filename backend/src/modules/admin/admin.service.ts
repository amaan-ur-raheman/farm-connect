import { prisma } from "@/config/database";
import { getPendingKyc, verifyKyc, rejectKyc } from "@/modules/kyc/kyc.service";
import { resolveDispute as resolveDisputeService } from "@/modules/dispute/dispute.service";
import { ResolveDisputeInput } from "@/modules/dispute/dispute.schema";
import { logAdminAction } from "./admin.logger";

export const getAdminStats = async () => {
	const [totalUsers, pendingKyc, openDisputes, activeContracts] = await Promise.all([
		prisma.user.count(),
		prisma.user.count({ where: { kyc_status: "SUBMITTED" } }),
		prisma.dispute.count({ where: { status: "OPEN" } }),
		prisma.contract.count({ where: { status: "ACTIVE" } }),
	]);

	const escrowStats = await prisma.contract.aggregate({
		_sum: {
			escrow_held: true,
			escrow_frozen: true,
		},
	});

	return {
		users: totalUsers,
		pendingKyc,
		openDisputes,
		activeContracts,
		totalEscrow: escrowStats._sum.escrow_held || 0,
		frozenEscrow: escrowStats._sum.escrow_frozen || 0,
	};
};

export const getKycApplications = async () => {
	return getPendingKyc();
};

export const handleKycAction = async (adminId: string, userId: string, action: "APPROVE" | "REJECT", reason?: string) => {
	let result;
	if (action === "APPROVE") {
		result = await verifyKyc(userId);
	} else {
		result = await rejectKyc(userId, reason || "Documents did not meet requirements.");
	}

	await logAdminAction(adminId, `KYC_${action}`, "USER", userId, { reason });
	return result;
};

export const getAllDisputes = async (page = 1, limit = 20) => {
	const skip = (page - 1) * limit;
	const [disputes, total] = await Promise.all([
		prisma.dispute.findMany({
			include: {
				reporter: { select: { id: true, name: true, phone: true } },
				contract: {
					include: {
						farmer: { select: { id: true, name: true, phone: true } },
						consumer: { select: { id: true, name: true, phone: true } },
						listing: { select: { name: true } },
					},
				},
			},
			orderBy: { created_at: "desc" },
			skip,
			take: limit,
		}),
		prisma.dispute.count(),
	]);

	return { disputes, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const resolveAdminDispute = async (disputeId: string, adminId: string, input: ResolveDisputeInput) => {
	const result = await resolveDisputeService(disputeId, adminId, input);
	await logAdminAction(adminId, "DISPUTE_RESOLVE", "DISPUTE", disputeId, {
		outcome: input.outcome,
		resolution: input.resolution,
	});
	return result;
};

export const getAllUsers = async (page = 1, limit = 20) => {
	const skip = (page - 1) * limit;
	const [users, total] = await Promise.all([
		prisma.user.findMany({
			orderBy: { created_at: "desc" },
			select: {
				id: true,
				name: true,
				phone: true,
				email: true,
				role: true,
				kyc_status: true,
				created_at: true,
			},
			skip,
			take: limit,
		}),
		prisma.user.count(),
	]);

	return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getAllListings = async (page = 1, limit = 20) => {
	const skip = (page - 1) * limit;
	const [listings, total] = await Promise.all([
		prisma.farmListing.findMany({
			orderBy: { created_at: "desc" },
			include: {
				farmer: { select: { id: true, name: true, phone: true } },
			},
			skip,
			take: limit,
		}),
		prisma.farmListing.count(),
	]);

	return { listings, total, page, limit, totalPages: Math.ceil(total / limit) };
};

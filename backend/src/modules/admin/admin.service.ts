import { prisma } from "@/config/database";
import { getPendingKyc, verifyKyc, rejectKyc } from "@/modules/kyc/kyc.service";
import { resolveDispute as resolveDisputeService } from "@/modules/dispute/dispute.service";
import { ResolveDisputeInput } from "@/modules/dispute/dispute.schema";

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

export const handleKycAction = async (userId: string, action: "APPROVE" | "REJECT", reason?: string) => {
	if (action === "APPROVE") {
		return verifyKyc(userId);
	} else {
		return rejectKyc(userId, reason || "Documents did not meet requirements.");
	}
};

export const getAllDisputes = async () => {
	return prisma.dispute.findMany({
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
	});
};

export const resolveAdminDispute = async (disputeId: string, adminId: string, input: ResolveDisputeInput) => {
	return resolveDisputeService(disputeId, adminId, input);
};

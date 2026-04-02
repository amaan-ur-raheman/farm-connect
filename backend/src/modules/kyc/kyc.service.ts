import { prisma } from "@/config/database";
import { createNotification } from "@/modules/notification/notification.service";
import { NotFoundError } from "@/shared/errors";

export const getPendingKyc = async () => {
	return prisma.user.findMany({
		where: { kyc_status: "SUBMITTED" },
		select: {
			id: true,
			phone: true,
			name: true,
			email: true,
			kyc_status: true,
			kyc_documents: true,
			created_at: true,
		},
	});
};

export const verifyKyc = async (userId: string) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new NotFoundError("User");

	const updated = await prisma.user.update({
		where: { id: userId },
		data: { kyc_status: "VERIFIED" },
	});

	await createNotification(
		userId,
		"GENERAL",
		"KYC Verified",
		"Your identity has been verified successfully.",
	);

	return updated;
};

export const rejectKyc = async (userId: string, reason: string) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new NotFoundError("User");

	const existingDocs = (user.kyc_documents as Record<string, unknown>) || {};
	const updatedDocs = { ...existingDocs, rejection_reason: reason };

	const updated = await prisma.user.update({
		where: { id: userId },
		data: {
			kyc_status: "REJECTED",
			kyc_documents: updatedDocs,
		},
	});

	await createNotification(
		userId,
		"GENERAL",
		"KYC Rejected",
		`Your KYC verification was rejected: ${reason}`,
	);

	return updated;
};

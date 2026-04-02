// Feature: farmconnect-implementation, Property 1: KYC Status Transition Correctness

/**
 * Property 1: KYC Status Transition Correctness
 * Validates: Requirements 1.2, 1.3
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

vi.mock("@/config/database", () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("@/modules/notification/notification.service", () => ({
	createNotification: vi.fn().mockResolvedValue(undefined),
}));

import { verifyKyc, rejectKyc } from "@/modules/kyc/kyc.service";
import { prisma } from "@/config/database";

const mockUser = {
	id: "user-1",
	phone: "+1234567890",
	name: "Test User",
	email: "test@example.com",
	kyc_status: "SUBMITTED",
	kyc_documents: {},
	created_at: new Date(),
};

describe("KYC Status Transitions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Property 1a: verifyKyc always sets kyc_status to VERIFIED", async () => {
		/**
		 * Validates: Requirements 1.2
		 */
		await fc.assert(
			fc.asyncProperty(fc.string({ minLength: 1 }), async (userId) => {
				vi.clearAllMocks();

				const user = { ...mockUser, id: userId };
				const updatedUser = { ...user, kyc_status: "VERIFIED" };

				(
					prisma.user.findUnique as ReturnType<typeof vi.fn>
				).mockResolvedValue(user);
				(
					prisma.user.update as ReturnType<typeof vi.fn>
				).mockResolvedValue(updatedUser);

				const result = await verifyKyc(userId);

				expect(prisma.user.update).toHaveBeenCalledWith({
					where: { id: userId },
					data: { kyc_status: "VERIFIED" },
				});
				expect(result.kyc_status).toBe("VERIFIED");
			}),
			{ numRuns: 100 },
		);
	});

	it("Property 1b: rejectKyc always sets kyc_status to REJECTED and persists rejection_reason", async () => {
		/**
		 * Validates: Requirements 1.3
		 */
		await fc.assert(
			fc.asyncProperty(fc.string({ minLength: 1 }), async (reason) => {
				vi.clearAllMocks();

				const userId = "user-1";
				const user = { ...mockUser, id: userId, kyc_documents: {} };
				const updatedDocs = { rejection_reason: reason };
				const updatedUser = {
					...user,
					kyc_status: "REJECTED",
					kyc_documents: updatedDocs,
				};

				(
					prisma.user.findUnique as ReturnType<typeof vi.fn>
				).mockResolvedValue(user);
				(
					prisma.user.update as ReturnType<typeof vi.fn>
				).mockResolvedValue(updatedUser);

				const result = await rejectKyc(userId, reason);

				expect(prisma.user.update).toHaveBeenCalledWith({
					where: { id: userId },
					data: {
						kyc_status: "REJECTED",
						kyc_documents: { rejection_reason: reason },
					},
				});
				expect(result.kyc_status).toBe("REJECTED");
				expect(
					(result.kyc_documents as Record<string, unknown>)
						.rejection_reason,
				).toBe(reason);
			}),
			{ numRuns: 100 },
		);
	});
});

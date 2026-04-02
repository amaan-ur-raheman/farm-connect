/**
 * Property 7: freezeEscrow Does Not Create Dispute Records
 * Validates: Requirements 3.1, 3.4, 10.5
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// Mock the prisma client before importing the service
vi.mock("@/config/database", () => ({
	prisma: {
		contract: {
			update: vi.fn(),
		},
		dispute: {
			create: vi.fn(),
		},
	},
}));

import { freezeEscrow } from "@/modules/escrow/escrow.service";
import { prisma } from "@/config/database";

describe("freezeEscrow", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Property 7: freezeEscrow does not create dispute records and sets contract status to DISPUTED with frozen amount", async () => {
		/**
		 * Validates: Requirements 3.1, 3.4, 10.5
		 */
		await fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 1 }),
				fc.float({ min: 1 }),
				async (contractId, amount) => {
					vi.clearAllMocks();

					const mockContract = {
						id: contractId,
						status: "DISPUTED",
						escrow_frozen: amount,
					};

					(
						prisma.contract.update as ReturnType<typeof vi.fn>
					).mockResolvedValue(mockContract);

					await freezeEscrow(contractId, amount);

					// dispute.create must NOT be called
					expect(prisma.dispute.create).not.toHaveBeenCalled();

					// contract.update must be called with status DISPUTED and the frozen amount
					expect(prisma.contract.update).toHaveBeenCalledWith({
						where: { id: contractId },
						data: {
							status: "DISPUTED",
							escrow_frozen: amount,
						},
					});
				},
			),
			{ numRuns: 100 },
		);
	});
});

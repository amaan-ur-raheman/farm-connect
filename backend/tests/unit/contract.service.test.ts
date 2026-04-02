/**
 * Contract Service Tests
 * Covers: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 * Property 19: Contract State Machine Transitions
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

vi.mock("@/config/database", () => ({
	prisma: {
		contract: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

import {
	acceptContract,
	rejectContract,
	cancelContract,
	completeContract,
} from "@/modules/contract/contract.service";
import { prisma } from "@/config/database";

const mockPrisma = prisma as unknown as {
	contract: {
		findUnique: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
};

beforeEach(() => {
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// acceptContract — Req 11.1, 11.3
// ---------------------------------------------------------------------------
describe("acceptContract", () => {
	it("transitions PENDING → ACTIVE (Req 11.1)", async () => {
		const contract = { id: "c1", farmer_id: "f1", status: "PENDING" };
		mockPrisma.contract.findUnique.mockResolvedValue(contract);
		mockPrisma.contract.update.mockResolvedValue({
			...contract,
			status: "ACTIVE",
		});

		const result = await acceptContract("c1", "f1");

		expect(mockPrisma.contract.update).toHaveBeenCalledWith({
			where: { id: "c1" },
			data: { status: "ACTIVE" },
		});
		expect(result.status).toBe("ACTIVE");
	});

	it("throws 400 on non-PENDING contract (Req 11.3)", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue({
			id: "c1",
			farmer_id: "f1",
			status: "ACTIVE",
		});
		await expect(acceptContract("c1", "f1")).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("throws 404 when contract does not exist", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue(null);
		await expect(acceptContract("bad-id", "f1")).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("throws 403 when caller is not the farmer", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue({
			id: "c1",
			farmer_id: "other-farmer",
			status: "PENDING",
		});
		await expect(acceptContract("c1", "f1")).rejects.toMatchObject({
			statusCode: 403,
		});
	});
});

// ---------------------------------------------------------------------------
// rejectContract — Req 11.2
// ---------------------------------------------------------------------------
describe("rejectContract", () => {
	it("transitions PENDING → CANCELLED (Req 11.2)", async () => {
		const contract = { id: "c1", farmer_id: "f1", status: "PENDING" };
		mockPrisma.contract.findUnique.mockResolvedValue(contract);
		mockPrisma.contract.update.mockResolvedValue({
			...contract,
			status: "CANCELLED",
		});

		const result = await rejectContract("c1", "f1");

		expect(mockPrisma.contract.update).toHaveBeenCalledWith({
			where: { id: "c1" },
			data: { status: "CANCELLED" },
		});
		expect(result.status).toBe("CANCELLED");
	});

	it("throws 400 on non-PENDING contract", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue({
			id: "c1",
			farmer_id: "f1",
			status: "ACTIVE",
		});
		await expect(rejectContract("c1", "f1")).rejects.toMatchObject({
			statusCode: 400,
		});
	});
});

// ---------------------------------------------------------------------------
// cancelContract — Req 11.4
// ---------------------------------------------------------------------------
describe("cancelContract", () => {
	it("throws 400 on ACTIVE contract with escrow_held > 0 (Req 11.4)", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue({
			id: "c1",
			farmer_id: "f1",
			consumer_id: "u1",
			status: "ACTIVE",
			escrow_held: 100,
		});
		await expect(cancelContract("c1", "f1")).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("allows cancellation of ACTIVE contract with no escrow", async () => {
		const contract = {
			id: "c1",
			farmer_id: "f1",
			consumer_id: "u1",
			status: "ACTIVE",
			escrow_held: 0,
		};
		mockPrisma.contract.findUnique.mockResolvedValue(contract);
		mockPrisma.contract.update.mockResolvedValue({
			...contract,
			status: "CANCELLED",
		});

		const result = await cancelContract("c1", "f1");
		expect(result.status).toBe("CANCELLED");
	});
});

// ---------------------------------------------------------------------------
// completeContract — Req 11.5
// ---------------------------------------------------------------------------
describe("completeContract", () => {
	it("transitions ACTIVE → COMPLETED (Req 11.5)", async () => {
		const contract = { id: "c1", farmer_id: "f1", status: "ACTIVE" };
		mockPrisma.contract.findUnique.mockResolvedValue(contract);
		mockPrisma.contract.update.mockResolvedValue({
			...contract,
			status: "COMPLETED",
		});

		const result = await completeContract("c1", "f1");

		expect(mockPrisma.contract.update).toHaveBeenCalledWith({
			where: { id: "c1" },
			data: { status: "COMPLETED" },
		});
		expect(result.status).toBe("COMPLETED");
	});

	it("throws 400 when contract is not ACTIVE", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue({
			id: "c1",
			farmer_id: "f1",
			status: "PENDING",
		});
		await expect(completeContract("c1", "f1")).rejects.toMatchObject({
			statusCode: 400,
		});
	});
});

// ---------------------------------------------------------------------------
// Property 19: Contract State Machine Transitions
// Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
// ---------------------------------------------------------------------------
describe("Property 19: acceptContract throws 400 for all non-PENDING statuses", () => {
	it("holds for ACTIVE, COMPLETED, DISPUTED, CANCELLED", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom("ACTIVE", "COMPLETED", "DISPUTED", "CANCELLED"),
				async (status) => {
					vi.clearAllMocks();
					mockPrisma.contract.findUnique.mockResolvedValue({
						id: "c1",
						farmer_id: "f1",
						status,
					});

					await expect(
						acceptContract("c1", "f1"),
					).rejects.toMatchObject({
						statusCode: 400,
					});
				},
			),
			{ numRuns: 100 },
		);
	});
});

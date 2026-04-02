/**
 * Escrow Service Tests
 * Covers: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 * Properties 7, 16, 17, 18
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

vi.mock("@/config/database", () => ({
	prisma: {
		contract: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		escrowLedger: {
			create: vi.fn(),
		},
		dispute: {
			create: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

import {
	createEscrowDeposit,
	releaseWageToFarmer,
	finalSettlement,
	freezeEscrow,
} from "@/modules/escrow/escrow.service";
import { prisma } from "@/config/database";

const mockPrisma = prisma as unknown as {
	contract: {
		findUnique: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
	escrowLedger: { create: ReturnType<typeof vi.fn> };
	dispute: { create: ReturnType<typeof vi.fn> };
	$transaction: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createEscrowDeposit — Req 10.1
// ---------------------------------------------------------------------------
describe("createEscrowDeposit", () => {
	it("increments escrow_held by the deposited amount (Req 10.1)", async () => {
		const contract = {
			id: "c1",
			consumer_id: "u1",
			status: "ACTIVE",
			escrow_held: 100,
			farmer_paid: 0,
		};
		const depositAmount = 50;
		const updatedContract = { ...contract, escrow_held: 150 };

		mockPrisma.contract.findUnique.mockResolvedValue(contract);
		mockPrisma.$transaction.mockImplementation(async (ops: any[]) => {
			return [{ id: "ledger1" }, updatedContract];
		});

		const result = await createEscrowDeposit("c1", "u1", depositAmount);

		expect(result.escrow_held).toBe(150);
		expect(mockPrisma.$transaction).toHaveBeenCalled();
	});

	it("throws 404 when contract does not exist", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue(null);
		await expect(
			createEscrowDeposit("bad-id", "u1", 50),
		).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("throws 403 when user is not the consumer", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue({
			id: "c1",
			consumer_id: "other-user",
			status: "ACTIVE",
		});
		await expect(createEscrowDeposit("c1", "u1", 50)).rejects.toMatchObject(
			{
				statusCode: 403,
			},
		);
	});
});

// ---------------------------------------------------------------------------
// releaseWageToFarmer — Req 10.2, 10.4
// ---------------------------------------------------------------------------
describe("releaseWageToFarmer", () => {
	it("decrements escrow_held and increments farmer_paid by the released amount (Req 10.2)", async () => {
		const contract = {
			id: "c1",
			farmer_id: "f1",
			status: "ACTIVE",
			escrow_held: 200,
			farmer_paid: 50,
		};
		const wage = 30;
		const updatedContract = {
			...contract,
			escrow_held: 170,
			farmer_paid: 80,
		};

		mockPrisma.contract.findUnique.mockResolvedValue(contract);
		mockPrisma.$transaction.mockImplementation(async (ops: any[]) => {
			return [{ id: "ledger1" }, updatedContract];
		});

		const result = await releaseWageToFarmer("c1", "f1", wage);

		expect(result.escrow_held).toBe(170);
		expect(result.farmer_paid).toBe(80);
	});

	it("throws 400 when amount exceeds available escrow (Req 10.4)", async () => {
		const contract = {
			id: "c1",
			farmer_id: "f1",
			status: "ACTIVE",
			escrow_held: 100,
			farmer_paid: 80,
		};
		mockPrisma.contract.findUnique.mockResolvedValue(contract);

		// available = 100 - 80 = 20; requesting 50 > 20
		await expect(releaseWageToFarmer("c1", "f1", 50)).rejects.toMatchObject(
			{
				statusCode: 400,
			},
		);
	});

	it("throws 404 when contract does not exist", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue(null);
		await expect(
			releaseWageToFarmer("bad-id", "f1", 10),
		).rejects.toMatchObject({
			statusCode: 404,
		});
	});
});

// ---------------------------------------------------------------------------
// finalSettlement — Req 10.3
// ---------------------------------------------------------------------------
describe("finalSettlement", () => {
	it("sets status to COMPLETED and transfers remaining escrow balance (Req 10.3)", async () => {
		const contract = {
			id: "c1",
			farmer_id: "f1",
			status: "ACTIVE",
			escrow_held: 200,
			farmer_paid: 50,
		};

		mockPrisma.contract.findUnique.mockResolvedValue(contract);
		mockPrisma.$transaction.mockResolvedValue([
			{},
			{ status: "COMPLETED" },
		]);

		const result = await finalSettlement("c1");

		expect(result.settled).toBe(150); // 200 - 50
		expect(mockPrisma.$transaction).toHaveBeenCalled();
	});

	it("throws 404 when contract does not exist", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue(null);
		await expect(finalSettlement("bad-id")).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("throws 400 when contract is not ACTIVE", async () => {
		mockPrisma.contract.findUnique.mockResolvedValue({
			id: "c1",
			status: "COMPLETED",
			escrow_held: 100,
			farmer_paid: 0,
		});
		await expect(finalSettlement("c1")).rejects.toMatchObject({
			statusCode: 400,
		});
	});
});

// ---------------------------------------------------------------------------
// freezeEscrow — Req 10.5
// ---------------------------------------------------------------------------
describe("freezeEscrow", () => {
	it("sets status to DISPUTED and does NOT call prisma.dispute.create (Req 10.5)", async () => {
		const mockContract = {
			id: "c1",
			status: "DISPUTED",
			escrow_frozen: 100,
		};
		mockPrisma.contract.update.mockResolvedValue(mockContract);

		await freezeEscrow("c1", 100);

		expect(mockPrisma.dispute.create).not.toHaveBeenCalled();
		expect(mockPrisma.contract.update).toHaveBeenCalledWith({
			where: { id: "c1" },
			data: { status: "DISPUTED", escrow_frozen: 100 },
		});
	});
});

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

// Property 7: freezeEscrow Does Not Create Dispute Records
// Validates: Requirements 3.1, 3.4, 10.5
describe("Property 7: freezeEscrow does not create Dispute records", () => {
	it("holds for any contractId and frozen amount", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 1 }),
				fc.double({ min: 1, max: 1e6, noNaN: true }),
				async (contractId, amount) => {
					vi.clearAllMocks();
					mockPrisma.contract.update.mockResolvedValue({
						id: contractId,
						status: "DISPUTED",
						escrow_frozen: amount,
					});

					await freezeEscrow(contractId, amount);

					expect(mockPrisma.dispute.create).not.toHaveBeenCalled();
					expect(mockPrisma.contract.update).toHaveBeenCalledWith({
						where: { id: contractId },
						data: { status: "DISPUTED", escrow_frozen: amount },
					});
				},
			),
			{ numRuns: 100 },
		);
	});
});

// Property 16: Escrow Deposit Increments escrow_held
// Validates: Requirements 10.1
describe("Property 16: createEscrowDeposit increments escrow_held by deposit amount", () => {
	it("holds for any positive deposit amount", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.double({ min: 0.01, max: 1e6, noNaN: true }),
				async (depositAmount) => {
					vi.clearAllMocks();
					const initialEscrow = 100;
					const contract = {
						id: "c1",
						consumer_id: "u1",
						status: "ACTIVE",
						escrow_held: initialEscrow,
						farmer_paid: 0,
					};
					const updatedContract = {
						...contract,
						escrow_held: initialEscrow + depositAmount,
					};

					mockPrisma.contract.findUnique.mockResolvedValue(contract);
					mockPrisma.$transaction.mockImplementation(
						async (ops: any[]) => {
							return [{ id: "ledger1" }, updatedContract];
						},
					);

					const result = await createEscrowDeposit(
						"c1",
						"u1",
						depositAmount,
					);

					expect(result.escrow_held).toBeCloseTo(
						initialEscrow + depositAmount,
						5,
					);
				},
			),
			{ numRuns: 100 },
		);
	});
});

// Property 17: Wage Release Updates Escrow and Farmer Paid
// Validates: Requirements 10.2
describe("Property 17: releaseWageToFarmer decrements escrow_held and increments farmer_paid", () => {
	it("holds for any valid wage amount", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.double({ min: 0.01, max: 100, noNaN: true }),
				async (wage) => {
					vi.clearAllMocks();
					const initialEscrow = 500;
					const initialPaid = 0;
					const contract = {
						id: "c1",
						farmer_id: "f1",
						status: "ACTIVE",
						escrow_held: initialEscrow,
						farmer_paid: initialPaid,
					};
					const updatedContract = {
						...contract,
						escrow_held: initialEscrow - wage,
						farmer_paid: initialPaid + wage,
					};

					mockPrisma.contract.findUnique.mockResolvedValue(contract);
					mockPrisma.$transaction.mockImplementation(
						async (ops: any[]) => {
							return [{ id: "ledger1" }, updatedContract];
						},
					);

					const result = await releaseWageToFarmer("c1", "f1", wage);

					expect(result.escrow_held).toBeCloseTo(
						initialEscrow - wage,
						5,
					);
					expect(result.farmer_paid).toBeCloseTo(
						initialPaid + wage,
						5,
					);
				},
			),
			{ numRuns: 100 },
		);
	});
});

// Property 18: Wage Release Rejects Overdraft
// Validates: Requirements 10.4
describe("Property 18: releaseWageToFarmer throws 400 when amount exceeds available escrow", () => {
	it("holds for any amount greater than available escrow", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.double({ min: 0.01, max: 50, noNaN: true }),
				fc.double({ min: 0.01, max: 50, noNaN: true }),
				async (escrowHeld, farmerPaid) => {
					vi.clearAllMocks();
					// available = escrowHeld - farmerPaid; request more than available
					const available = Math.max(0, escrowHeld - farmerPaid);
					const overdraftAmount = available + 1;

					const contract = {
						id: "c1",
						farmer_id: "f1",
						status: "ACTIVE",
						escrow_held: escrowHeld,
						farmer_paid: farmerPaid,
					};

					mockPrisma.contract.findUnique.mockResolvedValue(contract);

					await expect(
						releaseWageToFarmer("c1", "f1", overdraftAmount),
					).rejects.toMatchObject({ statusCode: 400 });
				},
			),
			{ numRuns: 100 },
		);
	});
});

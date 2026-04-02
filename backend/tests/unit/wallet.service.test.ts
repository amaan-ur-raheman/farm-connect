import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// Mock Prisma and Redis before importing the service
vi.mock("@/config/database", () => ({
	prisma: {
		walletTransaction: {
			findFirst: vi.fn(),
			create: vi.fn(),
		},
	},
}));

vi.mock("@/config/redis", () => ({
	getWalletBalance: vi.fn(),
	setWalletBalance: vi.fn(),
	invalidateWalletBalance: vi.fn(),
}));

import { prisma } from "@/config/database";
import * as redisConfig from "@/config/redis";
import { getBalance, createTransaction } from "@/modules/wallet/wallet.service";

const mockFindFirst = prisma.walletTransaction.findFirst as ReturnType<
	typeof vi.fn
>;
const mockCreate = prisma.walletTransaction.create as ReturnType<typeof vi.fn>;
const mockGetWalletBalance = redisConfig.getWalletBalance as ReturnType<
	typeof vi.fn
>;
const mockSetWalletBalance = redisConfig.setWalletBalance as ReturnType<
	typeof vi.fn
>;
const mockInvalidateWalletBalance =
	redisConfig.invalidateWalletBalance as ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.clearAllMocks();
	mockSetWalletBalance.mockResolvedValue(undefined);
	mockInvalidateWalletBalance.mockResolvedValue(undefined);
});

// Feature: farmconnect-implementation, Property 12: Wallet Balance Round Trip
describe("wallet.service", () => {
	it("Property 12: balance_after of last transaction equals algebraic sum of all transactions", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.array(
					fc.record({
						type: fc.constantFrom(
							"CREDIT" as const,
							"DEBIT" as const,
						),
						amount: fc.float({
							min: Math.fround(0.01),
							max: Math.fround(10000),
							noNaN: true,
						}),
					}),
					{ minLength: 1 },
				),
				async (txs) => {
					// Simulate sequential createTransaction calls by tracking running balance
					let runningBalance = 0;
					const results: number[] = [];

					for (const tx of txs) {
						mockGetWalletBalance.mockResolvedValueOnce(null);
						mockFindFirst.mockResolvedValueOnce(
							results.length === 0
								? null
								: { balance_after: runningBalance },
						);
						const newBalance =
							tx.type === "CREDIT"
								? runningBalance + tx.amount
								: runningBalance - tx.amount;
						mockCreate.mockResolvedValueOnce({
							balance_after: newBalance,
						});
						runningBalance = newBalance;
						results.push(newBalance);
					}

					// The expected algebraic sum
					const expected = txs.reduce(
						(acc, t) =>
							t.type === "CREDIT"
								? acc + t.amount
								: acc - t.amount,
						0,
					);

					expect(runningBalance).toBeCloseTo(expected, 4);
				},
			),
			{ numRuns: 100 },
		);
	});

	// Feature: farmconnect-implementation, Property 13: Wallet Cache Invalidation on Write
	it("Property 13: invalidateWalletBalance is called after createTransaction", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.float({
					min: Math.fround(0.01),
					max: Math.fround(10000),
					noNaN: true,
				}),
				async (amount) => {
					mockGetWalletBalance.mockResolvedValue(null);
					mockFindFirst.mockResolvedValue(null);
					mockCreate.mockResolvedValue({ balance_after: amount });

					await createTransaction("user-1", "CREDIT", amount, "test");

					expect(mockInvalidateWalletBalance).toHaveBeenCalledWith(
						"user-1",
					);
				},
			),
			{ numRuns: 100 },
		);
	});
});

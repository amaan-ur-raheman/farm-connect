/**
 * Integration Tests: Full Contract Lifecycle
 * Covers: Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 *
 * Requires a test database configured via DATABASE_URL in backend/.env.test
 * Run with: vitest --run tests/integration/contract-lifecycle.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import path from "path";

// Load test environment before importing prisma
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

import { PrismaClient } from "../../src/generated/client";
import {
	createEscrowDeposit,
	releaseWageToFarmer,
	finalSettlement,
} from "@/modules/escrow/escrow.service";
import {
	acceptContract,
	createContract,
} from "@/modules/contract/contract.service";
import { BadRequestError, ForbiddenError } from "@/shared/errors";

const prisma = new PrismaClient({
	datasources: { db: { url: process.env.DATABASE_URL } },
});

let farmerId: string;
let consumerId: string;
let listingId: string;
let contractId: string;

beforeAll(async () => {
	// Seed: create farmer user
	const farmer = await prisma.user.create({
		data: {
			phone: `+1_test_farmer_${Date.now()}`,
			name: "Test Farmer",
			role: "FARMER",
			kyc_status: "VERIFIED",
		},
	});
	farmerId = farmer.id;

	// Seed: create consumer user
	const consumer = await prisma.user.create({
		data: {
			phone: `+1_test_consumer_${Date.now()}`,
			name: "Test Consumer",
			role: "CONSUMER",
			kyc_status: "VERIFIED",
		},
	});
	consumerId = consumer.id;

	// Seed: create a listing owned by farmer
	const listing = await prisma.farmListing.create({
		data: {
			farmer_id: farmerId,
			name: "Test Farm",
			description: "Integration test listing",
			location: "Test Location",
			acreage: 10,
			price_per_acre: 100,
			crop_types: ["wheat"],
			status: "ACTIVE",
		},
	});
	listingId = listing.id;
});

afterAll(async () => {
	// Clean up in reverse dependency order
	if (contractId) {
		await prisma.escrowLedger.deleteMany({
			where: { contract_id: contractId },
		});
		await prisma.contract.deleteMany({ where: { id: contractId } });
	}
	await prisma.farmListing.deleteMany({ where: { id: listingId } });
	await prisma.user.deleteMany({
		where: { id: { in: [farmerId, consumerId] } },
	});
	await prisma.$disconnect();
});

describe("Contract Lifecycle Integration (Req 14.1)", () => {
	it("creates a contract from consumer to farmer listing", async () => {
		const tomorrow = new Date(Date.now() + 86400000);
		const nextMonth = new Date(Date.now() + 30 * 86400000);

		const contract = await createContract(consumerId, {
			listing_id: listingId,
			crop: "wheat",
			acreage: 5,
			price_per_acre: 100,
			start_date: tomorrow.toISOString(),
			end_date: nextMonth.toISOString(),
		});

		contractId = contract.id;
		expect(contract.status).toBe("PENDING");
		expect(contract.consumer_id).toBe(consumerId);
		expect(contract.farmer_id).toBe(farmerId);
	});

	it("farmer accepts the contract → status becomes ACTIVE (Req 14.1)", async () => {
		const contract = await acceptContract(contractId, farmerId);
		expect(contract.status).toBe("ACTIVE");
	});

	it("consumer deposits escrow → escrow_held increments (Req 14.2)", async () => {
		const depositAmount = 200;
		const result = await createEscrowDeposit(
			contractId,
			consumerId,
			depositAmount,
		);

		expect(result.escrow_held).toBeCloseTo(depositAmount, 5);
	});

	it("farmer releases a wage → escrow_held decrements, farmer_paid increments (Req 14.2)", async () => {
		const wageAmount = 50;
		const result = await releaseWageToFarmer(
			contractId,
			farmerId,
			wageAmount,
		);

		// escrow_held was 200, now 150; farmer_paid was 0, now 50
		expect(result.escrow_held).toBeCloseTo(150, 5);
		expect(result.farmer_paid).toBeCloseTo(50, 5);
		expect(result.wage_released).toBeCloseTo(wageAmount, 5);
	});

	it("final settlement sets status to COMPLETED (Req 14.3)", async () => {
		const result = await finalSettlement(contractId);

		// remaining = 150 - 50 = 100
		expect(result.settled).toBeCloseTo(100, 5);

		const contract = await prisma.contract.findUnique({
			where: { id: contractId },
		});
		expect(contract?.status).toBe("COMPLETED");
	});
});

describe("Contract Access Control", () => {
	let secondContractId: string;

	beforeAll(async () => {
		// Create a second consumer
		const consumer2 = await prisma.user.create({
			data: {
				phone: `+1_test_consumer2_${Date.now()}`,
				name: "Test Consumer 2",
				role: "CONSUMER",
				kyc_status: "VERIFIED",
			},
		});

		// Create a fresh active contract for access control tests
		const tomorrow = new Date(Date.now() + 86400000);
		const nextMonth = new Date(Date.now() + 30 * 86400000);

		const contract = await createContract(consumer2.id, {
			listing_id: listingId,
			crop: "wheat",
			acreage: 2,
			price_per_acre: 100,
			start_date: tomorrow.toISOString(),
			end_date: nextMonth.toISOString(),
		});
		secondContractId = contract.id;
		await acceptContract(secondContractId, farmerId);

		// Clean up consumer2 after tests
		afterAll(async () => {
			await prisma.escrowLedger.deleteMany({
				where: { contract_id: secondContractId },
			});
			await prisma.contract.deleteMany({
				where: { id: secondContractId },
			});
			await prisma.user.deleteMany({ where: { id: consumer2.id } });
		});
	});

	it("consumer cannot deposit into another user's contract (Req 14.4)", async () => {
		// consumerId tries to deposit into secondContractId (owned by consumer2)
		await expect(
			createEscrowDeposit(secondContractId, consumerId, 100),
		).rejects.toThrow(ForbiddenError);
	});

	it("farmer cannot release wage exceeding available escrow (Req 14.5)", async () => {
		// No escrow deposited into secondContractId, so any release should fail
		await expect(
			releaseWageToFarmer(secondContractId, farmerId, 999),
		).rejects.toThrow(BadRequestError);
	});
});

/**
 * Integration Tests: Dispute Flow
 * Covers: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 *
 * Requires a test database configured via DATABASE_URL in backend/.env.test
 * Run with: vitest --run tests/integration/dispute-flow.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import jwt from "jsonwebtoken";

dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

import { PrismaClient } from "../../src/generated/client";
import { freezeEscrow } from "@/modules/escrow/escrow.service";
import { createEscrowDeposit } from "@/modules/escrow/escrow.service";
import {
	createContract,
	acceptContract,
} from "@/modules/contract/contract.service";
import {
	createDispute,
	resolveDispute,
} from "@/modules/dispute/dispute.service";
import { BadRequestError } from "@/shared/errors";

const prisma = new PrismaClient({
	datasources: { db: { url: process.env.DATABASE_URL } },
});

let farmerId: string;
let consumerId: string;
let adminId: string;
let listingId: string;
let contractId: string;
let disputeId: string;
let server: http.Server;
let serverPort: number;

const makeToken = (userId: string, role: string) =>
	jwt.sign(
		{ userId, phone: `+1_${userId}`, role },
		process.env.JWT_SECRET ?? "test_jwt_secret",
		{ expiresIn: "1h" },
	);

const httpPost = (
	port: number,
	path: string,
	body: object,
	token?: string,
): Promise<{ status: number; body: any }> => {
	return new Promise((resolve, reject) => {
		const data = JSON.stringify(body);
		const options: http.RequestOptions = {
			hostname: "127.0.0.1",
			port,
			path,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(data),
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		};
		const req = http.request(options, (res) => {
			let raw = "";
			res.on("data", (chunk) => (raw += chunk));
			res.on("end", () => {
				try {
					resolve({
						status: res.statusCode ?? 0,
						body: JSON.parse(raw),
					});
				} catch {
					resolve({ status: res.statusCode ?? 0, body: raw });
				}
			});
		});
		req.on("error", reject);
		req.write(data);
		req.end();
	});
};

beforeAll(async () => {
	// Seed users
	const farmer = await prisma.user.create({
		data: {
			phone: `+1_df_farmer_${Date.now()}`,
			name: "DF Farmer",
			role: "FARMER",
			kyc_status: "VERIFIED",
		},
	});
	farmerId = farmer.id;

	const consumer = await prisma.user.create({
		data: {
			phone: `+1_df_consumer_${Date.now()}`,
			name: "DF Consumer",
			role: "CONSUMER",
			kyc_status: "VERIFIED",
		},
	});
	consumerId = consumer.id;

	const admin = await prisma.user.create({
		data: {
			phone: `+1_df_admin_${Date.now()}`,
			name: "DF Admin",
			role: "ADMIN",
			kyc_status: "VERIFIED",
		},
	});
	adminId = admin.id;

	// Seed listing
	const listing = await prisma.farmListing.create({
		data: {
			farmer_id: farmerId,
			name: "DF Test Farm",
			description: "Dispute flow test listing",
			location_name: "Test Location",
			area_acres: 10,
			latitude: 0,
			longitude: 0,
			price_per_acre: 100,
			crops: ["wheat"],
			status: "ACTIVE",
		},
	});
	listingId = listing.id;

	// Create and activate contract
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
	await acceptContract(contractId, farmerId);

	// Deposit escrow
	await createEscrowDeposit(contractId, consumerId, 300);

	// Start HTTP server for auth tests (Req 15.5)
	const app = (await import("@/app")).default;
	server = http.createServer(app);
	await new Promise<void>((resolve) => {
		server.listen(0, "127.0.0.1", () => {
			serverPort = (server.address() as any).port;
			resolve();
		});
	});
});

afterAll(async () => {
	server?.close();

	if (disputeId) {
		await prisma.notification.deleteMany({
			where: { OR: [{ user_id: farmerId }, { user_id: consumerId }] },
		});
		await prisma.walletTransaction.deleteMany({
			where: { OR: [{ user_id: farmerId }, { user_id: consumerId }] },
		});
		await prisma.dispute.deleteMany({ where: { id: disputeId } });
	}
	if (contractId) {
		await prisma.escrowLedger.deleteMany({
			where: { contract_id: contractId },
		});
		await prisma.contract.deleteMany({ where: { id: contractId } });
	}
	await prisma.farmListing.deleteMany({ where: { id: listingId } });
	await prisma.user.deleteMany({
		where: { id: { in: [farmerId, consumerId, adminId] } },
	});
	await prisma.$disconnect();
});

describe("Dispute Flow Integration", () => {
	it("freeze escrow → contract.status becomes DISPUTED (Req 15.1)", async () => {
		await freezeEscrow(contractId, 300);

		const contract = await prisma.contract.findUnique({
			where: { id: contractId },
		});
		expect(contract?.status).toBe("DISPUTED");
		expect(contract?.escrow_frozen).toBeCloseTo(300, 5);
	});

	it("creates a dispute record for the frozen contract", async () => {
		const dispute = await createDispute(consumerId, {
			contract_id: contractId,
			reason: "QUALITY_ISSUE",
			description: "Test dispute for integration",
		});
		disputeId = dispute.id;
		expect(dispute.status).toBe("OPEN");
		expect(dispute.contract_id).toBe(contractId);
	});

	it("resolve with RELEASE_TO_FARMER → farmer wallet credited, contract COMPLETED (Req 15.2)", async () => {
		const farmerBalanceBefore = await prisma.walletTransaction.findFirst({
			where: { user_id: farmerId },
			orderBy: { created_at: "desc" },
		});
		const prevBalance = farmerBalanceBefore?.balance_after ?? 0;

		await resolveDispute(disputeId, adminId, {
			resolution: "Farmer delivered quality produce",
			outcome: "RELEASE_TO_FARMER",
		});

		const contract = await prisma.contract.findUnique({
			where: { id: contractId },
		});
		expect(contract?.status).toBe("COMPLETED");

		const farmerTx = await prisma.walletTransaction.findFirst({
			where: { user_id: farmerId },
			orderBy: { created_at: "desc" },
		});
		expect(farmerTx?.amount).toBeCloseTo(300, 5);
		expect(farmerTx?.balance_after).toBeCloseTo(prevBalance + 300, 5);
	});

	it("attempting to resolve an already-resolved dispute throws BadRequestError (Req 15.4)", async () => {
		await expect(
			resolveDispute(disputeId, adminId, {
				resolution: "Trying again",
				outcome: "RELEASE_TO_FARMER",
			}),
		).rejects.toThrow(BadRequestError);
	});
});

describe("Dispute — REFUND_TO_CONSUMER flow (Req 15.3)", () => {
	let contract2Id: string;
	let dispute2Id: string;

	beforeAll(async () => {
		// Create a fresh contract for the refund test
		const tomorrow = new Date(Date.now() + 86400000);
		const nextMonth = new Date(Date.now() + 30 * 86400000);

		const contract2 = await createContract(consumerId, {
			listing_id: listingId,
			crop: "rice",
			acreage: 3,
			price_per_acre: 100,
			start_date: tomorrow.toISOString(),
			end_date: nextMonth.toISOString(),
		});
		contract2Id = contract2.id;
		await acceptContract(contract2Id, farmerId);
		await createEscrowDeposit(contract2Id, consumerId, 150);
		await freezeEscrow(contract2Id, 150);

		const dispute2 = await createDispute(consumerId, {
			contract_id: contract2Id,
			reason: "QUALITY_ISSUE",
			description: "Refund test dispute",
		});
		dispute2Id = dispute2.id;
	});

	afterAll(async () => {
		await prisma.notification.deleteMany({
			where: { OR: [{ user_id: farmerId }, { user_id: consumerId }] },
		});
		await prisma.walletTransaction.deleteMany({
			where: { user_id: consumerId },
		});
		await prisma.dispute.deleteMany({ where: { id: dispute2Id } });
		await prisma.escrowLedger.deleteMany({
			where: { contract_id: contract2Id },
		});
		await prisma.contract.deleteMany({ where: { id: contract2Id } });
	});

	it("resolve with REFUND_TO_CONSUMER → consumer wallet credited, contract CANCELLED (Req 15.3)", async () => {
		const consumerBalanceBefore = await prisma.walletTransaction.findFirst({
			where: { user_id: consumerId },
			orderBy: { created_at: "desc" },
		});
		const prevBalance = consumerBalanceBefore?.balance_after ?? 0;

		await resolveDispute(dispute2Id, adminId, {
			resolution: "Consumer refunded due to quality issues",
			outcome: "REFUND_TO_CONSUMER",
		});

		const contract2 = await prisma.contract.findUnique({
			where: { id: contract2Id },
		});
		expect(contract2?.status).toBe("CANCELLED");

		const consumerTx = await prisma.walletTransaction.findFirst({
			where: { user_id: consumerId },
			orderBy: { created_at: "desc" },
		});
		expect(consumerTx?.amount).toBeCloseTo(150, 5);
		expect(consumerTx?.balance_after).toBeCloseTo(prevBalance + 150, 5);
	});
});

describe("Dispute — Authorization (Req 15.5)", () => {
	it("non-admin user cannot call resolve endpoint → 401/403", async () => {
		const nonAdminToken = makeToken(consumerId, "CONSUMER");
		const response = await httpPost(
			serverPort,
			`/api/disputes/${disputeId}/resolve`,
			{
				resolution: "Unauthorized attempt",
				outcome: "RELEASE_TO_FARMER",
			},
			nonAdminToken,
		);
		expect([401, 403]).toContain(response.status);
	});

	it("unauthenticated request to resolve endpoint → 401", async () => {
		const response = await httpPost(
			serverPort,
			`/api/disputes/${disputeId}/resolve`,
			{ resolution: "No token", outcome: "RELEASE_TO_FARMER" },
		);
		expect(response.status).toBe(401);
	});
});

/**
 * Payment Service Tests
 * Covers: Requirements 12.1, 12.2, 12.3
 * Property 20: Payment Signature Verification
 */
import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import crypto from "crypto";

// vi.mock is hoisted — use literal values only inside the factory
vi.mock("@/config/env", () => ({
	env: {
		razorpay: {
			keyId: "test_key_id",
			keySecret: "test_razorpay_secret",
			webhookSecret: "test_webhook_secret",
			fundAccountNumber: "test_fund_account",
		},
		redis: {
			url: "http://localhost",
			token: "test-redis-token",
		},
	},
}));

vi.mock("@upstash/redis", () => ({
	Redis: vi.fn().mockImplementation(() => ({
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
	})),
}));

vi.mock("razorpay", () => ({
	default: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@/config/database", () => ({
	prisma: { user: { update: vi.fn() } },
}));

import { verifyRazorpaySignature } from "@/modules/payment/payment.service";

// Must match the literal in the mock above
const TEST_KEY_SECRET = "test_razorpay_secret";

const computeExpectedSignature = (orderId: string, paymentId: string): string =>
	crypto
		.createHmac("sha256", TEST_KEY_SECRET)
		.update(`${orderId}|${paymentId}`)
		.digest("hex");

// ---------------------------------------------------------------------------
// Example-based tests
// ---------------------------------------------------------------------------
describe("verifyRazorpaySignature", () => {
	it("returns true for a correctly computed HMAC-SHA256 signature (Req 12.1)", () => {
		const orderId = "order_abc123";
		const paymentId = "pay_xyz789";
		const signature = computeExpectedSignature(orderId, paymentId);

		expect(verifyRazorpaySignature(orderId, paymentId, signature)).toBe(
			true,
		);
	});

	it("returns false for a tampered signature (Req 12.2)", () => {
		const orderId = "order_abc123";
		const paymentId = "pay_xyz789";
		const tamperedSignature = "deadbeefdeadbeefdeadbeefdeadbeef";

		expect(
			verifyRazorpaySignature(orderId, paymentId, tamperedSignature),
		).toBe(false);
	});

	it("returns false for an empty signature (Req 12.3)", () => {
		expect(verifyRazorpaySignature("order_abc123", "pay_xyz789", "")).toBe(
			false,
		);
	});

	it("returns false when orderId differs from what was signed", () => {
		const paymentId = "pay_xyz789";
		const signature = computeExpectedSignature("order_original", paymentId);

		expect(
			verifyRazorpaySignature("order_tampered", paymentId, signature),
		).toBe(false);
	});

	it("returns false when paymentId differs from what was signed", () => {
		const orderId = "order_abc123";
		const signature = computeExpectedSignature(orderId, "pay_original");

		expect(
			verifyRazorpaySignature(orderId, "pay_tampered", signature),
		).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Property 20: Payment Signature Verification
// Validates: Requirements 12.1, 12.2
// ---------------------------------------------------------------------------
describe("Property 20: verifyRazorpaySignature returns true iff signature matches HMAC-SHA256", () => {
	it("returns true for any orderId/paymentId with the correct signature", () => {
		fc.assert(
			fc.property(fc.string(), fc.string(), (orderId, paymentId) => {
				const correctSig = computeExpectedSignature(orderId, paymentId);
				expect(
					verifyRazorpaySignature(orderId, paymentId, correctSig),
				).toBe(true);
			}),
			{ numRuns: 100 },
		);
	});

	it("returns false for any signature that is not the correct HMAC", () => {
		fc.assert(
			fc.property(
				fc.string(),
				fc.string(),
				fc.string(),
				(orderId, paymentId, wrongSig) => {
					const correctSig = computeExpectedSignature(
						orderId,
						paymentId,
					);
					if (wrongSig === correctSig) return; // skip collision (astronomically rare)

					expect(
						verifyRazorpaySignature(orderId, paymentId, wrongSig),
					).toBe(false);
				},
			),
			{ numRuns: 100 },
		);
	});
});

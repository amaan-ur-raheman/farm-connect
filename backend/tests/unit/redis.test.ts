/**
 * Redis / OTP Rate Limit Tests
 * Covers: Requirements 13.1, 13.2, 13.3
 * Property 21: OTP Rate Limit Enforcement
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// In-memory counter store used by the mock
const counterStore: Record<string, number> = {};

vi.mock("@upstash/redis", () => ({
	Redis: vi.fn().mockImplementation(() => ({
		get: vi.fn(async (key: string) => counterStore[key] ?? null),
		set: vi.fn(),
		incr: vi.fn(async (key: string) => {
			counterStore[key] = (counterStore[key] ?? 0) + 1;
			return counterStore[key];
		}),
		expire: vi.fn(),
		del: vi.fn(async (key: string) => {
			delete counterStore[key];
		}),
	})),
}));

vi.mock("@/config/env", () => ({
	env: {
		redis: { url: "http://localhost", token: "test-token" },
	},
}));

import { checkOtpRateLimit } from "@/config/redis";

const resetCounter = (phone: string) => {
	delete counterStore[`otp_limit:${phone}`];
};

beforeEach(() => {
	// Clear all counters before each test
	Object.keys(counterStore).forEach((k) => delete counterStore[k]);
});

// ---------------------------------------------------------------------------
// Example-based tests
// ---------------------------------------------------------------------------
describe("checkOtpRateLimit", () => {
	it("returns true for the first 5 calls within the window (Req 13.1)", async () => {
		const phone = "+1234567890";
		for (let i = 0; i < 5; i++) {
			const result = await checkOtpRateLimit(phone);
			expect(result).toBe(true);
		}
	});

	it("returns false on the 6th call within the same window (Req 13.2)", async () => {
		const phone = "+1234567891";
		for (let i = 0; i < 5; i++) {
			await checkOtpRateLimit(phone);
		}
		const result = await checkOtpRateLimit(phone);
		expect(result).toBe(false);
	});

	it("returns true again after the TTL window resets (Req 13.3)", async () => {
		const phone = "+1234567892";
		// Exhaust the limit
		for (let i = 0; i < 5; i++) {
			await checkOtpRateLimit(phone);
		}
		expect(await checkOtpRateLimit(phone)).toBe(false);

		// Simulate TTL expiry by resetting the counter
		resetCounter(phone);

		expect(await checkOtpRateLimit(phone)).toBe(true);
	});

	it("tracks limits independently per phone number", async () => {
		const phone1 = "+1111111111";
		const phone2 = "+2222222222";

		// Exhaust phone1
		for (let i = 0; i < 5; i++) {
			await checkOtpRateLimit(phone1);
		}

		// phone2 should still be allowed
		expect(await checkOtpRateLimit(phone2)).toBe(true);
		// phone1 should be blocked
		expect(await checkOtpRateLimit(phone1)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Property 21: OTP Rate Limit Enforcement
// Validates: Requirements 13.1, 13.2, 13.3
// ---------------------------------------------------------------------------
describe("Property 21: OTP rate limit allows first 5 calls and blocks the 6th", () => {
	it("holds for any phone number string", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 7, maxLength: 15 }),
				async (phone) => {
					// Reset counter for this phone before each run
					resetCounter(phone);

					// First 5 calls must return true
					for (let i = 0; i < 5; i++) {
						const result = await checkOtpRateLimit(phone);
						if (!result) return false;
					}

					// 6th call must return false
					const blocked = await checkOtpRateLimit(phone);
					if (blocked) return false;

					// Reset and verify it works again
					resetCounter(phone);
					const afterReset = await checkOtpRateLimit(phone);
					return afterReset === true;
				},
			),
			{ numRuns: 100 },
		);
	});
});

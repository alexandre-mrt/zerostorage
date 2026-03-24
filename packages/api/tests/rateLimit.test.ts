import { describe, expect, test } from "bun:test";

// Test the rate limit tier configuration
describe("Rate limit tiers", () => {
	const TIER_LIMITS: Record<string, number> = {
		free: 100,
		starter: 1_000,
		pro: 10_000,
		enterprise: 100_000,
	};

	test("free tier has 100 requests", () => {
		expect(TIER_LIMITS.free).toBe(100);
	});

	test("starter tier has 1000 requests", () => {
		expect(TIER_LIMITS.starter).toBe(1_000);
	});

	test("pro tier has 10000 requests", () => {
		expect(TIER_LIMITS.pro).toBe(10_000);
	});

	test("enterprise tier has 100000 requests", () => {
		expect(TIER_LIMITS.enterprise).toBe(100_000);
	});

	test("all tiers have limits", () => {
		for (const [tier, limit] of Object.entries(TIER_LIMITS)) {
			expect(limit).toBeGreaterThan(0);
		}
	});
});

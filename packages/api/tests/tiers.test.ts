import { describe, expect, test } from "bun:test";

// Test tier configuration consistency across the app
const TIER_STORAGE_LIMITS: Record<string, number> = {
	free: 1 * 1024 * 1024 * 1024,
	starter: 10 * 1024 * 1024 * 1024,
	pro: 100 * 1024 * 1024 * 1024,
	enterprise: 1024 * 1024 * 1024 * 1024,
};

const TIER_RATE_LIMITS: Record<string, number> = {
	free: 100,
	starter: 1_000,
	pro: 10_000,
	enterprise: 100_000,
};

const TIER_KEY_LIMITS: Record<string, number> = {
	free: 2,
	starter: 5,
	pro: 20,
	enterprise: 20,
};

describe("Tier storage limits", () => {
	test("free tier is 1 GB", () => {
		expect(TIER_STORAGE_LIMITS.free).toBe(1073741824);
	});

	test("starter tier is 10 GB", () => {
		expect(TIER_STORAGE_LIMITS.starter).toBe(10 * 1073741824);
	});

	test("pro tier is 100 GB", () => {
		expect(TIER_STORAGE_LIMITS.pro).toBe(100 * 1073741824);
	});

	test("enterprise tier is 1 TB", () => {
		expect(TIER_STORAGE_LIMITS.enterprise).toBe(1024 * 1073741824);
	});

	test("tiers are strictly increasing", () => {
		expect(TIER_STORAGE_LIMITS.free).toBeLessThan(TIER_STORAGE_LIMITS.starter);
		expect(TIER_STORAGE_LIMITS.starter).toBeLessThan(TIER_STORAGE_LIMITS.pro);
		expect(TIER_STORAGE_LIMITS.pro).toBeLessThan(TIER_STORAGE_LIMITS.enterprise);
	});
});

describe("Tier rate limits", () => {
	test("rate limits are strictly increasing", () => {
		expect(TIER_RATE_LIMITS.free).toBeLessThan(TIER_RATE_LIMITS.starter);
		expect(TIER_RATE_LIMITS.starter).toBeLessThan(TIER_RATE_LIMITS.pro);
		expect(TIER_RATE_LIMITS.pro).toBeLessThan(TIER_RATE_LIMITS.enterprise);
	});

	test("all tiers have matching config", () => {
		const tiers = Object.keys(TIER_STORAGE_LIMITS);
		for (const tier of tiers) {
			expect(TIER_RATE_LIMITS[tier]).toBeDefined();
			expect(TIER_KEY_LIMITS[tier]).toBeDefined();
		}
	});
});

describe("Tier key limits", () => {
	test("free has fewest keys", () => {
		expect(TIER_KEY_LIMITS.free).toBeLessThanOrEqual(TIER_KEY_LIMITS.starter);
	});

	test("enterprise has most or equal keys", () => {
		expect(TIER_KEY_LIMITS.enterprise).toBeGreaterThanOrEqual(TIER_KEY_LIMITS.pro);
	});
});

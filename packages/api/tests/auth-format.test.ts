import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

const API_SECRET = process.env.API_SECRET || "zerostorage-dev-secret";

function hashApiKey(key: string): string {
	return createHash("sha256").update(`${key}:${API_SECRET}`).digest("hex");
}

describe("API key hashing", () => {
	test("includes secret in hash", () => {
		const withSecret = hashApiKey("zs_test");
		const without = createHash("sha256").update("zs_test").digest("hex");
		expect(withSecret).not.toBe(without);
	});

	test("hash is 64 hex chars", () => {
		expect(hashApiKey("zs_anything")).toMatch(/^[a-f0-9]{64}$/);
	});
});

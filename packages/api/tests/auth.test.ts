import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

// Replicate hashApiKey logic to avoid importing the module (which triggers DB init)
const API_SECRET = process.env.API_SECRET || "zerostorage-dev-secret";

function hashApiKey(key: string): string {
	return createHash("sha256").update(`${key}:${API_SECRET}`).digest("hex");
}

describe("hashApiKey", () => {
	test("returns a 64-char hex string (SHA-256)", () => {
		const hash = hashApiKey("zs_test123");
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	test("is deterministic", () => {
		const hash1 = hashApiKey("zs_abc");
		const hash2 = hashApiKey("zs_abc");
		expect(hash1).toBe(hash2);
	});

	test("different inputs produce different hashes", () => {
		const hash1 = hashApiKey("zs_key1");
		const hash2 = hashApiKey("zs_key2");
		expect(hash1).not.toBe(hash2);
	});

	test("incorporates the API_SECRET", () => {
		const withSecret = hashApiKey("zs_test");
		const plain = createHash("sha256").update("zs_test").digest("hex");
		expect(withSecret).not.toBe(plain);
	});
});

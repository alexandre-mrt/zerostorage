import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.DATABASE_URL = ":memory:";

const { authMiddleware } = await import("../src/middleware/auth");
const { rateLimitMiddleware } = await import("../src/middleware/rateLimit");
const { adminRouter } = await import("../src/routes/admin");
const { filesRouter } = await import("../src/routes/files");
const { keysRouter } = await import("../src/routes/keys");
const { usageRouter } = await import("../src/routes/usage");

const app = new Hono();
app.route("/admin", adminRouter);
const api = new Hono();
api.use("*", authMiddleware);
api.use("*", rateLimitMiddleware);
api.route("/files", filesRouter);
api.route("/keys", keysRouter);
api.route("/usage", usageRouter);
app.route("/api/v1", api);

describe("End-to-end: bootstrap -> keys -> usage", () => {
	test("full user journey", async () => {
		// 1. Bootstrap user
		const bootstrapRes = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Admin-Secret": "zerostorage-admin-dev",
			},
			body: JSON.stringify({ email: `e2e-${Date.now()}@test.com`, tier: "starter" }),
		});
		expect(bootstrapRes.status).toBe(201);
		const { apiKey, tier } = (await bootstrapRes.json()).data;
		expect(tier).toBe("starter");
		expect(apiKey).toMatch(/^zs_/);

		// 2. Check usage (should be empty)
		const usageRes = await app.request("/api/v1/usage", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(usageRes.status).toBe(200);
		const usage = (await usageRes.json()).data;
		expect(usage.storage.filesCount).toBe(0);
		expect(usage.tier).toBe("starter");

		// 3. Create additional key
		const keyRes = await app.request("/api/v1/keys", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: "E2E Key" }),
		});
		expect(keyRes.status).toBe(201);
		const newKey = (await keyRes.json()).data.key;

		// 4. New key works for listing files
		const filesRes = await app.request("/api/v1/files", {
			headers: { Authorization: `Bearer ${newKey}` },
		});
		expect(filesRes.status).toBe(200);

		// 5. List keys shows both
		const keysRes = await app.request("/api/v1/keys", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		const keys = (await keysRes.json()).data.keys;
		expect(keys.length).toBeGreaterThanOrEqual(2);
	});

	test("concurrent bootstraps with same email fail gracefully", async () => {
		const email = `concurrent-${Date.now()}@test.com`;
		const headers = {
			"Content-Type": "application/json",
			"X-Admin-Secret": "zerostorage-admin-dev",
		};

		const results = await Promise.all([
			app.request("/admin/bootstrap", { method: "POST", headers, body: JSON.stringify({ email }) }),
			app.request("/admin/bootstrap", { method: "POST", headers, body: JSON.stringify({ email }) }),
		]);

		const statuses = results.map((r) => r.status);
		// One should succeed (201), one should fail (409)
		expect(statuses).toContain(201);
		expect(statuses).toContain(409);
	});

	test("different tiers get different rate limits", async () => {
		// Create free and pro users
		const freeRes = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Admin-Secret": "zerostorage-admin-dev" },
			body: JSON.stringify({ email: `free-rl-${Date.now()}@test.com`, tier: "free" }),
		});
		const proRes = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Admin-Secret": "zerostorage-admin-dev" },
			body: JSON.stringify({ email: `pro-rl-${Date.now()}@test.com`, tier: "pro" }),
		});

		const freeKey = (await freeRes.json()).data.apiKey;
		const proKey = (await proRes.json()).data.apiKey;

		const freeFiles = await app.request("/api/v1/files", { headers: { Authorization: `Bearer ${freeKey}` } });
		const proFiles = await app.request("/api/v1/files", { headers: { Authorization: `Bearer ${proKey}` } });

		expect(freeFiles.headers.get("X-RateLimit-Limit")).toBe("100");
		expect(proFiles.headers.get("X-RateLimit-Limit")).toBe("10000");
	});

	test("file stats summary reflects empty storage", async () => {
		const email = `stats-${Date.now()}@test.com`;
		const bootstrapRes = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Admin-Secret": "zerostorage-admin-dev" },
			body: JSON.stringify({ email, tier: "free" }),
		});
		const key = (await bootstrapRes.json()).data.apiKey;

		const res = await app.request("/api/v1/files/stats/summary", {
			headers: { Authorization: `Bearer ${key}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data.totalFiles).toBe(0);
		expect(json.data.totalSize).toBe(0);
	});

	test("keys list returns correct shape per key", async () => {
		const email = `shape-${Date.now()}@test.com`;
		const boot = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Admin-Secret": "zerostorage-admin-dev" },
			body: JSON.stringify({ email }),
		});
		const key = (await boot.json()).data.apiKey;

		const res = await app.request("/api/v1/keys", {
			headers: { Authorization: `Bearer ${key}` },
		});
		const keys = (await res.json()).data.keys;
		expect(keys.length).toBeGreaterThanOrEqual(1);
		const k = keys[0];
		expect(k).toHaveProperty("id");
		expect(k).toHaveProperty("keyPrefix");
		expect(k).toHaveProperty("name");
		expect(k).toHaveProperty("createdAt");
		expect(k.keyPrefix).toMatch(/^zs_/);
	});
});

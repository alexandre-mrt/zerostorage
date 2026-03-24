import { describe, expect, test, beforeAll } from "bun:test";
import { Hono } from "hono";
import { authMiddleware } from "../src/middleware/auth";
import { rateLimitMiddleware } from "../src/middleware/rateLimit";
import { adminRouter } from "../src/routes/admin";
import { filesRouter } from "../src/routes/files";
import { keysRouter } from "../src/routes/keys";
import { usageRouter } from "../src/routes/usage";

// Force in-memory DB for tests
process.env.DATABASE_URL = ":memory:";

// Re-import after env is set (db module caches the connection)
// Since db is already initialized from admin.test.ts, we can reuse

const app = new Hono();
app.route("/admin", adminRouter);

const api = new Hono();
api.use("*", authMiddleware);
api.use("*", rateLimitMiddleware);
api.route("/files", filesRouter);
api.route("/keys", keysRouter);
api.route("/usage", usageRouter);
app.route("/api/v1", api);

let apiKey: string;

beforeAll(async () => {
	// Bootstrap a test user
	const res = await app.request("/admin/bootstrap", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Admin-Secret": "zerostorage-admin-dev",
		},
		body: JSON.stringify({ email: `integration-${Date.now()}@test.com`, tier: "pro" }),
	});
	const json = await res.json();
	apiKey = json.data.apiKey;
});

describe("Auth middleware", () => {
	test("rejects request without auth header", async () => {
		const res = await app.request("/api/v1/files");
		expect(res.status).toBe(401);
	});

	test("rejects invalid key format", async () => {
		const res = await app.request("/api/v1/files", {
			headers: { Authorization: "Bearer invalid_key" },
		});
		expect(res.status).toBe(401);
	});

	test("rejects nonexistent key", async () => {
		const res = await app.request("/api/v1/files", {
			headers: { Authorization: "Bearer zs_nonexistent_key_here" },
		});
		expect(res.status).toBe(401);
	});

	test("accepts valid API key", async () => {
		const res = await app.request("/api/v1/files", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(200);
	});
});

describe("Files API", () => {
	test("GET /files returns empty list initially", async () => {
		const res = await app.request("/api/v1/files", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.files).toEqual([]);
	});

	test("POST /files/upload rejects without file", async () => {
		const res = await app.request("/api/v1/files/upload", {
			method: "POST",
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(400);
	});

	test("GET /files supports pagination edge cases", async () => {
		// page=0 should clamp to 1, limit=-1 should clamp to 1
		const res = await app.request("/api/v1/files?page=0&limit=-1", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data.page).toBe(1);
		expect(json.data.limit).toBe(1);
	});

	test("GET /files supports NaN pagination", async () => {
		const res = await app.request("/api/v1/files?page=abc&limit=xyz", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data.page).toBe(1);
		expect(json.data.limit).toBe(20);
	});

	test("GET /files/:hash/status returns 404 for unknown hash", async () => {
		const res = await app.request("/api/v1/files/nonexistent/status", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(404);
	});

	test("DELETE /files/:hash returns 404 for unknown hash", async () => {
		const res = await app.request("/api/v1/files/nonexistent", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(404);
	});
});

describe("Keys API", () => {
	test("GET /keys returns existing keys", async () => {
		const res = await app.request("/api/v1/keys", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.keys.length).toBeGreaterThan(0);
	});

	test("POST /keys creates a new key", async () => {
		const res = await app.request("/api/v1/keys", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: "Test Key" }),
		});
		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.key).toMatch(/^zs_/);
		expect(json.data.name).toBe("Test Key");
	});

	test("POST /keys rejects without name", async () => {
		const res = await app.request("/api/v1/keys", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({}),
		});
		expect(res.status).toBe(400);
	});

	test("POST /keys rejects empty name", async () => {
		const res = await app.request("/api/v1/keys", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: "   " }),
		});
		expect(res.status).toBe(400);
	});

	test("POST /keys rejects name over 100 chars", async () => {
		const res = await app.request("/api/v1/keys", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: "x".repeat(101) }),
		});
		expect(res.status).toBe(400);
	});

	test("DELETE /keys/:id revokes a key", async () => {
		// Create a key to revoke
		const createRes = await app.request("/api/v1/keys", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: "ToRevoke" }),
		});
		const created = await createRes.json();
		const keyId = created.data.id;

		const res = await app.request(`/api/v1/keys/${keyId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data.message).toContain("revoked");
	});

	test("DELETE /keys/:id returns 404 for nonexistent", async () => {
		const res = await app.request("/api/v1/keys/nonexistent", {
			method: "DELETE",
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(404);
	});
});

describe("Usage API", () => {
	test("GET /usage returns stats", async () => {
		const res = await app.request("/api/v1/usage", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data).toHaveProperty("storage");
		expect(json.data).toHaveProperty("bandwidth");
		expect(json.data).toHaveProperty("tier");
		expect(json.data.tier).toBe("pro");
	});
});

describe("Rate limiting headers", () => {
	test("includes rate limit headers", async () => {
		const res = await app.request("/api/v1/files", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy();
		expect(res.headers.get("X-RateLimit-Remaining")).toBeTruthy();
	});
});

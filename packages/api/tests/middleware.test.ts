import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.DATABASE_URL = ":memory:";

const { authMiddleware } = await import("../src/middleware/auth");
const { rateLimitMiddleware } = await import("../src/middleware/rateLimit");

const app = new Hono();
app.use("*", authMiddleware);
app.use("*", rateLimitMiddleware);
app.get("/test", (c) => c.json({ ok: true }));

describe("Auth middleware edge cases", () => {
	test("rejects missing Authorization header", async () => {
		const res = await app.request("/test");
		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json.error).toContain("Authorization");
	});

	test("rejects Bearer without token", async () => {
		const res = await app.request("/test", {
			headers: { Authorization: "Bearer " },
		});
		expect(res.status).toBe(401);
	});

	test("rejects non-Bearer auth", async () => {
		const res = await app.request("/test", {
			headers: { Authorization: "Basic abc123" },
		});
		expect(res.status).toBe(401);
	});

	test("rejects key without zs_ prefix", async () => {
		const res = await app.request("/test", {
			headers: { Authorization: "Bearer sk_invalidprefix" },
		});
		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json.error).toContain("format");
	});

	test("rejects valid-format but nonexistent key", async () => {
		const res = await app.request("/test", {
			headers: { Authorization: "Bearer zs_doesnotexist" },
		});
		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json.error).toContain("Invalid");
	});
});

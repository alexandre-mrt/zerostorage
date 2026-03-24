import { describe, expect, test, beforeAll } from "bun:test";
import { Hono } from "hono";
import { adminRouter } from "../src/routes/admin";
import { initializeDatabase } from "../src/services/db";

// Use a test database
process.env.DATABASE_URL = ":memory:";

beforeAll(() => {
	initializeDatabase();
});

const app = new Hono();
app.route("/admin", adminRouter);

describe("Admin API", () => {
	test("GET /admin/health returns ok", async () => {
		const res = await app.request("/admin/health");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.status).toBe("ok");
		expect(json.data.version).toBe("0.1.0");
	});

	test("POST /admin/bootstrap rejects without admin secret", async () => {
		const res = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "test@test.com" }),
		});
		expect(res.status).toBe(401);
	});

	test("POST /admin/bootstrap rejects without email", async () => {
		const res = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Admin-Secret": "zerostorage-admin-dev",
			},
			body: JSON.stringify({}),
		});
		expect(res.status).toBe(400);
	});

	test("POST /admin/bootstrap creates user with API key", async () => {
		const res = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Admin-Secret": "zerostorage-admin-dev",
			},
			body: JSON.stringify({ email: `admin-test-${Date.now()}@example.com`, tier: "pro" }),
		});
		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.email).toContain("admin-test-");
		expect(json.data.tier).toBe("pro");
		expect(json.data.apiKey).toMatch(/^zs_/);
		expect(json.data.userId).toBeTruthy();
	});

	test("POST /admin/bootstrap defaults to free tier", async () => {
		const res = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Admin-Secret": "zerostorage-admin-dev",
			},
			body: JSON.stringify({ email: `free-${Date.now()}@example.com` }),
		});
		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.data.tier).toBe("free");
	});
});

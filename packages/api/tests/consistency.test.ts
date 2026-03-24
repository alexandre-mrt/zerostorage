import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.DATABASE_URL = ":memory:";

const { adminRouter } = await import("../src/routes/admin");
const { authMiddleware } = await import("../src/middleware/auth");
const { filesRouter } = await import("../src/routes/files");
const { keysRouter } = await import("../src/routes/keys");
const { usageRouter } = await import("../src/routes/usage");

const app = new Hono();
app.route("/admin", adminRouter);

const api = new Hono();
api.use("*", authMiddleware);
api.route("/files", filesRouter);
api.route("/keys", keysRouter);
api.route("/usage", usageRouter);
app.route("/api/v1", api);

// Bootstrap a user
let apiKey: string;
const setup = async () => {
	const res = await app.request("/admin/bootstrap", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Admin-Secret": "zerostorage-admin-dev",
		},
		body: JSON.stringify({ email: `consistency-${Date.now()}@test.com`, tier: "pro" }),
	});
	apiKey = (await res.json()).data.apiKey;
};

describe("API response envelope consistency", () => {
	test("all success responses have { success: true, data }", async () => {
		await setup();

		const endpoints = [
			{ path: "/api/v1/files", method: "GET" },
			{ path: "/api/v1/keys", method: "GET" },
			{ path: "/api/v1/usage", method: "GET" },
		];

		for (const ep of endpoints) {
			const res = await app.request(ep.path, {
				method: ep.method,
				headers: { Authorization: `Bearer ${apiKey}` },
			});
			const json = await res.json();
			expect(json).toHaveProperty("success", true);
			expect(json).toHaveProperty("data");
			expect(json.error).toBeUndefined();
		}
	});

	test("all error responses have { success: false, error }", async () => {
		const errorEndpoints = [
			{ path: "/api/v1/files", method: "GET" }, // no auth
			{ path: "/api/v1/files/nonexistent/status", method: "GET", auth: true },
		];

		// No auth
		const noAuth = await app.request("/api/v1/files");
		const noAuthJson = await noAuth.json();
		expect(noAuthJson.success).toBe(false);
		expect(noAuthJson).toHaveProperty("error");
		expect(typeof noAuthJson.error).toBe("string");

		// 404
		const notFound = await app.request("/api/v1/files/nonexistent/status", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		const notFoundJson = await notFound.json();
		expect(notFoundJson.success).toBe(false);
		expect(notFoundJson).toHaveProperty("error");
	});

	test("health endpoint follows same envelope", async () => {
		const res = await app.request("/admin/health");
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data).toHaveProperty("status");
		expect(json.data).toHaveProperty("version");
	});

	test("all JSON responses have correct content-type", async () => {
		const endpoints = [
			{ path: "/admin/health", auth: false },
			{ path: "/api/v1/files", auth: true },
			{ path: "/api/v1/keys", auth: true },
			{ path: "/api/v1/usage", auth: true },
		];

		for (const ep of endpoints) {
			const headers: Record<string, string> = {};
			if (ep.auth) headers.Authorization = `Bearer ${apiKey}`;
			const res = await app.request(ep.path, { headers });
			expect(res.headers.get("content-type")).toContain("application/json");
		}
	});
});

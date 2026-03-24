import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.DATABASE_URL = ":memory:";

// Import the full app setup
const { adminRouter } = await import("../src/routes/admin");

const app = new Hono();
app.route("/admin", adminRouter);
app.get("/", (c) =>
	c.json({
		name: "ZeroStore API",
		version: "0.1.0",
		description: "The fastest way to store files on 0G decentralized storage",
		docs: "/api/v1",
		health: "/admin/health",
	}),
);

describe("Root endpoint", () => {
	test("GET / returns API info", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.name).toBe("ZeroStore API");
		expect(json.version).toBe("0.1.0");
		expect(json.docs).toBe("/api/v1");
		expect(json.health).toBe("/admin/health");
	});
});

describe("Health endpoint", () => {
	test("GET /admin/health returns version", async () => {
		const res = await app.request("/admin/health");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data.version).toBe("0.1.0");
		expect(json.data.status).toBe("ok");
		expect(json.data.timestamp).toBeTruthy();
		// Timestamp should be a valid ISO string
		expect(new Date(json.data.timestamp).getTime()).toBeGreaterThan(0);
	});

	test("health timestamp is recent (within 5 seconds)", async () => {
		const res = await app.request("/admin/health");
		const json = await res.json();
		const ts = new Date(json.data.timestamp).getTime();
		const now = Date.now();
		expect(Math.abs(now - ts)).toBeLessThan(5000);
	});

	test("health returns JSON content-type", async () => {
		const res = await app.request("/admin/health");
		expect(res.headers.get("content-type")).toContain("json");
	});
});

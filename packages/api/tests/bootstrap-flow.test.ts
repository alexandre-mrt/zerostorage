import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.DATABASE_URL = ":memory:";
const { adminRouter } = await import("../src/routes/admin");

const app = new Hono();
app.route("/admin", adminRouter);

const headers = { "Content-Type": "application/json", "X-Admin-Secret": "zerostorage-admin-dev" };

describe("Bootstrap flow details", () => {
	test("returns userId as non-empty string", async () => {
		const res = await app.request("/admin/bootstrap", {
			method: "POST", headers,
			body: JSON.stringify({ email: `uid-${Date.now()}@test.com` }),
		});
		const json = await res.json();
		expect(json.data.userId.length).toBeGreaterThan(5);
	});

	test("returns message about saving key", async () => {
		const res = await app.request("/admin/bootstrap", {
			method: "POST", headers,
			body: JSON.stringify({ email: `msg-${Date.now()}@test.com` }),
		});
		const json = await res.json();
		expect(json.data.message).toContain("Save");
	});

	test("API key length is consistent", async () => {
		const res = await app.request("/admin/bootstrap", {
			method: "POST", headers,
			body: JSON.stringify({ email: `len-${Date.now()}@test.com` }),
		});
		const key = (await res.json()).data.apiKey;
		expect(key.length).toBeGreaterThan(20);
		expect(key.length).toBeLessThan(60);
	});
});

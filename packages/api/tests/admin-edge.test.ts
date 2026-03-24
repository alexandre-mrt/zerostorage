import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.DATABASE_URL = ":memory:";
const { adminRouter } = await import("../src/routes/admin");
const app = new Hono();
app.route("/admin", adminRouter);

describe("Admin edge cases", () => {
	test("wrong admin secret is 401", async () => {
		const res = await app.request("/admin/bootstrap", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Admin-Secret": "wrong" },
			body: JSON.stringify({ email: "test@test.com" }),
		});
		expect(res.status).toBe(401);
	});

	test("GET on bootstrap returns 404", async () => {
		const res = await app.request("/admin/bootstrap");
		expect(res.status).toBe(404);
	});

	test("health is idempotent", async () => {
		const r1 = await (await app.request("/admin/health")).json();
		const r2 = await (await app.request("/admin/health")).json();
		expect(r1.data.status).toBe(r2.data.status);
		expect(r1.data.version).toBe(r2.data.version);
	});
});

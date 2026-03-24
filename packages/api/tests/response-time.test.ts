import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.DATABASE_URL = ":memory:";
const { adminRouter } = await import("../src/routes/admin");
const app = new Hono();
app.route("/admin", adminRouter);

describe("Response time", () => {
	test("health responds under 50ms", async () => {
		const start = Date.now();
		await app.request("/admin/health");
		expect(Date.now() - start).toBeLessThan(50);
	});

	test("health returns 200 consistently", async () => {
		for (let i = 0; i < 5; i++) {
			const res = await app.request("/admin/health");
			expect(res.status).toBe(200);
		}
	});
});

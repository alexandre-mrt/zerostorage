import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.DATABASE_URL = ":memory:";
const { adminRouter } = await import("../src/routes/admin");
const app = new Hono();
app.route("/admin", adminRouter);

describe("Health response shape", () => {
	test("has exactly 3 data fields", async () => {
		const json = await (await app.request("/admin/health")).json();
		const keys = Object.keys(json.data);
		expect(keys).toContain("status");
		expect(keys).toContain("version");
		expect(keys).toContain("timestamp");
		expect(keys.length).toBe(3);
	});
});

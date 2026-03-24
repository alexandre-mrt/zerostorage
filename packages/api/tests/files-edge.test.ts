import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.DATABASE_URL = ":memory:";

const { authMiddleware } = await import("../src/middleware/auth");
const { adminRouter } = await import("../src/routes/admin");
const { filesRouter } = await import("../src/routes/files");

const app = new Hono();
app.route("/admin", adminRouter);
const api = new Hono();
api.use("*", authMiddleware);
api.route("/files", filesRouter);
app.route("/api/v1", api);

let apiKey: string;
const setup = async () => {
	const res = await app.request("/admin/bootstrap", {
		method: "POST",
		headers: { "Content-Type": "application/json", "X-Admin-Secret": "zerostorage-admin-dev" },
		body: JSON.stringify({ email: `files-edge-${Date.now()}@test.com` }),
	});
	apiKey = (await res.json()).data.apiKey;
};

describe("Files edge cases", () => {
	test("GET /files with high page returns empty array", async () => {
		await setup();
		const res = await app.request("/api/v1/files?page=9999", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data.files).toEqual([]);
	});

	test("GET /files default pagination", async () => {
		const res = await app.request("/api/v1/files", {
			headers: { Authorization: `Bearer ${apiKey}` },
		});
		const json = await res.json();
		expect(json.data.page).toBe(1);
		expect(json.data.limit).toBe(20);
	});
});

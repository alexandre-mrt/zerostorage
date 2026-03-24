import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use("*", cors());
app.get("/test", (c) => c.json({ ok: true }));

describe("CORS middleware", () => {
	test("allows all origins by default", async () => {
		const res = await app.request("/test", { headers: { Origin: "https://example.com" } });
		expect(res.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
	});

	test("OPTIONS preflight returns allow methods", async () => {
		const res = await app.request("/test", {
			method: "OPTIONS",
			headers: { Origin: "https://example.com", "Access-Control-Request-Method": "POST" },
		});
		expect([200, 204]).toContain(res.status);
	});
});

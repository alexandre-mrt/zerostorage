import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { securityHeaders } from "../src/middleware/security";

const app = new Hono();
app.use("*", securityHeaders);
app.get("/test", (c) => c.json({ ok: true }));

describe("Security headers middleware", () => {
	test("sets X-Content-Type-Options", async () => {
		const res = await app.request("/test");
		expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
	});

	test("sets X-Frame-Options", async () => {
		const res = await app.request("/test");
		expect(res.headers.get("X-Frame-Options")).toBe("DENY");
	});

	test("sets X-XSS-Protection", async () => {
		const res = await app.request("/test");
		expect(res.headers.get("X-XSS-Protection")).toBe("0");
	});

	test("sets Referrer-Policy", async () => {
		const res = await app.request("/test");
		expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
	});

	test("all headers present on every response", async () => {
		const res = await app.request("/test");
		const required = [
			"X-Content-Type-Options",
			"X-Frame-Options",
			"X-XSS-Protection",
			"Referrer-Policy",
		];
		for (const header of required) {
			expect(res.headers.get(header)).toBeTruthy();
		}
	});
});

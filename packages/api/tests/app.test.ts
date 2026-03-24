import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { cors } from "hono/cors";

process.env.DATABASE_URL = ":memory:";

const { adminRouter } = await import("../src/routes/admin");
const { requestIdMiddleware } = await import("../src/middleware/requestId");
const { securityHeaders } = await import("../src/middleware/security");

const app = new Hono();
app.use("*", cors());
app.use("*", requestIdMiddleware);
app.use("*", securityHeaders);

app.onError((err, c) => c.json({ success: false, error: "Internal server error" }, 500));
app.notFound((c) => c.json({ success: false, error: "Not found" }, 404));

app.route("/admin", adminRouter);
app.get("/", (c) => c.json({ name: "ZeroStore API", version: "0.1.0" }));

describe("App-level middleware stack", () => {
	test("CORS headers present on response", async () => {
		const res = await app.request("/", {
			headers: { Origin: "http://localhost:5173" },
		});
		expect(res.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
	});

	test("request ID on every response", async () => {
		const res = await app.request("/");
		expect(res.headers.get("X-Request-Id")).toBeTruthy();
	});

	test("security headers on every response", async () => {
		const res = await app.request("/");
		expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(res.headers.get("X-Frame-Options")).toBe("DENY");
	});

	test("404 handler returns JSON", async () => {
		const res = await app.request("/nonexistent/path");
		expect(res.status).toBe(404);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error).toBe("Not found");
	});

	test("404 still has security headers", async () => {
		const res = await app.request("/nonexistent");
		expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(res.headers.get("X-Request-Id")).toBeTruthy();
	});

	test("root endpoint returns API info", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.name).toBe("ZeroStore API");
		expect(json.version).toBe("0.1.0");
	});
});

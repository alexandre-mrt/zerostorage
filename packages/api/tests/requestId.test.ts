import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { requestIdMiddleware } from "../src/middleware/requestId";

const app = new Hono();
app.use("*", requestIdMiddleware);
app.get("/test", (c) => {
	return c.json({ requestId: c.get("requestId") });
});

describe("Request ID middleware", () => {
	test("generates a request ID when none provided", async () => {
		const res = await app.request("/test");
		expect(res.status).toBe(200);
		const id = res.headers.get("X-Request-Id");
		expect(id).toBeTruthy();
		expect(id!.length).toBe(12);

		const json = await res.json();
		expect(json.requestId).toBe(id);
	});

	test("uses provided request ID", async () => {
		const res = await app.request("/test", {
			headers: { "X-Request-Id": "custom-id-123" },
		});
		const id = res.headers.get("X-Request-Id");
		expect(id).toBe("custom-id-123");
	});

	test("each request gets a unique ID", async () => {
		const res1 = await app.request("/test");
		const res2 = await app.request("/test");
		const id1 = res1.headers.get("X-Request-Id");
		const id2 = res2.headers.get("X-Request-Id");
		expect(id1).not.toBe(id2);
	});
});

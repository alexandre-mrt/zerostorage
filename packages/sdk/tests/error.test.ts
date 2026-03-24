import { describe, expect, test } from "bun:test";
import { ZeroStore, ZeroStoreError } from "../src/index";

describe("ZeroStoreError hierarchy", () => {
	test("is instance of Error", () => {
		const err = new ZeroStoreError("test", 500);
		expect(err instanceof Error).toBe(true);
		expect(err instanceof ZeroStoreError).toBe(true);
	});

	test("has stack trace", () => {
		const err = new ZeroStoreError("test", 500);
		expect(err.stack).toBeTruthy();
		expect(err.stack).toContain("ZeroStoreError");
	});

	test("preserves message and status across throw/catch", () => {
		try {
			throw new ZeroStoreError("Not authorized", 403);
		} catch (e) {
			expect((e as ZeroStoreError).message).toBe("Not authorized");
			expect((e as ZeroStoreError).statusCode).toBe(403);
			expect((e as ZeroStoreError).name).toBe("ZeroStoreError");
		}
	});

	test("common HTTP status codes", () => {
		const cases = [
			{ status: 400, msg: "Bad Request" },
			{ status: 401, msg: "Unauthorized" },
			{ status: 403, msg: "Forbidden" },
			{ status: 404, msg: "Not Found" },
			{ status: 409, msg: "Conflict" },
			{ status: 413, msg: "Payload Too Large" },
			{ status: 429, msg: "Too Many Requests" },
			{ status: 500, msg: "Internal Server Error" },
		];

		for (const { status, msg } of cases) {
			const err = new ZeroStoreError(msg, status);
			expect(err.statusCode).toBe(status);
			expect(err.message).toBe(msg);
		}
	});
});

describe("SDK request failure handling", () => {
	test("timeout produces ZeroStoreError", async () => {
		const store = new ZeroStore({
			apiKey: "zs_test",
			baseUrl: "http://localhost:1",
			timeout: 500,
			retries: 0,
		});

		try {
			await store.usage();
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(ZeroStoreError);
			expect((e as ZeroStoreError).statusCode).toBe(0);
		}
	});

	test("retry count respected on failure", async () => {
		const start = Date.now();
		const store = new ZeroStore({
			apiKey: "zs_test",
			baseUrl: "http://localhost:1",
			timeout: 200,
			retries: 2,
		});

		try {
			await store.list();
		} catch {
			// 3 attempts (1 + 2 retries) with delays
			const elapsed = Date.now() - start;
			expect(elapsed).toBeGreaterThan(200); // At least some retry delay
		}
	});
});

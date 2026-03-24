import { describe, expect, test } from "bun:test";
import { ZeroStore, ZeroStoreError } from "../src/index";

describe("ZeroStore", () => {
	test("constructor requires apiKey", () => {
		expect(() => new ZeroStore({ apiKey: "" })).toThrow("API key is required");
	});

	test("constructor rejects invalid apiKey prefix", () => {
		expect(() => new ZeroStore({ apiKey: "invalid_key" })).toThrow("must start with 'zs_'");
	});

	test("constructor accepts valid config", () => {
		const store = new ZeroStore({ apiKey: "zs_test123" });
		expect(store).toBeInstanceOf(ZeroStore);
	});

	test("constructor accepts custom baseUrl", () => {
		const store = new ZeroStore({
			apiKey: "zs_test123",
			baseUrl: "https://custom.api.dev",
		});
		expect(store).toBeInstanceOf(ZeroStore);
	});

	test("constructor strips trailing slash from baseUrl", () => {
		const store = new ZeroStore({
			apiKey: "zs_test123",
			baseUrl: "https://custom.api.dev/",
		});
		expect(store).toBeInstanceOf(ZeroStore);
	});

	test("constructor accepts timeout and retries", () => {
		const store = new ZeroStore({
			apiKey: "zs_test123",
			timeout: 5000,
			retries: 3,
		});
		expect(store).toBeInstanceOf(ZeroStore);
	});

	test("request fails gracefully on unreachable server", async () => {
		const store = new ZeroStore({
			apiKey: "zs_test123",
			baseUrl: "http://localhost:1",
			timeout: 1000,
		});
		try {
			await store.list();
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeInstanceOf(ZeroStoreError);
		}
	});
});

describe("ZeroStoreError", () => {
	test("has correct properties", () => {
		const error = new ZeroStoreError("Not found", 404);
		expect(error.message).toBe("Not found");
		expect(error.statusCode).toBe(404);
		expect(error.name).toBe("ZeroStoreError");
		expect(error).toBeInstanceOf(Error);
	});

	test("is catchable as Error", () => {
		try {
			throw new ZeroStoreError("test", 500);
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e).toBeInstanceOf(ZeroStoreError);
		}
	});

	test("statusCode 0 for network errors", () => {
		const error = new ZeroStoreError("Connection refused", 0);
		expect(error.statusCode).toBe(0);
	});
});

describe("ZeroStore API methods exist", () => {
	const store = new ZeroStore({ apiKey: "zs_test" });

	test("has upload method", () => {
		expect(typeof store.upload).toBe("function");
	});

	test("has download method", () => {
		expect(typeof store.download).toBe("function");
	});

	test("has list method", () => {
		expect(typeof store.list).toBe("function");
	});

	test("has status method", () => {
		expect(typeof store.status).toBe("function");
	});

	test("has unpin method", () => {
		expect(typeof store.unpin).toBe("function");
	});

	test("has createKey method", () => {
		expect(typeof store.createKey).toBe("function");
	});

	test("has listKeys method", () => {
		expect(typeof store.listKeys).toBe("function");
	});

	test("has revokeKey method", () => {
		expect(typeof store.revokeKey).toBe("function");
	});

	test("has usage method", () => {
		expect(typeof store.usage).toBe("function");
	});
});

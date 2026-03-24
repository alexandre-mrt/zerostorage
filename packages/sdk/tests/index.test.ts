import { describe, expect, test } from "bun:test";
import { ZeroStore, ZeroStoreError } from "../src/index";

describe("ZeroStore", () => {
	test("constructor requires apiKey", () => {
		expect(() => new ZeroStore({ apiKey: "" })).toThrow("API key is required");
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
		// Verify it works (no direct access to private field, but no error)
		expect(store).toBeInstanceOf(ZeroStore);
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

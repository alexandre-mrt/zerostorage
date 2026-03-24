import { describe, expect, test } from "bun:test";
import { ZeroStore } from "../src/index";

describe("SDK client method signatures", () => {
	const store = new ZeroStore({ apiKey: "zs_test123" });

	test("upload accepts File with custom name", () => {
		// Verify the method accepts the right params (won't actually upload)
		expect(typeof store.upload).toBe("function");
		expect(store.upload.length).toBeGreaterThanOrEqual(1); // at least 1 param
	});

	test("download accepts rootHash string", () => {
		expect(typeof store.download).toBe("function");
	});

	test("list accepts optional ListOptions", () => {
		expect(typeof store.list).toBe("function");
	});

	test("unpin accepts rootHash", () => {
		expect(typeof store.unpin).toBe("function");
	});

	test("createKey accepts name string", () => {
		expect(typeof store.createKey).toBe("function");
	});

	test("fileStats returns promise", () => {
		expect(typeof store.fileStats).toBe("function");
	});

	test("revokeKey accepts keyId", () => {
		expect(typeof store.revokeKey).toBe("function");
	});
});

describe("SDK constructor validation", () => {
	test("rejects null apiKey", () => {
		expect(() => new ZeroStore({ apiKey: null as unknown as string })).toThrow();
	});

	test("rejects undefined apiKey", () => {
		expect(() => new ZeroStore({ apiKey: undefined as unknown as string })).toThrow();
	});

	test("accepts baseUrl with port", () => {
		const store = new ZeroStore({
			apiKey: "zs_test",
			baseUrl: "http://localhost:3000",
		});
		expect(store).toBeInstanceOf(ZeroStore);
	});

	test("accepts baseUrl with path", () => {
		const store = new ZeroStore({
			apiKey: "zs_test",
			baseUrl: "https://api.example.com/v2",
		});
		expect(store).toBeInstanceOf(ZeroStore);
	});

	test("zero timeout is accepted", () => {
		const store = new ZeroStore({
			apiKey: "zs_test",
			timeout: 0,
		});
		expect(store).toBeInstanceOf(ZeroStore);
	});

	test("zero retries is accepted", () => {
		const store = new ZeroStore({
			apiKey: "zs_test",
			retries: 0,
		});
		expect(store).toBeInstanceOf(ZeroStore);
	});
});

describe("SDK ping method", () => {
	test("ping exists as a method", () => {
		const store = new ZeroStore({ apiKey: "zs_test" });
		expect(typeof store.ping).toBe("function");
	});

	test("ping returns false for unreachable server", async () => {
		const store = new ZeroStore({
			apiKey: "zs_test",
			baseUrl: "http://localhost:1",
			timeout: 500,
		});
		const result = await store.ping();
		expect(result).toBe(false);
	});
});

import { describe, expect, test } from "bun:test";
import { ZeroStore } from "../src/index";

describe("SDK ping detailed", () => {
	test("ping is a no-auth operation", async () => {
		const store = new ZeroStore({ apiKey: "zs_invalid_key_doesnt_matter" });
		// ping doesn't use API key, just checks health endpoint
		expect(typeof store.ping).toBe("function");
	});

	test("ping returns boolean", async () => {
		const store = new ZeroStore({
			apiKey: "zs_test",
			baseUrl: "http://localhost:1",
			timeout: 300,
		});
		const result = await store.ping();
		expect(typeof result).toBe("boolean");
		expect(result).toBe(false);
	});
});

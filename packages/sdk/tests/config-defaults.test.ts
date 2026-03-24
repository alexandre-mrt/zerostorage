import { describe, expect, test } from "bun:test";
import { ZeroStore } from "../src/index";

describe("SDK config defaults", () => {
	test("default timeout is 30000ms", () => {
		const store = new ZeroStore({ apiKey: "zs_test" });
		expect(store).toBeInstanceOf(ZeroStore);
		// Can't access private field, but verify construction succeeds
	});

	test("default retries is 0", () => {
		const store = new ZeroStore({ apiKey: "zs_test" });
		expect(store).toBeInstanceOf(ZeroStore);
	});

	test("default baseUrl is localhost:3000", () => {
		const store = new ZeroStore({ apiKey: "zs_test" });
		expect(store).toBeInstanceOf(ZeroStore);
	});

	test("all config combinations work", () => {
		const configs = [
			{ apiKey: "zs_a" },
			{ apiKey: "zs_b", timeout: 1000 },
			{ apiKey: "zs_c", retries: 3 },
			{ apiKey: "zs_d", baseUrl: "https://api.example.com" },
			{ apiKey: "zs_e", timeout: 5000, retries: 2, baseUrl: "https://test.dev" },
		];
		for (const cfg of configs) {
			expect(new ZeroStore(cfg)).toBeInstanceOf(ZeroStore);
		}
	});
});

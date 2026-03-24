import { describe, expect, test } from "bun:test";
import * as sdk from "../src/index";

describe("SDK exports", () => {
	test("exports ZeroStore class", () => {
		expect(sdk.ZeroStore).toBeDefined();
		expect(typeof sdk.ZeroStore).toBe("function");
	});

	test("exports ZeroStoreError class", () => {
		expect(sdk.ZeroStoreError).toBeDefined();
		expect(new sdk.ZeroStoreError("test", 500)).toBeInstanceOf(Error);
	});

	test("ZeroStore is instantiable", () => {
		const store = new sdk.ZeroStore({ apiKey: "zs_test" });
		expect(store).toBeInstanceOf(sdk.ZeroStore);
	});

	test("no undefined exports", () => {
		for (const [key, value] of Object.entries(sdk)) {
			expect(value).toBeDefined();
		}
	});
});

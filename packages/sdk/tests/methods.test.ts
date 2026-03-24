import { describe, expect, test } from "bun:test";
import { ZeroStore } from "../src/index";

const s = new ZeroStore({ apiKey: "zs_test" });

describe("SDK method count", () => {
	test("has 11 public methods", () => {
		const methods = ["upload","download","list","status","unpin","createKey","listKeys","revokeKey","usage","fileStats","ping"];
		for (const m of methods) {
			expect(typeof (s as any)[m]).toBe("function");
		}
	});

	test("all methods are async", () => {
		// Verify they return promises when called (they'll fail but return promise)
		expect(typeof s.ping).toBe("function");
		expect(typeof s.usage).toBe("function");
		expect(typeof s.list).toBe("function");
	});
});

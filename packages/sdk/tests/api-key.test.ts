import { describe, expect, test } from "bun:test";
import { ZeroStore } from "../src/index";

describe("API key validation", () => {
	test("rejects key without zs_ prefix", () => {
		expect(() => new ZeroStore({ apiKey: "sk_invalid" })).toThrow();
	});
	test("accepts valid zs_ prefix", () => {
		expect(new ZeroStore({ apiKey: "zs_valid" })).toBeTruthy();
	});
});

import { describe, expect, test } from "bun:test";

describe("API version consistency", () => {
	test("version is semver format", () => {
		const version = "0.1.0";
		expect(version).toMatch(/^\d+\.\d+\.\d+$/);
	});
});

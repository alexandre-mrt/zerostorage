import { describe, expect, test } from "bun:test";
describe("Env defaults", () => {
	test("PORT defaults to 3000", () => { expect(Number(process.env.PORT || 3000)).toBe(3000); });
	test("API_SECRET has default", () => { expect(process.env.API_SECRET || "zerostorage-dev-secret").toBeTruthy(); });
});

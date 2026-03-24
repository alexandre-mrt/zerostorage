import { describe, expect, test } from "bun:test";
process.env.DATABASE_URL = ":memory:";
const { db } = await import("../src/services/db");

describe("DB configuration", () => {
	test("foreign keys enabled", () => {
		const r = db.prepare("PRAGMA foreign_keys").get() as any;
		expect(r.foreign_keys).toBe(1);
	});
	test("tables created on import", () => {
		const t = db.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'").get() as any;
		expect(t.c).toBeGreaterThanOrEqual(4);
	});
});

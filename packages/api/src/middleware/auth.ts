import type { Context, Next } from "hono";
import { createHash } from "node:crypto";
import { queries } from "../services/db";

const API_SECRET = process.env.API_SECRET || "zerostorage-dev-secret";

export function hashApiKey(key: string): string {
	return createHash("sha256").update(`${key}:${API_SECRET}`).digest("hex");
}

export type AuthContext = {
	userId: string;
	apiKeyId: string;
	tier: string;
};

export async function authMiddleware(c: Context, next: Next) {
	const authHeader = c.req.header("Authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ success: false, error: "Missing or invalid Authorization header" }, 401);
	}

	const key = authHeader.slice(7);

	if (!key.startsWith("zs_")) {
		return c.json({ success: false, error: "Invalid API key format" }, 401);
	}

	const keyHash = hashApiKey(key);
	const result = queries.findApiKey.get(keyHash);

	if (!result) {
		return c.json({ success: false, error: "Invalid API key" }, 401);
	}

	if (result.revoked_at) {
		return c.json({ success: false, error: "API key has been revoked" }, 401);
	}

	c.set("auth", {
		userId: result.user_id,
		apiKeyId: result.api_key_id,
		tier: result.tier,
	} satisfies AuthContext);

	await next();
}

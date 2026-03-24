import type { Context, Next } from "hono";

const TIER_LIMITS: Record<string, number> = {
	free: 100,
	starter: 1_000,
	pro: 10_000,
	enterprise: 100_000,
};

const windowMs = 24 * 60 * 60 * 1000; // 24 hours
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export async function rateLimitMiddleware(c: Context, next: Next) {
	const auth = c.get("auth");
	if (!auth) {
		return c.json({ success: false, error: "Unauthorized" }, 401);
	}

	const key = auth.apiKeyId;
	const limit = TIER_LIMITS[auth.tier] ?? TIER_LIMITS.free;
	const now = Date.now();

	let entry = requestCounts.get(key);

	if (!entry || now >= entry.resetAt) {
		entry = { count: 0, resetAt: now + windowMs };
		requestCounts.set(key, entry);
	}

	entry.count++;

	c.header("X-RateLimit-Limit", String(limit));
	c.header("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
	c.header("X-RateLimit-Reset", String(Math.floor(entry.resetAt / 1000)));

	if (entry.count > limit) {
		return c.json(
			{ success: false, error: "Rate limit exceeded. Upgrade your plan for higher limits." },
			429,
		);
	}

	await next();
}

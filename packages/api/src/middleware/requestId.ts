import type { Context, Next } from "hono";
import { nanoid } from "nanoid";

/**
 * Adds a unique request ID to each request for tracing.
 * Available via c.get("requestId") and returned in X-Request-Id header.
 */
export async function requestIdMiddleware(c: Context, next: Next) {
	const requestId = c.req.header("X-Request-Id") || nanoid(12);
	c.set("requestId", requestId);
	c.header("X-Request-Id", requestId);
	await next();
}

import type { Context, Next } from "hono";

/**
 * Adds security headers to all responses.
 */
export async function securityHeaders(c: Context, next: Next) {
	await next();
	c.header("X-Content-Type-Options", "nosniff");
	c.header("X-Frame-Options", "DENY");
	c.header("X-XSS-Protection", "0");
	c.header("Referrer-Policy", "strict-origin-when-cross-origin");
}

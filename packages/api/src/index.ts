import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { adminRouter } from "./routes/admin";
import { filesRouter } from "./routes/files";
import { keysRouter } from "./routes/keys";
import { usageRouter } from "./routes/usage";
import { initializeDatabase } from "./services/db";

initializeDatabase();

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

// Global error handler - catch unhandled errors and return 500
app.onError((err, c) => {
	console.error(`Unhandled error: ${err.message}`, err.stack);
	return c.json(
		{ success: false, error: "Internal server error" },
		500,
	);
});

// 404 handler
app.notFound((c) => {
	return c.json({ success: false, error: "Not found" }, 404);
});

// Public routes
app.route("/admin", adminRouter);

// Authenticated routes
const api = new Hono();
api.use("*", authMiddleware);
api.use("*", rateLimitMiddleware);

api.route("/files", filesRouter);
api.route("/keys", keysRouter);
api.route("/usage", usageRouter);

app.route("/api/v1", api);

// Root
app.get("/", (c) => {
	return c.json({
		name: "ZeroStore API",
		version: "0.1.0",
		description: "The fastest way to store files on 0G decentralized storage",
		docs: "/api/v1",
		health: "/admin/health",
	});
});

const PORT = Number(process.env.PORT || 3000);

console.log(`ZeroStore API running on http://localhost:${PORT}`);

export default {
	port: PORT,
	fetch: app.fetch,
};

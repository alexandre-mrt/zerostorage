import { Hono } from "hono";
import { nanoid } from "nanoid";
import { randomBytes } from "node:crypto";
import { hashApiKey } from "../middleware/auth";
import { queries } from "../services/db";

export const adminRouter = new Hono();

const ADMIN_SECRET = process.env.ADMIN_SECRET || "zerostorage-admin-dev";

adminRouter.post("/bootstrap", async (c) => {
	const adminHeader = c.req.header("X-Admin-Secret");

	if (adminHeader !== ADMIN_SECRET) {
		return c.json({ success: false, error: "Unauthorized" }, 401);
	}

	const body = await c.req.json<{ email: string; tier?: string }>();

	if (!body.email) {
		return c.json({ success: false, error: "Email is required" }, 400);
	}

	const userId = nanoid();
	const tier = body.tier ?? "free";

	queries.insertUser.run({
		$id: userId,
		$email: body.email,
		$tier: tier,
	});

	const rawKey = `zs_${randomBytes(24).toString("base64url")}`;
	const keyHash = hashApiKey(rawKey);

	queries.insertApiKey.run({
		$id: nanoid(),
		$keyHash: keyHash,
		$keyPrefix: rawKey.slice(0, 10),
		$name: "Default Key",
		$userId: userId,
	});

	return c.json({
		success: true,
		data: {
			userId,
			email: body.email,
			tier,
			apiKey: rawKey,
			message: "Save this API key securely. It will not be shown again.",
		},
	}, 201);
});

adminRouter.get("/health", (c) => {
	return c.json({
		success: true,
		data: {
			status: "ok",
			version: "0.1.0",
			timestamp: new Date().toISOString(),
		},
	});
});

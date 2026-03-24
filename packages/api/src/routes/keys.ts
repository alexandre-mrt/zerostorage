import { Hono } from "hono";
import { randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import type { AuthContext } from "../middleware/auth";
import { hashApiKey } from "../middleware/auth";
import { queries } from "../services/db";

type Env = { Variables: { auth: AuthContext } };

export const keysRouter = new Hono<Env>();

function generateApiKey(): string {
	const random = randomBytes(24).toString("base64url");
	return `zs_${random}`;
}

keysRouter.post("/", async (c) => {
	const auth = c.get("auth");
	const body = await c.req.json<{ name: string }>();

	if (!body.name || typeof body.name !== "string") {
		return c.json({ success: false, error: "Name is required" }, 400);
	}

	const countResult = queries.activeApiKeyCount.get(auth.userId);
	const maxKeys = auth.tier === "free" ? 2 : auth.tier === "starter" ? 5 : 20;

	if ((countResult?.count ?? 0) >= maxKeys) {
		return c.json({
			success: false,
			error: `Maximum ${maxKeys} active API keys for ${auth.tier} tier`,
		}, 400);
	}

	const rawKey = generateApiKey();
	const keyHash = hashApiKey(rawKey);
	const keyPrefix = rawKey.slice(0, 10);
	const keyId = nanoid();

	queries.insertApiKey.run({
		$id: keyId,
		$keyHash: keyHash,
		$keyPrefix: keyPrefix,
		$name: body.name,
		$userId: auth.userId,
	});

	return c.json({
		success: true,
		data: {
			id: keyId,
			key: rawKey,
			keyPrefix,
			name: body.name,
			message: "Save this key securely. It will not be shown again.",
		},
	}, 201);
});

keysRouter.get("/", async (c) => {
	const auth = c.get("auth");

	const keys = queries.listApiKeys.all(auth.userId);

	return c.json({
		success: true,
		data: {
			keys: keys.map((k) => ({
				id: k.id,
				keyPrefix: k.key_prefix,
				name: k.name,
				createdAt: k.created_at,
				revokedAt: k.revoked_at,
			})),
		},
	});
});

keysRouter.delete("/:keyId", async (c) => {
	const auth = c.get("auth");
	const keyId = c.req.param("keyId");

	const result = queries.revokeApiKey.run(keyId, auth.userId);

	if (result.changes === 0) {
		return c.json({ success: false, error: "API key not found" }, 404);
	}

	return c.json({ success: true, data: { message: "API key revoked" } });
});

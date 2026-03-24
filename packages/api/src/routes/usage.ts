import { Hono } from "hono";
import type { AuthContext } from "../middleware/auth";
import { queries } from "../services/db";

type Env = { Variables: { auth: AuthContext } };

export const usageRouter = new Hono<Env>();

usageRouter.get("/", async (c) => {
	const auth = c.get("auth");

	const fileStats = queries.fileStats.get(auth.userId);
	const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
	const requestStats = queries.requestStats.get(auth.apiKeyId, thirtyDaysAgo);

	return c.json({
		success: true,
		data: {
			storage: {
				filesCount: fileStats?.total_files ?? 0,
				bytesUsed: fileStats?.total_size ?? 0,
			},
			bandwidth: {
				requestsLast30d: requestStats?.total_requests ?? 0,
				bytesTransferredLast30d: requestStats?.total_bandwidth ?? 0,
			},
			tier: auth.tier,
		},
	});
});

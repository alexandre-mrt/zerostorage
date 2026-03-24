import { Hono } from "hono";
import { nanoid } from "nanoid";
import { readFile, rm } from "node:fs/promises";
import type { AuthContext } from "../middleware/auth";
import { queries } from "../services/db";
import { downloadFile, uploadFile } from "../services/storage";

type Env = { Variables: { auth: AuthContext } };

const TIER_STORAGE_LIMITS: Record<string, number> = {
	free: 1 * 1024 * 1024 * 1024,
	starter: 10 * 1024 * 1024 * 1024,
	pro: 100 * 1024 * 1024 * 1024,
	enterprise: 1024 * 1024 * 1024 * 1024,
};

export const filesRouter = new Hono<Env>();

filesRouter.post("/upload", async (c) => {
	const auth = c.get("auth");

	const body = await c.req.parseBody();
	const file = body.file;

	if (!file || !(file instanceof File)) {
		return c.json({ success: false, error: "No file provided. Use multipart form with 'file' field." }, 400);
	}

	const maxSize = TIER_STORAGE_LIMITS[auth.tier] ?? TIER_STORAGE_LIMITS.free;
	if (file.size > maxSize) {
		return c.json({ success: false, error: `File exceeds storage limit for ${auth.tier} tier` }, 413);
	}

	const buffer = Buffer.from(await file.arrayBuffer());

	try {
		const result = await uploadFile(buffer, file.name);
		const fileId = nanoid();

		queries.insertFile.run({
			$id: fileId,
			$rootHash: result.rootHash,
			$fileName: file.name,
			$fileSize: file.size,
			$mimeType: file.type || "application/octet-stream",
			$userId: auth.userId,
			$status: "pinned",
		});

		return c.json({
			success: true,
			data: {
				id: fileId,
				rootHash: result.rootHash,
				txHash: result.txHash,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type || "application/octet-stream",
				status: "pinned",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Upload failed";
		return c.json({ success: false, error: message }, 500);
	}
});

filesRouter.get("/:rootHash", async (c) => {
	const auth = c.get("auth");
	const rootHash = c.req.param("rootHash");

	const fileRecord = queries.getFileByHash.get(rootHash, auth.userId);

	if (!fileRecord) {
		return c.json({ success: false, error: "File not found" }, 404);
	}

	try {
		const outputPath = await downloadFile(rootHash, fileRecord.file_name);
		const fileBuffer = await readFile(outputPath);

		await rm(outputPath, { force: true }).catch(() => {});

		c.header("Content-Type", fileRecord.mime_type);
		c.header("Content-Disposition", `attachment; filename="${fileRecord.file_name}"`);
		c.header("Content-Length", String(fileBuffer.length));

		return c.body(fileBuffer);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Download failed";
		return c.json({ success: false, error: message }, 500);
	}
});

filesRouter.get("/", async (c) => {
	const auth = c.get("auth");
	const page = Number(c.req.query("page") || "1");
	const limit = Math.min(Number(c.req.query("limit") || "20"), 100);
	const offset = (page - 1) * limit;

	const userFiles = queries.listFiles.all(auth.userId, limit, offset);

	return c.json({
		success: true,
		data: {
			files: userFiles.map((f) => ({
				id: f.id,
				rootHash: f.root_hash,
				fileName: f.file_name,
				fileSize: f.file_size,
				mimeType: f.mime_type,
				status: f.status,
				createdAt: f.created_at,
			})),
			page,
			limit,
		},
	});
});

filesRouter.delete("/:rootHash", async (c) => {
	const auth = c.get("auth");
	const rootHash = c.req.param("rootHash");

	const result = queries.unpinFile.run(rootHash, auth.userId);

	if (result.changes === 0) {
		return c.json({ success: false, error: "File not found" }, 404);
	}

	return c.json({ success: true, data: { message: "File unpinned successfully" } });
});

filesRouter.get("/:rootHash/status", async (c) => {
	const auth = c.get("auth");
	const rootHash = c.req.param("rootHash");

	const fileRecord = queries.getFileByHash.get(rootHash, auth.userId);

	if (!fileRecord) {
		return c.json({ success: false, error: "File not found" }, 404);
	}

	return c.json({
		success: true,
		data: {
			rootHash,
			status: fileRecord.status,
			fileName: fileRecord.file_name,
			fileSize: fileRecord.file_size,
		},
	});
});

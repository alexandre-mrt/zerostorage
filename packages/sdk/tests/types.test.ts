import { describe, expect, test } from "bun:test";
import type {
	ApiResponse,
	FileInfo,
	FileListResponse,
	FileStatusResponse,
	UploadResponse,
	UsageStats,
	ZeroStoreConfig,
	ListOptions,
	ApiKeyInfo,
} from "../src/types";

describe("Type contracts", () => {
	test("ZeroStoreConfig shape", () => {
		const config: ZeroStoreConfig = {
			apiKey: "zs_test",
			baseUrl: "http://localhost:3000",
			timeout: 5000,
			retries: 2,
		};
		expect(config.apiKey).toBe("zs_test");
		expect(config.timeout).toBe(5000);
		expect(config.retries).toBe(2);
	});

	test("ZeroStoreConfig minimal shape", () => {
		const config: ZeroStoreConfig = { apiKey: "zs_min" };
		expect(config.baseUrl).toBeUndefined();
		expect(config.timeout).toBeUndefined();
		expect(config.retries).toBeUndefined();
	});

	test("ApiResponse success shape", () => {
		const res: ApiResponse<{ id: string }> = {
			success: true,
			data: { id: "123" },
		};
		expect(res.success).toBe(true);
		expect(res.data?.id).toBe("123");
		expect(res.error).toBeUndefined();
	});

	test("ApiResponse error shape", () => {
		const res: ApiResponse<never> = {
			success: false,
			error: "Something went wrong",
		};
		expect(res.success).toBe(false);
		expect(res.error).toBe("Something went wrong");
		expect(res.data).toBeUndefined();
	});

	test("UploadResponse shape", () => {
		const upload: UploadResponse = {
			id: "file-1",
			rootHash: "0xhash",
			txHash: "0xtx",
			fileName: "test.pdf",
			fileSize: 1024,
			mimeType: "application/pdf",
			status: "pinned",
		};
		expect(upload.id).toBeTruthy();
		expect(upload.rootHash).toStartWith("0x");
	});

	test("UsageStats shape", () => {
		const usage: UsageStats = {
			storage: { filesCount: 5, bytesUsed: 1024000 },
			bandwidth: { requestsLast30d: 100, bytesTransferredLast30d: 5000000 },
			tier: "pro",
		};
		expect(usage.storage.filesCount).toBe(5);
		expect(usage.tier).toBe("pro");
	});

	test("ListOptions defaults", () => {
		const opts: ListOptions = {};
		expect(opts.page).toBeUndefined();
		expect(opts.limit).toBeUndefined();
	});
});

export type {
	ApiKeyInfo,
	ApiResponse,
	FileInfo,
	FileListResponse,
	FileStatusResponse,
	ListOptions,
	UploadResponse,
	UsageStats,
	ZeroStoreConfig,
} from "./types";

import type {
	ApiKeyInfo,
	ApiResponse,
	FileListResponse,
	FileStatusResponse,
	ListOptions,
	UploadResponse,
	UsageStats,
	ZeroStoreConfig,
} from "./types";

const DEFAULT_BASE_URL = "http://localhost:3000";

export class ZeroStore {
	private readonly apiKey: string;
	private readonly baseUrl: string;

	constructor(config: ZeroStoreConfig) {
		if (!config.apiKey) {
			throw new Error("API key is required");
		}
		this.apiKey = config.apiKey;
		this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
	}

	private async request<T>(
		path: string,
		options: RequestInit = {},
	): Promise<T> {
		const url = `${this.baseUrl}/api/v1${path}`;
		const headers: Record<string, string> = {
			Authorization: `Bearer ${this.apiKey}`,
			...((options.headers as Record<string, string>) ?? {}),
		};

		const response = await fetch(url, { ...options, headers });
		const json = (await response.json()) as ApiResponse<T>;

		if (!json.success) {
			throw new ZeroStoreError(json.error ?? "Unknown error", response.status);
		}

		return json.data as T;
	}

	// --- Files ---

	async upload(file: File | Blob, fileName?: string): Promise<UploadResponse> {
		const formData = new FormData();
		const name = fileName ?? (file instanceof File ? file.name : "upload");
		formData.append("file", file, name);

		return this.request<UploadResponse>("/files/upload", {
			method: "POST",
			body: formData,
		});
	}

	async download(rootHash: string): Promise<Blob> {
		const url = `${this.baseUrl}/api/v1/files/${rootHash}`;
		const response = await fetch(url, {
			headers: { Authorization: `Bearer ${this.apiKey}` },
		});

		if (!response.ok) {
			const json = (await response.json()) as ApiResponse<never>;
			throw new ZeroStoreError(json.error ?? "Download failed", response.status);
		}

		return response.blob();
	}

	async list(options: ListOptions = {}): Promise<FileListResponse> {
		const params = new URLSearchParams();
		if (options.page) params.set("page", String(options.page));
		if (options.limit) params.set("limit", String(options.limit));

		const query = params.toString();
		return this.request<FileListResponse>(`/files${query ? `?${query}` : ""}`);
	}

	async status(rootHash: string): Promise<FileStatusResponse> {
		return this.request<FileStatusResponse>(`/files/${rootHash}/status`);
	}

	async unpin(rootHash: string): Promise<{ message: string }> {
		return this.request<{ message: string }>(`/files/${rootHash}`, {
			method: "DELETE",
		});
	}

	// --- API Keys ---

	async createKey(name: string): Promise<ApiKeyInfo> {
		return this.request<ApiKeyInfo>("/keys", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name }),
		});
	}

	async listKeys(): Promise<{ keys: ApiKeyInfo[] }> {
		return this.request<{ keys: ApiKeyInfo[] }>("/keys");
	}

	async revokeKey(keyId: string): Promise<{ message: string }> {
		return this.request<{ message: string }>(`/keys/${keyId}`, {
			method: "DELETE",
		});
	}

	// --- Usage ---

	async usage(): Promise<UsageStats> {
		return this.request<UsageStats>("/usage");
	}
}

export class ZeroStoreError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
	) {
		super(message);
		this.name = "ZeroStoreError";
	}
}

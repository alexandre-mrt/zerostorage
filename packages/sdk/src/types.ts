export interface ZeroStoreConfig {
	apiKey: string;
	baseUrl?: string;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface UploadResponse {
	id: string;
	rootHash: string;
	txHash: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	status: string;
}

export interface FileInfo {
	id: string;
	rootHash: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	status: string;
	createdAt: string;
}

export interface FileListResponse {
	files: FileInfo[];
	page: number;
	limit: number;
}

export interface FileStatusResponse {
	rootHash: string;
	status: string;
	fileName: string;
	fileSize: number;
}

export interface ApiKeyInfo {
	id: string;
	key?: string; // Only present on creation
	keyPrefix: string;
	name: string;
	createdAt: string;
	revokedAt: string | null;
	message?: string;
}

export interface UsageStats {
	storage: {
		filesCount: number;
		bytesUsed: number;
	};
	bandwidth: {
		requestsLast30d: number;
		bytesTransferredLast30d: number;
	};
	tier: string;
}

export interface ListOptions {
	page?: number;
	limit?: number;
}

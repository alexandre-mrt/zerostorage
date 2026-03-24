import { Database } from "bun:sqlite";

const DATABASE_URL = process.env.DATABASE_URL || "./data/zerostorage.db";

export const db = new Database(DATABASE_URL, { create: true });
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

function createTables() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL DEFAULT 'free',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      revoked_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      root_hash TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'uploading',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id TEXT PRIMARY KEY,
      api_key_id TEXT NOT NULL REFERENCES api_keys(id),
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      bytes_transferred INTEGER NOT NULL DEFAULT 0,
      status_code INTEGER NOT NULL,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
    CREATE INDEX IF NOT EXISTS idx_files_root_hash ON files(root_hash);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
  `);
}

// Auto-initialize tables before preparing statements
createTables();

export function initializeDatabase() {
	// Tables are already created above; this is kept for backwards compatibility
	createTables();
}

// Type-safe query helpers

export interface UserRow {
	id: string;
	email: string;
	tier: string;
	created_at: number;
}

export interface ApiKeyRow {
	id: string;
	key_hash: string;
	key_prefix: string;
	name: string;
	user_id: string;
	revoked_at: number | null;
	created_at: number;
}

export interface FileRow {
	id: string;
	root_hash: string;
	file_name: string;
	file_size: number;
	mime_type: string;
	user_id: string;
	status: string;
	created_at: number;
}

export interface UsageLogRow {
	id: string;
	api_key_id: string;
	endpoint: string;
	method: string;
	bytes_transferred: number;
	status_code: number;
	timestamp: number;
}

// Prepared statements for performance
export const queries = {
	findApiKey: db.prepare<{ key_hash: string; user_id: string; revoked_at: number | null; tier: string; api_key_id: string }, [string]>(
		`SELECT ak.id as api_key_id, ak.key_hash, ak.user_id, ak.revoked_at, u.tier
     FROM api_keys ak
     INNER JOIN users u ON u.id = ak.user_id
     WHERE ak.key_hash = ?
     LIMIT 1`,
	),

	insertUser: db.prepare(
		"INSERT INTO users (id, email, tier) VALUES ($id, $email, $tier)",
	),

	insertApiKey: db.prepare(
		"INSERT INTO api_keys (id, key_hash, key_prefix, name, user_id) VALUES ($id, $keyHash, $keyPrefix, $name, $userId)",
	),

	insertFile: db.prepare(
		"INSERT INTO files (id, root_hash, file_name, file_size, mime_type, user_id, status) VALUES ($id, $rootHash, $fileName, $fileSize, $mimeType, $userId, $status)",
	),

	getFileByHash: db.prepare<FileRow, [string, string]>(
		"SELECT * FROM files WHERE root_hash = ? AND user_id = ? LIMIT 1",
	),

	listFiles: db.prepare<FileRow, [string, number, number]>(
		"SELECT * FROM files WHERE user_id = ? AND status = 'pinned' ORDER BY created_at DESC LIMIT ? OFFSET ?",
	),

	unpinFile: db.prepare(
		"UPDATE files SET status = 'unpinned' WHERE root_hash = ? AND user_id = ?",
	),

	listApiKeys: db.prepare<ApiKeyRow, [string]>(
		"SELECT * FROM api_keys WHERE user_id = ?",
	),

	activeApiKeyCount: db.prepare<{ count: number }, [string]>(
		"SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND revoked_at IS NULL",
	),

	revokeApiKey: db.prepare(
		"UPDATE api_keys SET revoked_at = unixepoch() WHERE id = ? AND user_id = ?",
	),

	fileStats: db.prepare<{ total_files: number; total_size: number }, [string]>(
		"SELECT COUNT(*) as total_files, COALESCE(SUM(file_size), 0) as total_size FROM files WHERE user_id = ? AND status = 'pinned'",
	),

	requestStats: db.prepare<{ total_requests: number; total_bandwidth: number }, [string, number]>(
		"SELECT COUNT(*) as total_requests, COALESCE(SUM(bytes_transferred), 0) as total_bandwidth FROM usage_logs WHERE api_key_id = ? AND timestamp > ?",
	),

	insertUsageLog: db.prepare(
		"INSERT INTO usage_logs (id, api_key_id, endpoint, method, bytes_transferred, status_code) VALUES ($id, $apiKeyId, $endpoint, $method, $bytesTransferred, $statusCode)",
	),
};

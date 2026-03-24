import { Indexer, ZgFile } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EVM_RPC = process.env.ZG_EVM_RPC || "https://evmrpc-testnet.0g.ai";
const INDEXER_RPC =
	process.env.ZG_INDEXER_RPC || "https://indexer-storage-testnet-turbo.0g.ai";
const PRIVATE_KEY = process.env.ZG_PRIVATE_KEY;

if (!PRIVATE_KEY) {
	throw new Error("ZG_PRIVATE_KEY environment variable is required");
}

const provider = new ethers.JsonRpcProvider(EVM_RPC);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

function createIndexer(): Indexer {
	return new Indexer(INDEXER_RPC);
}

export interface UploadResult {
	rootHash: string;
	txHash: string;
}

export async function uploadFile(
	buffer: Buffer,
	fileName: string,
): Promise<UploadResult> {
	const tempDir = await mkdtemp(join(tmpdir(), "zs-"));
	const tempPath = join(tempDir, fileName);

	try {
		await writeFile(tempPath, buffer);

		const file = await ZgFile.fromFilePath(tempPath);
		const [tree, treeErr] = await file.merkleTree();

		if (treeErr || !tree) {
			throw new Error(`Failed to compute merkle tree: ${treeErr}`);
		}

		const rootHash = tree.rootHash();
		const indexer = createIndexer();
		const [tx, uploadErr] = await indexer.upload(file, EVM_RPC, signer);

		if (uploadErr || !tx) {
			throw new Error(`Upload failed: ${uploadErr}`);
		}

		await file.close();

		return {
			rootHash: rootHash ?? "",
			txHash: typeof tx === "string" ? tx : String(tx),
		};
	} finally {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
}

export async function downloadFile(
	rootHash: string,
	outputFileName: string,
): Promise<string> {
	const tempDir = await mkdtemp(join(tmpdir(), "zs-dl-"));
	const outputPath = join(tempDir, outputFileName);

	const indexer = createIndexer();
	const [, downloadErr] = await indexer.download(rootHash, outputPath, true);

	if (downloadErr) {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
		throw new Error(`Download failed: ${downloadErr}`);
	}

	return outputPath;
}

export async function getFileRootHash(buffer: Buffer, fileName: string): Promise<string> {
	const tempDir = await mkdtemp(join(tmpdir(), "zs-hash-"));
	const tempPath = join(tempDir, fileName);

	try {
		await writeFile(tempPath, buffer);
		const file = await ZgFile.fromFilePath(tempPath);
		const [tree, err] = await file.merkleTree();

		if (err || !tree) {
			throw new Error(`Failed to compute merkle tree: ${err}`);
		}

		const hash = tree.rootHash();
		await file.close();
		return hash ?? "";
	} finally {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
}

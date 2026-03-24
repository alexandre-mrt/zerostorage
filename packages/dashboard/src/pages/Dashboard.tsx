import { Activity, Database, FileText, HardDrive } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FileTable } from "../components/FileTable";
import { FileUploader } from "../components/FileUploader";
import { StatsCard } from "../components/StatsCard";
import { useApi } from "../hooks/useApi";

interface UsageStats {
	storage: { filesCount: number; bytesUsed: number };
	bandwidth: { requestsLast30d: number; bytesTransferredLast30d: number };
	tier: string;
}

interface FileInfo {
	id: string;
	rootHash: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	status: string;
	createdAt: string;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function Dashboard({ apiKey }: { apiKey: string }) {
	const { request, loading } = useApi(apiKey);
	const [stats, setStats] = useState<UsageStats | null>(null);
	const [files, setFiles] = useState<FileInfo[]>([]);
	const [uploading, setUploading] = useState(false);

	const loadData = useCallback(async () => {
		const [usageData, filesData] = await Promise.all([
			request<UsageStats>("/usage"),
			request<{ files: FileInfo[] }>("/files"),
		]);
		if (usageData) setStats(usageData);
		if (filesData) setFiles(filesData.files);
	}, [request]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleUpload = useCallback(
		async (file: File) => {
			setUploading(true);
			const formData = new FormData();
			formData.append("file", file);

			const result = await request<FileInfo>("/files/upload", {
				method: "POST",
				body: formData,
			});

			if (result) {
				await loadData();
			}
			setUploading(false);
		},
		[request, loadData],
	);

	const handleDelete = useCallback(
		async (rootHash: string) => {
			await request(`/files/${rootHash}`, { method: "DELETE" });
			await loadData();
		},
		[request, loadData],
	);

	const handleDownload = useCallback(
		async (rootHash: string, fileName: string) => {
			const response = await fetch(`/api/v1/files/${rootHash}`, {
				headers: { Authorization: `Bearer ${apiKey}` },
			});
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = fileName;
				a.click();
				URL.revokeObjectURL(url);
			}
		},
		[apiKey],
	);

	return (
		<div className="max-w-6xl mx-auto p-6">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-2xl font-bold">ZeroStore</h1>
					<p className="text-sm text-gray-500">
						Decentralized storage powered by 0G
					</p>
				</div>
				{stats && (
					<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
						{stats.tier} plan
					</span>
				)}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
				<StatsCard
					title="Files Stored"
					value={String(stats?.storage.filesCount ?? 0)}
					icon={FileText}
				/>
				<StatsCard
					title="Storage Used"
					value={formatBytes(stats?.storage.bytesUsed ?? 0)}
					icon={HardDrive}
				/>
				<StatsCard
					title="API Requests (30d)"
					value={String(stats?.bandwidth.requestsLast30d ?? 0)}
					icon={Activity}
				/>
				<StatsCard
					title="Bandwidth (30d)"
					value={formatBytes(stats?.bandwidth.bytesTransferredLast30d ?? 0)}
					icon={Database}
				/>
			</div>

			{/* Upload */}
			<div className="bg-white rounded-xl border p-6 mb-8">
				<h2 className="text-lg font-semibold mb-4">Upload File</h2>
				<FileUploader onUpload={handleUpload} loading={uploading} />
			</div>

			{/* Files */}
			<div className="bg-white rounded-xl border p-6">
				<h2 className="text-lg font-semibold mb-4">Your Files</h2>
				{loading && files.length === 0 ? (
					<p className="text-gray-500 text-center py-8">Loading...</p>
				) : (
					<FileTable files={files} onDelete={handleDelete} onDownload={handleDownload} />
				)}
			</div>
		</div>
	);
}

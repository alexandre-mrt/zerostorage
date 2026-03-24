import { Copy, Download, Trash2 } from "lucide-react";

interface FileInfo {
	id: string;
	rootHash: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	status: string;
	createdAt: string;
}

interface FileTableProps {
	files: FileInfo[];
	onDelete: (rootHash: string) => void;
	onDownload: (rootHash: string, fileName: string) => void;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
}

export function FileTable({ files, onDelete, onDownload }: FileTableProps) {
	if (files.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<p>No files uploaded yet</p>
				<p className="text-sm mt-1">Upload your first file to get started</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b text-left text-gray-500">
						<th className="pb-3 font-medium">Name</th>
						<th className="pb-3 font-medium">Size</th>
						<th className="pb-3 font-medium">Root Hash</th>
						<th className="pb-3 font-medium">Status</th>
						<th className="pb-3 font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					{files.map((file) => (
						<tr key={file.id} className="border-b hover:bg-gray-50">
							<td className="py-3 font-medium">{file.fileName}</td>
							<td className="py-3 text-gray-600">{formatBytes(file.fileSize)}</td>
							<td className="py-3">
								<button
									type="button"
									onClick={() => copyToClipboard(file.rootHash)}
									className="flex items-center gap-1 text-gray-500 hover:text-gray-700 font-mono text-xs"
									title="Copy root hash"
								>
									{file.rootHash.slice(0, 12)}...
									<Copy className="w-3 h-3" />
								</button>
							</td>
							<td className="py-3">
								<span
									className={`px-2 py-0.5 rounded-full text-xs font-medium ${
										file.status === "pinned"
											? "bg-green-100 text-green-700"
											: "bg-gray-100 text-gray-600"
									}`}
								>
									{file.status}
								</span>
							</td>
							<td className="py-3">
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => onDownload(file.rootHash, file.fileName)}
										className="p-1.5 rounded hover:bg-gray-100"
										title="Download"
									>
										<Download className="w-4 h-4 text-gray-500" />
									</button>
									<button
										type="button"
										onClick={() => onDelete(file.rootHash)}
										className="p-1.5 rounded hover:bg-red-50"
										title="Unpin"
									>
										<Trash2 className="w-4 h-4 text-red-400" />
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

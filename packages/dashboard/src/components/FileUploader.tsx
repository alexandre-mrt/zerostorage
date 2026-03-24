import { Upload } from "lucide-react";
import { useCallback, useState } from "react";

interface FileUploaderProps {
	onUpload: (file: File) => Promise<void>;
	loading: boolean;
}

export function FileUploader({ onUpload, loading }: FileUploaderProps) {
	const [dragActive, setDragActive] = useState(false);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragActive(false);
			const file = e.dataTransfer.files[0];
			if (file) onUpload(file);
		},
		[onUpload],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) onUpload(file);
		},
		[onUpload],
	);

	return (
		<div
			onDragOver={(e) => {
				e.preventDefault();
				setDragActive(true);
			}}
			onDragLeave={() => setDragActive(false)}
			onDrop={handleDrop}
			className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
				dragActive
					? "border-blue-500 bg-blue-50"
					: "border-gray-300 hover:border-gray-400"
			}`}
		>
			<input
				type="file"
				onChange={handleChange}
				className="hidden"
				id="file-upload"
				disabled={loading}
			/>
			<label htmlFor="file-upload" className="cursor-pointer">
				<Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
				<p className="text-sm text-gray-600">
					{loading ? (
						"Uploading to 0G Storage..."
					) : (
						<>
							<span className="font-medium text-blue-600">Click to upload</span> or
							drag and drop
						</>
					)}
				</p>
				<p className="text-xs text-gray-400 mt-1">
					Files are stored on 0G decentralized storage
				</p>
			</label>
		</div>
	);
}

import { Copy, Key, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";

interface ApiKeyInfo {
	id: string;
	key?: string;
	keyPrefix: string;
	name: string;
	createdAt: string;
	revokedAt: string | null;
	message?: string;
}

export function ApiKeys({ apiKey }: { apiKey: string }) {
	const { request } = useApi(apiKey);
	const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
	const [newKeyName, setNewKeyName] = useState("");
	const [createdKey, setCreatedKey] = useState<string | null>(null);

	const loadKeys = useCallback(async () => {
		const data = await request<{ keys: ApiKeyInfo[] }>("/keys");
		if (data) setKeys(data.keys);
	}, [request]);

	useEffect(() => {
		loadKeys();
	}, [loadKeys]);

	const handleCreate = useCallback(async () => {
		if (!newKeyName.trim()) return;
		const data = await request<ApiKeyInfo>("/keys", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: newKeyName }),
		});
		if (data?.key) {
			setCreatedKey(data.key);
			setNewKeyName("");
			await loadKeys();
		}
	}, [newKeyName, request, loadKeys]);

	const handleRevoke = useCallback(
		async (keyId: string) => {
			await request(`/keys/${keyId}`, { method: "DELETE" });
			await loadKeys();
		},
		[request, loadKeys],
	);

	return (
		<div className="max-w-4xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">API Keys</h1>

			{/* Create new key */}
			<div className="bg-white rounded-xl border p-6 mb-6">
				<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
					<Plus className="w-5 h-5" /> Create New Key
				</h2>
				<div className="flex gap-3">
					<input
						type="text"
						value={newKeyName}
						onChange={(e) => setNewKeyName(e.target.value)}
						placeholder="Key name (e.g., Production, Development)"
						className="flex-1 border rounded-lg px-4 py-2 text-sm"
						onKeyDown={(e) => e.key === "Enter" && handleCreate()}
					/>
					<button
						type="button"
						onClick={handleCreate}
						className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
					>
						Create
					</button>
				</div>

				{createdKey && (
					<div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
						<p className="text-sm text-green-800 font-medium mb-2">
							Key created! Save it now, it won't be shown again.
						</p>
						<div className="flex items-center gap-2">
							<code className="bg-green-100 px-3 py-1.5 rounded text-sm font-mono flex-1">
								{createdKey}
							</code>
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(createdKey);
								}}
								className="p-2 hover:bg-green-100 rounded"
							>
								<Copy className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Key list */}
			<div className="bg-white rounded-xl border p-6">
				<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
					<Key className="w-5 h-5" /> Your Keys
				</h2>
				{keys.length === 0 ? (
					<p className="text-gray-500 text-center py-8">No API keys yet</p>
				) : (
					<div className="space-y-3">
						{keys.map((k) => (
							<div
								key={k.id}
								className={`flex items-center justify-between p-4 rounded-lg border ${
									k.revokedAt ? "bg-gray-50 opacity-60" : "bg-white"
								}`}
							>
								<div>
									<p className="font-medium">{k.name}</p>
									<p className="text-sm text-gray-500 font-mono">
										{k.keyPrefix}...
									</p>
								</div>
								<div className="flex items-center gap-3">
									{k.revokedAt ? (
										<span className="text-xs text-red-500 font-medium">
											Revoked
										</span>
									) : (
										<button
											type="button"
											onClick={() => handleRevoke(k.id)}
											className="p-2 rounded hover:bg-red-50"
											title="Revoke key"
										>
											<Trash2 className="w-4 h-4 text-red-400" />
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

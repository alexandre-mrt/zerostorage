import { useCallback, useState } from "react";

const API_BASE = "/api/v1";

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export function useApiKey() {
	const [apiKey, setApiKey] = useState<string>(() => {
		return localStorage.getItem("zs_api_key") ?? "";
	});

	const saveKey = useCallback((key: string) => {
		localStorage.setItem("zs_api_key", key);
		setApiKey(key);
	}, []);

	const clearKey = useCallback(() => {
		localStorage.removeItem("zs_api_key");
		setApiKey("");
	}, []);

	return { apiKey, saveKey, clearKey };
}

export function useApi(apiKey: string) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const request = useCallback(
		async <T>(path: string, options: RequestInit = {}): Promise<T | null> => {
			setLoading(true);
			setError(null);

			try {
				const headers: Record<string, string> = {
					Authorization: `Bearer ${apiKey}`,
					...((options.headers as Record<string, string>) ?? {}),
				};

				const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
				const json = (await response.json()) as ApiResponse<T>;

				if (!json.success) {
					setError(json.error ?? "Request failed");
					return null;
				}

				return json.data ?? null;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Network error";
				setError(message);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[apiKey],
	);

	return { request, loading, error };
}

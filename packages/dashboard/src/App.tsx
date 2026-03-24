import { Database, FileText, Key, LogOut, Rocket } from "lucide-react";
import { useState } from "react";
import { useApiKey } from "./hooks/useApi";
import { ApiKeys } from "./pages/ApiKeys";
import { Dashboard } from "./pages/Dashboard";
import { QuickStart } from "./pages/QuickStart";

type Page = "dashboard" | "keys" | "quickstart";

function LoginScreen({ onLogin }: { onLogin: (key: string) => void }) {
	const [key, setKey] = useState("");

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="bg-white rounded-2xl border p-8 w-full max-w-md">
				<div className="text-center mb-6">
					<div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
						<Database className="w-6 h-6 text-blue-600" />
					</div>
					<h1 className="text-xl font-bold">ZeroStore</h1>
					<p className="text-sm text-gray-500 mt-1">
						Decentralized storage powered by 0G
					</p>
				</div>
				<div>
					<label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
						API Key
					</label>
					<input
						id="api-key"
						type="password"
						value={key}
						onChange={(e) => setKey(e.target.value)}
						placeholder="zs_..."
						className="w-full border rounded-lg px-4 py-2.5 text-sm mb-4"
						onKeyDown={(e) => e.key === "Enter" && key && onLogin(key)}
					/>
					<button
						type="button"
						onClick={() => key && onLogin(key)}
						className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
					>
						Connect
					</button>
				</div>
			</div>
		</div>
	);
}

function NavItem({
	label,
	icon: Icon,
	active,
	onClick,
}: {
	label: string;
	icon: typeof FileText;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
				active
					? "bg-blue-50 text-blue-700 font-medium"
					: "text-gray-600 hover:bg-gray-100"
			}`}
		>
			<Icon className="w-4 h-4" />
			{label}
		</button>
	);
}

export function App() {
	const { apiKey, saveKey, clearKey } = useApiKey();
	const [page, setPage] = useState<Page>("dashboard");

	if (!apiKey) {
		return <LoginScreen onLogin={saveKey} />;
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Sidebar */}
			<div className="fixed left-0 top-0 bottom-0 w-56 bg-white border-r p-4 flex flex-col">
				<div className="flex items-center gap-2 mb-8 px-2">
					<Database className="w-6 h-6 text-blue-600" />
					<span className="font-bold text-lg">ZeroStore</span>
				</div>

				<nav className="flex flex-col gap-1 flex-1">
					<NavItem
						label="Dashboard"
						icon={FileText}
						active={page === "dashboard"}
						onClick={() => setPage("dashboard")}
					/>
					<NavItem
						label="API Keys"
						icon={Key}
						active={page === "keys"}
						onClick={() => setPage("keys")}
					/>
					<NavItem
						label="Quick Start"
						icon={Rocket}
						active={page === "quickstart"}
						onClick={() => setPage("quickstart")}
					/>
				</nav>

				<button
					type="button"
					onClick={clearKey}
					className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
				>
					<LogOut className="w-4 h-4" />
					Disconnect
				</button>
			</div>

			{/* Main content */}
			<div className="ml-56">
				{page === "dashboard" && <Dashboard apiKey={apiKey} />}
				{page === "keys" && <ApiKeys apiKey={apiKey} />}
				{page === "quickstart" && <QuickStart />}
			</div>
		</div>
	);
}

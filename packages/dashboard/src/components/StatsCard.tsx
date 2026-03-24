import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
	title: string;
	value: string;
	subtitle?: string;
	icon: LucideIcon;
}

export function StatsCard({ title, value, subtitle, icon: Icon }: StatsCardProps) {
	return (
		<div className="bg-white rounded-xl border p-5">
			<div className="flex items-center justify-between mb-3">
				<span className="text-sm text-gray-500">{title}</span>
				<Icon className="w-5 h-5 text-gray-400" />
			</div>
			<p className="text-2xl font-bold">{value}</p>
			{subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
		</div>
	);
}

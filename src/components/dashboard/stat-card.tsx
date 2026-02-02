export function StatCard({
    title,
    value,
    change,
    trend,
}: {
    title: string;
    value: string;
    change?: string;
    trend?: "up" | "down" | "neutral";
}) {
    const trendColors = {
        up: "text-green-400",
        down: "text-red-400",
        neutral: "text-slate-400",
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <p className="text-sm text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            {change && trend && (
                <p className={`mt-1 text-sm ${trendColors[trend]}`}>{change}</p>
            )}
        </div>
    );
}

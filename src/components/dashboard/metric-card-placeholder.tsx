export function MetricCardPlaceholder({
    title = "No Data",
    description = "Connect an integration",
    icon = "📊",
}: {
    title?: string;
    description?: string;
    icon?: string;
}) {
    return (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6 opacity-60">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-lg font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="mt-4 h-24 rounded bg-slate-800/50 flex items-center justify-center">
                <span className="text-xs text-slate-500">No data yet</span>
            </div>
        </div>
    );
}

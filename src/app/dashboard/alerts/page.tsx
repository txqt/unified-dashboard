import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AlertsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // Fetch all metric series user has access to
    const members = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
            workspace: {
                include: {
                    metricSeries: {
                        include: {
                            alerts: true,
                            integration: true,
                        },
                    },
                },
            },
        },
    });

    const allSeries = members.flatMap((m) => m.workspace.metricSeries);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Alert Configuration</h1>
                <p className="text-slate-400">Manage thresholds for your metrics</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950 text-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium">Metric Name</th>
                            <th className="px-6 py-4 font-medium">Provider</th>
                            <th className="px-6 py-4 font-medium">Current Alerts</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {allSeries.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center">
                                    No metrics found. Connect integrations first.
                                </td>
                            </tr>
                        ) : (
                            allSeries.map((series) => (
                                <tr key={series.id} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-medium text-white">
                                        {series.displayName}
                                    </td>
                                    <td className="px-6 py-4 uppercase text-xs">
                                        {series.integration.provider}
                                    </td>
                                    <td className="px-6 py-4">
                                        {series.alerts.length > 0 ? (
                                            <div className="flex gap-2">
                                                {series.alerts.map(a => (
                                                    <span key={a.id} className="inline-flex items-center rounded-full bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-800">
                                                        {a.type === 'ABOVE_THRESHOLD' ? '>' : '<'} {a.threshold}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-600">None</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-indigo-400 hover:text-indigo-300">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

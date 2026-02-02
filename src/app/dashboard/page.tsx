import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
// import { MetricCardPlaceholder } from "@/components/dashboard/metric-card-placeholder"; // Unused if we have real data logic

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Fetch workspaces user is a member of
    // For Real Logic: We need to filter by Active Workspace. 
    // For MVP: We show ALL metrics from ALL workspaces the user is in.
    const members = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
            workspace: {
                include: {
                    metricSeries: {
                        include: {
                            snapshots: {
                                orderBy: { capturedAt: 'desc' },
                                take: 1
                            },
                            integration: true
                        }
                    }
                }
            }
        }
    });

    const allSeries = members.flatMap(m => m.workspace.metricSeries);

    // Calculate stats
    const totalWorkspaces = members.length;
    const totalIntegrations = members.reduce((acc, m) => acc + m.workspace.metricSeries.length, 0); // Approx

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400">
                    Welcome back! Here&apos;s your SaaS health overview.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Workspaces"
                    value={totalWorkspaces.toString()}
                    trend="neutral"
                />
                <StatCard
                    title="Active Integrations"
                    value={totalIntegrations.toString()}
                    trend="neutral"
                />
            </div>

            {allSeries.length === 0 ? (
                /* Empty State */
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                        <svg
                            className="h-8 w-8 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white">No metrics configured</h3>
                    <p className="mt-2 text-slate-400">
                        Connect integrations to your workspaces to start tracking metrics.
                    </p>
                    <Link
                        href="/dashboard/integrations/new"
                        className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Add Integration
                    </Link>
                </div>
            ) : (
                /* Metric Cards Grid */
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Metric Overview</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {allSeries.map((series) => {
                            const latest = series.snapshots[0];
                            return (
                                <div key={series.id} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-slate-200">{series.displayName}</h3>
                                        <span className="text-xs text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-800">{series.integration.provider}</span>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-3xl font-bold text-white">
                                            {latest ? latest.value : "-"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {latest ? `Updated ${latest.capturedAt.toLocaleTimeString()}` : "No data yet"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

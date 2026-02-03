import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusCard } from "@/components/dashboard/status-card";
import { cookies } from "next/headers";
// Icons
import { CreditCard, Activity, Users, Zap, AlertOctagon, TrendingUp, Wallet, ShieldCheck, Mail } from "lucide-react";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }


    // 1. Fetch all memberships
    const allMemberships = await prisma.workspaceMember.findMany({
        where: { userId },
        include: { workspace: true },
        orderBy: { workspace: { createdAt: 'desc' } }
    });

    // 2. Determine Scope (Active Workspace)
    const cookieStore = await cookies();
    const cookieWorkspaceId = cookieStore.get("unified_workspace_id")?.value;
    const activeMembership = allMemberships.find(m => m.workspaceId === cookieWorkspaceId) || allMemberships[0];

    // 3. Fetch Metrics only for Active Workspace
    let activeWorkspaceData = null;
    if (activeMembership) {
        activeWorkspaceData = await prisma.workspace.findUnique({
            where: { id: activeMembership.workspaceId },
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
        });
    }

    const allSeries = activeWorkspaceData?.metricSeries || [];

    // --- ORGANIZE METRICS BY CATEGORY ---
    const getMetricValue = (key: string) => {
        const series = allSeries.find(s => s.metricKey === key);
        if (!series || !series.snapshots[0]) return null;
        return series.snapshots[0];
    };

    // Revenue (Stripe)
    const revenueSnapshot = getMetricValue("stripe.revenue");
    const mrrSnapshot = getMetricValue("stripe.mrr");
    const churnSnapshot = getMetricValue("stripe.churn");
    const trialsSnapshot = getMetricValue("stripe.new_trials");

    // Errors (Sentry)
    const errorsSnapshot = getMetricValue("sentry.unresolved_issues");
    const criticalErrorsSnapshot = getMetricValue("sentry.critical_errors_24h");
    const errorSpikeSnapshot = getMetricValue("sentry.error_spike");

    // Support (Intercom)
    const openTicketsSnapshot = getMetricValue("intercom.open_tickets");
    const replyTimeSnapshot = getMetricValue("intercom.average_reply_time");

    // Growth (PostHog)
    const conversionSnapshot = getMetricValue("posthog.conversion_rate");
    const signupsSnapshot = getMetricValue("posthog.user_signups");
    const trafficSnapshot = getMetricValue("posthog.events_last_hour");

    // Ops (Vercel)
    const deployStatusSnapshot = getMetricValue("vercel.deployment_success");
    const downtimeSnapshot = getMetricValue("vercel.downtime_minutes");

    // Simple status helpers
    const getRevenueStatus = (val: number) => val > 2000 ? "success" : (val > 1000 ? "warning" : "error");
    const getErrorStatus = (val: number) => val === 0 ? "success" : (val < 10 ? "warning" : "error");
    const getSupportStatus = (val: number) => val === 0 ? "success" : (val < 5 ? "warning" : "error");
    const getGrowthStatus = (val: number) => val > 2 ? "success" : "neutral";
    const getOpsStatus = (val: number) => val === 1 ? "success" : "error";

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-slate-400 mt-1">
                        Overview for <span className="text-white font-medium">{activeWorkspaceData?.name || "All Workspaces"}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {allSeries.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-emerald-400">System Healthy</span>
                        </div>
                    )}
                    <form action="/api/cron/email-report" method="GET">
                        <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all text-sm font-medium">
                            <Mail className="w-4 h-4" />
                            Send Report
                        </button>
                    </form>
                </div>
            </div>

            {allSeries.length === 0 ? (
                /* Empty State */
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white">No metrics configured</h3>
                    <p className="mt-2 text-slate-400 max-w-md mx-auto">
                        Connect integrations to your workspaces to start tracking metrics.
                    </p>
                    <Link
                        href="/dashboard/integrations/new"
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Zap className="w-4 h-4" />
                        Add Integration
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-min">

                    {/* --- FINANCIALS (Hero Section) --- */}
                    <div className="xl:col-span-2 xl:row-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                        <h3 className="col-span-full text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Revenue
                        </h3>
                        {revenueSnapshot && (
                            <StatusCard
                                title="Today's Revenue"
                                value={`$${revenueSnapshot.value.toLocaleString()}`}
                                metricKey="stripe.revenue"
                                status={getRevenueStatus(revenueSnapshot.value)}
                                subtext="Daily Total"
                                icon={Wallet}
                                className="md:col-span-2 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10 border-indigo-500/10"
                            />
                        )}
                        {mrrSnapshot && (
                            <StatusCard
                                title="MRR"
                                value={`$${mrrSnapshot.value.toLocaleString()}`}
                                metricKey="stripe.mrr"
                                status={getRevenueStatus(mrrSnapshot.value)}
                                icon={TrendingUp}
                            />
                        )}
                        {trialsSnapshot && (
                            <StatusCard
                                title="New Trials"
                                value={trialsSnapshot.value}
                                metricKey="stripe.new_trials"
                                status="neutral"
                                subtext="Potential Users"
                                icon={Users}
                            />
                        )}
                    </div>

                    {/* --- HEALTH (Critical) --- */}
                    <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                        <h3 className="col-span-full text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Health & Ops
                        </h3>

                        {/* Red Button Spike Alert */}
                        {errorSpikeSnapshot && errorSpikeSnapshot.value > 100 && (
                            <div className="col-span-full rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 p-6 flex items-center justify-between animate-pulse cursor-pointer hover:bg-red-500/25 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/20 rounded-xl">
                                        <AlertOctagon className="w-8 h-8 text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">CRITICAL SPIKE DETECTED</h4>
                                        <p className="text-red-200 text-sm">Errors up +{errorSpikeSnapshot.value}% in last hour</p>
                                    </div>
                                    <div className="text-4xl">🔥</div>
                                </div>
                            </div>
                        )}

                        {criticalErrorsSnapshot && (
                            <StatusCard
                                title="Critical Errors"
                                value={criticalErrorsSnapshot.value}
                                metricKey="sentry.critical_errors_24h"
                                status={criticalErrorsSnapshot.value === 0 ? "success" : "error"}
                                subtext="Last 24h"
                                icon={AlertOctagon}
                            />
                        )}
                        {downtimeSnapshot && (
                            <StatusCard
                                title="Downtime"
                                value={`${downtimeSnapshot.value}m`}
                                metricKey="vercel.downtime_minutes"
                                status={downtimeSnapshot.value === 0 ? "success" : "error"}
                                icon={ShieldCheck}
                            />
                        )}
                    </div>

                    {/* --- GROWTH & SUPPORT (Long Tail) --- */}
                    <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
                        <h3 className="col-span-full text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Growth & Support
                        </h3>
                        {signupsSnapshot && (
                            <StatusCard
                                title="New Signups"
                                value={signupsSnapshot.value}
                                metricKey="posthog.user_signups"
                                status="success"
                                subtext="Last 24h"
                                icon={Users}
                            />
                        )}
                        {conversionSnapshot && (
                            <StatusCard
                                title="Conversion"
                                value={`${conversionSnapshot.value.toFixed(1)}%`}
                                metricKey="posthog.conversion_rate"
                                status={getGrowthStatus(conversionSnapshot.value)}
                                icon={TrendingUp}
                            />
                        )}
                        {openTicketsSnapshot && (
                            <StatusCard
                                title="Unanswered"
                                value={openTicketsSnapshot.value}
                                metricKey="intercom.open_tickets"
                                status={getSupportStatus(openTicketsSnapshot.value)}
                                icon={Mail}
                            />
                        )}
                        {/* Churn (grouped with growth as negative growth) */}
                        {churnSnapshot && (
                            <StatusCard
                                title="Churn Today"
                                value={`${churnSnapshot.value}`}
                                metricKey="stripe.churn"
                                status={churnSnapshot.value === 0 ? "success" : "error"}
                                subtext="Users Lost"
                                icon={Users}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

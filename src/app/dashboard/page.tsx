import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusCard } from "@/components/dashboard/status-card";
import { RefreshButton } from "@/components/dashboard/refresh-button";
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
    const getMetric = (key: string) => {
        const series = allSeries.find(s => s.metricKey === key);
        if (!series) return null;

        const snapshot = series.snapshots[0];

        return {
            exists: true,
            value: snapshot?.value ?? 0,
            hasData: !!snapshot,
            metadata: (snapshot?.metadata as any) || {},
            capturedAt: snapshot?.capturedAt
        };
    };

    // Revenue (Stripe)
    const revenue = getMetric("stripe.revenue");
    const mrr = getMetric("stripe.mrr");
    const churn = getMetric("stripe.churn");
    const trials = getMetric("stripe.new_trials");

    // Errors (Sentry)
    const errors = getMetric("sentry.unresolved_issues");
    const criticalErrors = getMetric("sentry.critical_errors_24h");
    const errorSpike = getMetric("sentry.error_spike");

    // Support (Intercom)
    const openTickets = getMetric("intercom.open_tickets");
    const replyTime = getMetric("intercom.average_reply_time");

    // Growth (PostHog)
    const conversion = getMetric("posthog.conversion_rate");
    const signups = getMetric("posthog.user_signups");
    const traffic = getMetric("posthog.events_last_hour");

    // Ops (Vercel)
    const deployStatus = getMetric("vercel.deployment_success");
    const downtime = getMetric("vercel.downtime_minutes");

    // Simple status helpers
    const getRevenueStatus = (m: any) => {
        if (!m || !m.hasData) return "neutral";
        const val = m.value;
        return val > 2000 ? "success" : (val > 1000 ? "warning" : "error");
    };

    // ... other helpers would need similar updates or just use raw value if handled inline
    const formatCurrency = (val: number) => `$${val.toLocaleString()}`;
    const formatPercent = (val: number) => `${val.toFixed(1)}%`;

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
                    <RefreshButton />
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
                        {revenue && (
                            <StatusCard
                                title="Today's Revenue"
                                value={revenue.hasData ? formatCurrency(revenue.value) : "--"}
                                metricKey="stripe.revenue"
                                status={getRevenueStatus(revenue)}
                                subtext="Daily Total"
                                icon={Wallet}
                                className="md:col-span-2 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10 border-indigo-500/10"
                            />
                        )}
                        {mrr && (
                            <StatusCard
                                title="MRR"
                                value={mrr.hasData ? formatCurrency(mrr.value) : "--"}
                                metricKey="stripe.mrr"
                                status={getRevenueStatus(mrr)}
                                icon={TrendingUp}
                            />
                        )}
                        {trials && (
                            <StatusCard
                                title="New Trials"
                                value={trials.hasData ? trials.value : "--"}
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
                        {errorSpike && errorSpike.hasData && errorSpike.value > 100 && (
                            <div className="col-span-full rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 p-6 flex items-center justify-between animate-pulse cursor-pointer hover:bg-red-500/25 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/20 rounded-xl">
                                        <AlertOctagon className="w-8 h-8 text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">CRITICAL SPIKE DETECTED</h4>
                                        <p className="text-red-200 text-sm">Errors up +{errorSpike.value}% in last hour</p>
                                    </div>
                                    <div className="text-4xl">🔥</div>
                                </div>
                            </div>
                        )}

                        {criticalErrors && (
                            <StatusCard
                                title="Critical Errors"
                                value={criticalErrors.hasData ? criticalErrors.value : "--"}
                                metricKey="sentry.critical_errors_24h"
                                status={!criticalErrors.hasData ? "neutral" : (criticalErrors.value === 0 ? "success" : "error")}
                                subtext="Last 24h"
                                icon={AlertOctagon}
                            />
                        )}
                        {downtime && (
                            <StatusCard
                                title="Downtime"
                                value={downtime.hasData ? `${downtime.value}m` : "--"}
                                metricKey="vercel.downtime_minutes"
                                status={!downtime.hasData ? "neutral" : (downtime.value === 0 ? "success" : "error")}
                                icon={ShieldCheck}
                            />
                        )}
                    </div>

                    {/* --- GROWTH & SUPPORT (Long Tail) --- */}
                    <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
                        <h3 className="col-span-full text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Growth & Support
                        </h3>
                        {signups && (
                            <StatusCard
                                title="New Signups"
                                value={signups.hasData ? signups.value : "--"}
                                metricKey="posthog.user_signups"
                                status={signups.hasData ? "success" : "neutral"}
                                subtext="Last 24h"
                                icon={Users}
                            />
                        )}
                        {conversion && (
                            <StatusCard
                                title="Conversion"
                                value={conversion.hasData ? formatPercent(conversion.value) : "--"}
                                metricKey="posthog.conversion_rate"
                                status={!conversion.hasData ? "neutral" : (conversion.value > 2 ? "success" : "neutral")}
                                icon={TrendingUp}
                            />
                        )}
                        {openTickets && (
                            <StatusCard
                                title="Unanswered"
                                value={openTickets.hasData ? openTickets.value : "--"}
                                metricKey="intercom.open_tickets"
                                status={!openTickets.hasData ? "neutral" : (openTickets.value === 0 ? "success" : "warning")}
                                icon={Mail}
                            />
                        )}
                        {/* Churn (grouped with growth as negative growth) */}
                        {churn && (
                            <StatusCard
                                title="Churn Today"
                                value={churn.hasData ? churn.value : "--"}
                                metricKey="stripe.churn"
                                status={!churn.hasData ? "neutral" : (churn.value === 0 ? "success" : "error")}
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

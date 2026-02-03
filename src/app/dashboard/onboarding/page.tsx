import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { IntegrationProvider } from "@prisma/client";

export default async function OnboardingPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // 1. Get Active Workspace
    const cookieStore = await cookies();
    const cookieWorkspaceId = cookieStore.get("unified_workspace_id")?.value;

    const membership = await prisma.workspaceMember.findFirst({
        where: { userId, workspaceId: cookieWorkspaceId },
        include: { workspace: true }
    });

    // Fallback if no cookie or invalid
    if (!membership) {
        // Just redirect to dashboard, let it handle scope
        redirect("/dashboard");
    }

    const workspaceId = membership.workspace.id;

    // 2. Fetch Existing Integrations
    const integrations = await prisma.integration.findMany({
        where: { workspaceId },
        select: { provider: true, status: true }
    });

    const isConnected = (p: IntegrationProvider) =>
        integrations.some(i => i.provider === p && i.status === "ACTIVE");

    const setupSteps = [
        {
            provider: IntegrationProvider.STRIPE,
            name: "Stripe",
            description: "Track Revenue & MRR",
            icon: "💰",
            color: "bg-indigo-500",
            connected: isConnected(IntegrationProvider.STRIPE)
        },
        {
            provider: IntegrationProvider.SENTRY,
            name: "Sentry",
            description: "Monitor Critical Errors",
            icon: "🐛",
            color: "bg-rose-500",
            connected: isConnected(IntegrationProvider.SENTRY)
        },
        {
            provider: IntegrationProvider.INTERCOM,
            name: "Intercom",
            description: "Customer Support Status",
            icon: "💬",
            color: "bg-blue-500",
            connected: isConnected(IntegrationProvider.INTERCOM)
        },
        {
            provider: IntegrationProvider.POSTHOG,
            name: "PostHog",
            description: "Product Analytics & Growth",
            icon: "📈",
            color: "bg-orange-500",
            connected: isConnected(IntegrationProvider.POSTHOG)
        },
        {
            provider: IntegrationProvider.VERCEL,
            name: "Vercel",
            description: "Deployment Status",
            icon: "🚀",
            color: "bg-black",
            connected: isConnected(IntegrationProvider.VERCEL)
        }
    ];

    const allConnected = setupSteps.every(s => s.connected);

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-10">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-white">Let's set up your dashboard 🚀</h1>
                <p className="text-slate-400 max-w-lg mx-auto">
                    Connect your services to see the pulse of your SaaS in one place.
                </p>
                {allConnected && (
                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                        🎉 All systems connected! <Link href="/dashboard" className="underline font-bold">Go to Dashboard</Link>
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {setupSteps.map((step) => (
                    <div
                        key={step.name}
                        className={`relative group rounded-2xl border p-6 transition-all ${step.connected
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : "border-slate-800 bg-slate-900/50 hover:bg-slate-900"
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl`}>
                                {step.icon}
                            </div>
                            {step.connected ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-400">
                                    Connected
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-slate-400">
                                    Not Connected
                                </span>
                            )}
                        </div>

                        <div className="mt-4">
                            <h3 className="text-lg font-medium text-white">{step.name}</h3>
                            <p className="mt-1 text-sm text-slate-400">{step.description}</p>
                        </div>

                        <div className="mt-6">
                            {step.connected ? (
                                <button disabled className="w-full rounded-lg bg-emerald-600/20 py-2 text-sm font-medium text-emerald-400 cursor-default">
                                    Active
                                </button>
                            ) : (
                                <Link
                                    href={`/dashboard/integrations/new?provider=${step.provider}`}
                                    className="block w-full rounded-lg bg-slate-800 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-600"
                                >
                                    Connect
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center mt-12">
                <Link href="/dashboard" className="text-slate-500 hover:text-white transition-colors">
                    Skip for now &rarr;
                </Link>
            </div>
        </div>
    );
}

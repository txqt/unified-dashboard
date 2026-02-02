import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createIntegration } from "@/app/actions/create-integration";

export default async function NewIntegrationPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // Fetch workspaces for selection
    const members = await prisma.workspaceMember.findMany({
        where: { userId },
        include: { workspace: true },
    });

    return (
        <div className="mx-auto max-w-2xl text-white">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Add New Integration</h1>
                <p className="text-slate-400">Connect a new provider to your workspace</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                {members.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-white">No workspaces found</h3>
                        <p className="mt-2 text-slate-400">You need to create a workspace before you can add integrations.</p>
                        <a
                            href="/dashboard/workspaces/new"
                            className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            Create Your First Workspace
                        </a>
                    </div>
                ) : (
                    <form action={createIntegration} className="space-y-6">
                        {/* Workspace Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                Workspace
                            </label>
                            <select
                                name="workspaceId"
                                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                required
                            >
                                {members.map((m) => (
                                    <option key={m.workspaceId} value={m.workspaceId}>
                                        {m.workspace.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Provider Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                Provider
                            </label>
                            <select
                                name="provider"
                                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                required
                            >
                                <option value="SENTRY">Sentry</option>
                                <option value="VERCEL">Vercel</option>
                                <option value="POSTHOG">PostHog</option>
                            </select>
                        </div>

                        {/* Credentials */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                API Token / Key
                            </label>
                            <input
                                type="password"
                                name="secretValue"
                                placeholder="ske_..."
                                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                required
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Stored securely using AES-256 encryption.
                            </p>
                        </div>

                        {/* Metadata (Simulating specific fields for MVP) */}
                        {/* In a real app, these would dynamic based on provider selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300">
                                    Project Slug / ID
                                </label>
                                <input
                                    type="text"
                                    name="projectSlug"
                                    placeholder="my-project"
                                    className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">
                                    Organization Slug
                                </label>
                                <input
                                    type="text"
                                    name="orgSlug"
                                    placeholder="my-org (Sentry only)"
                                    className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
                            >
                                Connect Integration
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

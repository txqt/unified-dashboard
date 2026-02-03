"use client";

import { useActionState, useState, useEffect } from "react";
import { createIntegration } from "@/app/actions/create-integration";
import { fetchVercelProjects, type VercelProject } from "@/app/actions/fetch-vercel-projects";
import { ProjectSelector } from "./project-selector";

interface WorkspaceMember {
    workspaceId: string;
    workspace: {
        name: string;
    };
}

export function NewIntegrationForm({
    members
}: {
    members: WorkspaceMember[]
}) {
    const [state, formAction, isPending] = useActionState(createIntegration, null);

    // Integration Setup State
    const [provider, setProvider] = useState("SENTRY");
    const [apiKey, setApiKey] = useState("");

    // Vercel Specific State
    const [vercelProjects, setVercelProjects] = useState<VercelProject[]>([]);
    const [isFetchingProjects, setIsFetchingProjects] = useState(false);
    const [openProjectSelect, setOpenProjectSelect] = useState(false);
    const [selectedProject, setSelectedProject] = useState("");

    // Debounce fetching projects when API key changes for Vercel
    useEffect(() => {
        if (provider !== "VERCEL" || apiKey.length < 20) return;

        const timer = setTimeout(async () => {
            setIsFetchingProjects(true);
            const result = await fetchVercelProjects(apiKey);
            setIsFetchingProjects(false);

            if (result.success && result.projects) {
                setVercelProjects(result.projects);
                setOpenProjectSelect(true);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [apiKey, provider]);

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            {state?.error && (
                <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {state.error}
                    </div>
                </div>
            )}

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
                <form action={formAction} className="space-y-6">
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
                            value={provider}
                            onChange={(e) => {
                                setProvider(e.target.value);
                                setApiKey("");
                                setVercelProjects([]);
                                setSelectedProject("");
                            }}
                            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                            required
                        >
                            <option value="SENTRY">Sentry</option>
                            <option value="VERCEL">Vercel</option>
                            <option value="POSTHOG">PostHog</option>
                            <option value="STRIPE">Stripe</option>
                            <option value="INTERCOM">Intercom</option>
                        </select>
                    </div>

                    {/* Credentials */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300">
                            {provider === "VERCEL" ? "Vercel Access Token" : "API Token / Key"}
                        </label>
                        <input
                            type="password"
                            name="secretValue"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={provider === "VERCEL" ? "Paste your token to fetch projects..." : "ske_..."}
                            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                            required
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Stored securely using AES-256 encryption.
                        </p>
                    </div>

                    {/* Metadata - Dynamic Fields */}
                    {provider === "VERCEL" && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Select Project
                            </label>
                            <ProjectSelector
                                projects={vercelProjects}
                                isOpen={openProjectSelect}
                                onOpenChange={setOpenProjectSelect}
                                isLoading={isFetchingProjects}
                                disabled={apiKey.length < 5}
                                onSelect={(id, name) => setSelectedProject(name)}
                            />
                            {/* Hidden input to submit the selected project as projectSlug */}
                            <input type="hidden" name="projectSlug" value={selectedProject} />
                            {/* Fallback for manual entry if needed, or if user wants to override */}
                            {!isFetchingProjects && vercelProjects.length === 0 && apiKey.length > 20 && (
                                <div className="mt-2 text-xs text-amber-400">
                                    Could not find projects? Verify your token has proper scopes.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Standard Fields for Non-Vercel or if user enters manually */}
                    {provider !== "VERCEL" && (
                        <>
                            {/* Project Slug: Needed for Sentry & PostHog */}
                            {(provider === "SENTRY" || provider === "POSTHOG") && (
                                <div className={provider === "SENTRY" ? "grid grid-cols-2 gap-4" : ""}>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300">
                                            Project Slug / ID
                                        </label>
                                        <input
                                            type="text"
                                            name="projectSlug"
                                            placeholder="my-project"
                                            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                            required={provider === "SENTRY" || provider === "POSTHOG"}
                                        />
                                    </div>

                                    {/* Org Slug: Needed for Sentry only */}
                                    {provider === "SENTRY" && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300">
                                                Organization Slug
                                            </label>
                                            <input
                                                type="text"
                                                name="orgSlug"
                                                placeholder="my-org (Sentry only)"
                                                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                                required={provider === "SENTRY"}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Connecting...
                                </>
                            ) : (
                                "Connect Integration"
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

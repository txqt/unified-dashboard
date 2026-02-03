"use client";

import { useTransition, useState } from "react";
import { Integration } from "@prisma/client";
import { updateIntegration } from "@/app/actions/update-integration";

interface IntegrationSettingsFormProps {
    integration: Integration;
}

export function IntegrationSettingsForm({ integration }: IntegrationSettingsFormProps) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initial values from metadata
    const metadata = (integration.publicMetadata as Record<string, any>) || {};
    const [projectSlug, setProjectSlug] = useState(metadata.projectSlug || metadata.projectId || "");
    const [orgSlug, setOrgSlug] = useState(metadata.organizationSlug || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        startTransition(async () => {
            const formData = {
                publicMetadata: {
                    projectSlug: projectSlug, // Normalize to projectSlug
                    organizationSlug: orgSlug // Optional, mostly for Sentry
                }
            };

            const result = await updateIntegration(integration.id, formData);

            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: "Settings updated successfully" });
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">

            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    Project ID / Slug
                </label>
                <div className="text-xs text-gray-500 mb-2">
                    Found in your provider's URL or settings (e.g., Vercel Project ID).
                </div>
                <input
                    type="text"
                    value={projectSlug}
                    onChange={(e) => setProjectSlug(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. prj_..."
                />
            </div>

            {integration.provider === "SENTRY" && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                        Organization Slug
                    </label>
                    <input
                        type="text"
                        value={orgSlug}
                        onChange={(e) => setOrgSlug(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. my-org"
                    />
                </div>
            )}

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isPending ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </button>
            </div>
        </form>
    );
}

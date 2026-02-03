import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { IntegrationStatus } from "@prisma/client";
import { IntegrationSettingsForm } from "@/components/dashboard/integrations/integration-settings-form";
import { ArrowLeft } from "lucide-react";

interface IntegrationDetailsPageProps {
    params: Promise<{ id: string }>;
}

export default async function IntegrationDetailsPage({ params }: IntegrationDetailsPageProps) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const { id } = await params;

    // Fetch integration with workspace to verify ownership
    const integration = await prisma.integration.findUnique({
        where: { id },
        include: {
            workspace: {
                include: {
                    members: {
                        where: { userId }
                    }
                }
            }
        }
    });

    if (!integration) {
        notFound();
    }

    // Verify user is a member of the workspace
    if (integration.workspace.members.length === 0) {
        // User is not a member of this workspace
        notFound();
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Link
                    href={`/dashboard/integrations?workspace=${integration.workspaceId}`}
                    className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Integrations
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {integration.provider} Integration
                            <span className={`text-xs px-2 py-1 rounded-full border ${integration.status === IntegrationStatus.ACTIVE
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : integration.status === IntegrationStatus.ERROR
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                {integration.status}
                            </span>
                        </h1>
                        <p className="text-gray-400 mt-1">
                            Configure settings for your {integration.provider} connection.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-6">Configuration</h2>
                <IntegrationSettingsForm integration={integration} />
            </div>

            <div className="mt-8 bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                <h3 className="text-blue-400 font-medium mb-2">Troubleshooting</h3>
                <p className="text-sm text-gray-400">
                    If your data isn't syncing, check the <strong>Project ID</strong> / <strong>Slug</strong> above.
                    Ensure it exactly matches the ID from your provider's URL.
                </p>
            </div>
        </div>
    );
}

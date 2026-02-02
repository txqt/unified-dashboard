import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { deleteIntegration } from "@/app/actions/integration-actions";
import Link from "next/link";
import { IntegrationStatus } from "@prisma/client";

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const params = await searchParams;
    let workspaceId = params.workspace;

    // Fallback: Get first workspace if not specified
    if (!workspaceId) {
        const firstMembership = await prisma.workspaceMember.findFirst({
            where: { userId },
            orderBy: { workspace: { createdAt: 'desc' } }
        });
        if (firstMembership) {
            workspaceId = firstMembership.workspaceId;
        } else {
            return (
                <div className="p-8 text-center">
                    <p>No workspaces found.</p>
                    <Link href="/dashboard/workspaces/new" className="text-blue-500 underline">Create Workspace</Link>
                </div>
            );
        }
    }

    const integrations = await prisma.integration.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { metricSeries: true } } }
    });

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true }
    });

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Integrations</h1>
                    <p className="text-gray-400 text-sm">Managing integrations for <span className="text-white font-medium">{workspace?.name}</span></p>
                </div>
                <Link
                    href={`/dashboard/integrations/new?workspace=${workspaceId}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                    Add Integration
                </Link>
            </div>

            <div className="space-y-4">
                {integrations.map((integration) => (
                    <div key={integration.id} className="bg-white/5 border border-white/10 rounded-lg p-6 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{integration.provider}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${integration.status === IntegrationStatus.ACTIVE ? 'bg-green-500/20 text-green-300' :
                                    integration.status === IntegrationStatus.ERROR ? 'bg-red-500/20 text-red-300' :
                                        'bg-yellow-500/20 text-yellow-300'
                                    }`}>
                                    {integration.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                                {integration.publicMetadata && (
                                    <span className="mr-4">
                                        Project: {(integration.publicMetadata as any).projectSlug || 'N/A'}
                                    </span>
                                )}
                                <span>{integration._count.metricSeries} Metrics</span>
                                <span className="mx-2">•</span>
                                <span>Added {formatDistanceToNow(integration.createdAt)} ago</span>
                            </div>
                        </div>

                        <form action={async (formData) => {
                            "use server"
                            await deleteIntegration(formData)
                        }}>
                            <input type="hidden" name="integrationId" value={integration.id} />
                            <input type="hidden" name="workspaceId" value={workspaceId} />
                            <button
                                type="submit"
                                className="text-gray-500 hover:text-red-500 px-3 py-1 text-sm transition-colors border border-transparent hover:border-red-500/20 rounded"
                            >
                                Remove
                            </button>
                        </form>
                    </div>
                ))}
            </div>

            {integrations.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                    <p>No integrations connected.</p>
                </div>
            )}
        </div>
    );
}

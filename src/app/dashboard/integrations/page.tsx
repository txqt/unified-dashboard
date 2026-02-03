import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { deleteIntegration } from "@/app/actions/integration-actions";
import Link from "next/link";
import { IntegrationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Trash2 } from "lucide-react";

import { cookies } from "next/headers";

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const params = await searchParams;
    // 1. Determine potential workspaceId
    let candidateId = params.workspace;

    if (!candidateId) {
        const cookieStore = await cookies();
        candidateId = cookieStore.get("unified_workspace_id")?.value;
    }

    // 2. Verify existence and access
    let workspace = null;
    if (candidateId) {
        // Ensure user actually belongs to this workspace
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: candidateId,
                    userId
                }
            },
            include: { workspace: true }
        });
        if (membership) {
            workspace = membership.workspace;
        }
    }

    // 3. Fallback: Get first workspace if verify failed
    if (!workspace) {
        const firstMembership = await prisma.workspaceMember.findFirst({
            where: { userId },
            orderBy: { workspace: { createdAt: 'desc' } },
            include: { workspace: true }
        });

        if (firstMembership) {
            workspace = firstMembership.workspace;
        } else {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50dvh] space-y-4">
                    <p className="text-muted-foreground">No workspaces found.</p>
                    <Button asChild>
                        <Link href="/dashboard/workspaces/new">Create Workspace</Link>
                    </Button>
                </div>
            );
        }
    }

    const workspaceId = workspace.id;

    const integrations = await prisma.integration.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { metricSeries: true } } }
    });

    const getStatusVariant = (status: IntegrationStatus) => {
        switch (status) {
            case IntegrationStatus.ACTIVE: return "success";
            case IntegrationStatus.ERROR: return "destructive";
            case IntegrationStatus.DISCONNECTED: return "secondary";
            default: return "warning";
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                    <p className="text-muted-foreground">
                        Manage integrations for <span className="font-medium text-foreground">{workspace?.name}</span>
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/dashboard/integrations/new?workspace=${workspaceId}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Integration
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4">
                {integrations.map((integration) => (
                    <Card key={integration.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-3">
                                    {integration.provider}
                                    <Badge variant={getStatusVariant(integration.status)}>
                                        {integration.status}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Added {formatDistanceToNow(integration.createdAt)} ago
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/integrations/${integration.id}`}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Manage
                                    </Link>
                                </Button>

                                <form action={async (formData) => {
                                    "use server"
                                    await deleteIntegration(formData)
                                }}>
                                    <input type="hidden" name="integrationId" value={integration.id} />
                                    <input type="hidden" name="workspaceId" value={workspaceId} />
                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground flex gap-4">
                                {integration.publicMetadata && (
                                    <span>
                                        Project: {(integration.publicMetadata as any).projectSlug || 'N/A'}
                                    </span>
                                )}
                                <span>{integration._count.metricSeries} Metrics</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {integrations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-lg bg-white/5 space-y-4">
                    <p className="text-muted-foreground">No integrations connected yet.</p>
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/integrations/new?workspace=${workspaceId}`}>
                            Connect your first integration
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

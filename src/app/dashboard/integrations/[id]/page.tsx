import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { IntegrationStatus } from "@prisma/client";
import { IntegrationSettingsForm } from "@/components/dashboard/integrations/integration-settings-form";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

    const getStatusVariant = (status: IntegrationStatus) => {
        switch (status) {
            case IntegrationStatus.ACTIVE: return "success";
            case IntegrationStatus.ERROR: return "destructive";
            case IntegrationStatus.DISCONNECTED: return "secondary";
            default: return "warning";
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                    <Link href={`/dashboard/integrations?workspace=${integration.workspaceId}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Integrations
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {integration.provider} Integration
                            <Badge variant={getStatusVariant(integration.status)}>
                                {integration.status}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground">
                            Configure settings for your {integration.provider} connection.
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <IntegrationSettingsForm integration={integration} />
                </CardContent>
            </Card>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-400">
                <h3 className="font-medium mb-1 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Troubleshooting
                </h3>
                <p className="text-blue-300/80">
                    If your data isn't syncing, check the <strong>Project ID</strong> / <strong>Slug</strong> above.
                    Ensure it exactly matches the ID from your provider's URL.
                </p>
            </div>
        </div>
    );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { IntegrationService } from "@/lib/services/integration-service";
import { IntegrationProvider } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

export async function createIntegration(_prevState: any, formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        return { error: "Unauthorized" };
    }

    const workspaceId = formData.get("workspaceId") as string;
    const provider = formData.get("provider") as IntegrationProvider;
    const secretValue = formData.get("secretValue") as string;
    const projectSlug = formData.get("projectSlug") as string;
    const orgSlug = formData.get("orgSlug") as string;

    if (!workspaceId || !provider || !secretValue) {
        return { error: "Missing required fields" };
    }

    // Construct metadata based on provider
    const publicMetadata: Record<string, unknown> = {
        projectSlug,
    };

    if (provider === "SENTRY" && orgSlug) {
        publicMetadata.organizationSlug = orgSlug;
    }

    const prisma = (await import("@/lib/prisma")).default;

    // Check for existing integration to avoid Unique constraint error
    const existing = await prisma.integration.findUnique({
        where: {
            workspaceId_provider: {
                workspaceId,
                provider
            }
        }
    });

    if (existing) {
        return { error: `Workspace already has a ${provider} integration.` };
    }

    try {
        const integration = await IntegrationService.createIntegration({
            workspaceId,
            provider,
            secretValue,
            publicMetadata
        });

        // AUTO-PROVISION METRICS based on Provider
        // This ensures the user sees something immediately.
        if (provider === "SENTRY") {
            await prisma.metricSeries.create({
                data: {
                    workspaceId,
                    integrationId: integration.id,
                    metricKey: "sentry.unresolved_issues",
                    displayName: "Unresolved Issues",
                    settings: {
                        organizationSlug: orgSlug,
                        projectSlug: projectSlug
                    }
                }
            });
        } else if (provider === "VERCEL") {
            await prisma.metricSeries.create({
                data: {
                    workspaceId,
                    integrationId: integration.id,
                    metricKey: "vercel.deployment_success",
                    displayName: "Production Deployment",
                    settings: { projectId: projectSlug }
                }
            });
        } else if (provider === "POSTHOG") {
            await prisma.metricSeries.create({
                data: {
                    workspaceId,
                    integrationId: integration.id,
                    metricKey: "posthog.events_last_hour",
                    displayName: "Total Events (1h)",
                    settings: { projectId: projectSlug }
                }
            });
        }

        // TRIGGER INITIAL FETCH
        console.log("Triggering initial sync...");
        const { PipelineWorker } = await import("@/lib/pipeline/worker");
        const worker = new PipelineWorker();
        await worker.runSync();

    } catch (error) {
        console.error("Failed to create integration:", error);
        return { error: error instanceof Error ? error.message : "Failed to create integration" };
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}

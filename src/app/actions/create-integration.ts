"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { IntegrationService } from "@/lib/services/integration-service";
import { IntegrationProvider } from "@/generated/prisma/client";
import { auth } from "@clerk/nextjs/server";

export async function createIntegration(formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const workspaceId = formData.get("workspaceId") as string;
    const provider = formData.get("provider") as IntegrationProvider;
    const secretValue = formData.get("secretValue") as string;
    const projectSlug = formData.get("projectSlug") as string;
    const orgSlug = formData.get("orgSlug") as string;

    if (!workspaceId || !provider || !secretValue) {
        throw new Error("Missing required fields");
    }

    // Construct metadata based on provider
    const publicMetadata: Record<string, unknown> = {
        projectSlug,
    };

    if (provider === "SENTRY" && orgSlug) {
        publicMetadata.organizationSlug = orgSlug;
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
        const prisma = (await import("@/lib/prisma")).default;

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
        // We import dynamically to avoid heavier cold start on the action if possible
        const { PipelineWorker } = await import("@/lib/pipeline/worker");
        const worker = new PipelineWorker();
        // In a real background job system, we would enqueue this. 
        // For MVP, we await it briefly or fire-and-forget (but Vercel functions might kill it).
        // Let's await it to ensure 'success' means 'data is there'.
        console.log("Triggering initial sync...");
        await worker.runSync();

    } catch (error) {
        console.error("Failed to create integration:", error);
        // In a real app, return form errors. For MVP, throw.
        throw new Error("Failed to create integration");
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}

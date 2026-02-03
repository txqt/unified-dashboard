"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { IntegrationService } from "@/lib/services/integration-service";
import { IntegrationProvider } from "@prisma/client";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Define strict return type for the action
type ActionState = {
    error?: string;
    success?: boolean;
};

export async function createIntegration(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const { userId } = await auth();
    if (!userId) {
        return { error: "Unauthorized" };
    }

    const schema = z.object({
        workspaceId: z.string().cuid(),
        provider: z.nativeEnum(IntegrationProvider),
        secretValue: z.string().min(1, "Secret value is required"),
        projectSlug: z.string().optional(),
        orgSlug: z.string().optional(),
    });

    const parseResult = schema.safeParse({
        workspaceId: formData.get("workspaceId"),
        provider: formData.get("provider"),
        secretValue: formData.get("secretValue"),
        projectSlug: formData.get("projectSlug") || undefined,
        orgSlug: formData.get("orgSlug") || undefined,
    });

    if (!parseResult.success) {
        // Structured validation error logging could go here if needed
        return { error: "Invalid input data: " + parseResult.error.issues.map(i => i.path + ": " + i.message).join(", ") };
    }

    const { workspaceId, provider, secretValue, projectSlug, orgSlug } = parseResult.data;

    // Construct metadata based on provider
    const publicMetadata: Record<string, unknown> = {
        projectSlug,
    };

    if (provider === "SENTRY" && orgSlug) {
        publicMetadata.organizationSlug = orgSlug;
    }

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
        await IntegrationService.createIntegration({
            workspaceId,
            provider,
            secretValue,
            publicMetadata
        });

        // TRIGGER INITIAL FETCH
        // We do this asynchronously but await it so the user sees data immediately on redirect.
        // In a larger system, this might be offloaded to a queue (BullMQ/Inngest).
        logger.info(`[CreateIntegration] Triggering initial sync for workspace ${workspaceId}`);

        // Dynamic import to avoid circular dependencies if any, though likely fine here
        const { PipelineWorker } = await import("@/lib/pipeline/worker");
        const worker = new PipelineWorker();
        await worker.runSync();

        logger.info(`[CreateIntegration] Initial sync complete`);

    } catch (error) {
        logger.error("Failed to create integration", { error: String(error) });
        return { error: error instanceof Error ? error.message : "Failed to create integration" };
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}
